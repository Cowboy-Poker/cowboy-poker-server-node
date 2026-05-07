import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { createShuffledDeck, dealCards } from "../../../utils/deck.js";
import { removeRoom } from "../../../session/pokerRoom.js";
import { buildQueueFrom, broadcastBetTurn } from "./betTurnHelper.js";
import { getUserSession } from "../../../session/userSession.js";

// NoticeType: SYSTEM=0, ACTION=1, WINNER=2, COMMUNITY=3
const broadcastNotice = (room, message, noticeType = 0) => {
  room.broadcast(createResponse(PACKET_TYPE.S_NOTICE, { message, noticeType }));
};

// roomEnterHandler, 게임 종료 후 자동 재시작 시점에서 호출
export const startGame = async (room) => {
  // 1. 예약된 퇴장 플레이어 먼저 처리
  const leftUsers = room.processPendingLeaves();
  if (leftUsers.length > 0) {
    for (const userId of leftUsers) {
      console.log(`[startGame] 예약 퇴장 처리 | userId=${userId}`);
      room.broadcast(createResponse(PACKET_TYPE.S_LEAVE_ROOM, { userId }));
    }
    if (room.isEmpty()) {
      removeRoom(room.roomId);
      return;
    }
  }

  // 2. 2명 미만이면 시작 안 함
  if (room.getPlayers().length < 2) {
    room.setWaiting();
    console.log(
      `[startGame] 플레이어 부족으로 게임 시작 취소 | roomId=${room.roomId}`,
    );
    return;
  }

  // 3. 첫 게임이 아니면 블라인드 로테이션
  if (!room.isFirstGame) {
    room.rotateBlinds();
  }
  room.isFirstGame = false;
  room.setInGame();

  console.log(
    `[startGame] 게임 시작 | roomId=${room.roomId} | SB=${room.sbSeat} | BB=${room.bbSeat}`,
  );

  // 4. 카드 딜링 (먼저 모두 뽑고 gameState에 저장)
  const deck = createShuffledDeck();
  const players = [...room.getPlayers()].sort(
    (a, b) => a.seatNumber - b.seatNumber,
  );

  const handCardsMap = new Map();
  for (const p of players) {
    handCardsMap.set(p.seatNumber, dealCards(deck, 2));
  }

  // 5. gameState 초기화 — Redis에서 각 플레이어 실제 잔액 로드
  // 방 blindAmount = 빅 블라인드 / 스몰은 floor(BB/2)
  const bigBlind = room.bigBlind;
  const smallBlind = room.smallBlind;

  const playerStates = new Map();
  for (const p of players) {
    const session = await getUserSession(p.userId);
    const balance = parseInt(session?.balance ?? 0);
    playerStates.set(p.seatNumber, {
      handCards: handCardsMap.get(p.seatNumber),
      roundBet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      hasActed: false,
      balance,
    });
  }

  // 블라인드 자동 포스트 (강제 베팅이므로 hasActed = false 유지)
  const sbState = playerStates.get(room.sbSeat);
  sbState.roundBet = smallBlind;
  sbState.totalBet = smallBlind;
  sbState.balance -= smallBlind;

  const bbState = playerStates.get(room.bbSeat);
  bbState.roundBet = bigBlind;
  bbState.totalBet = bigBlind;
  bbState.balance -= bigBlind;

  const allSeats = players.map((p) => p.seatNumber);
  const utgSeat = room.getUTGSeat();
  const bettingQueue = buildQueueFrom(allSeats, utgSeat);

  room.initGameState({
    phase: 0, // PRE_FLOP
    pot: smallBlind + bigBlind,
    communityCards: [],
    deck,
    currentBet: bigBlind,
    minRaise: bigBlind,
    bettingQueue,
    playerStates,
  });

  // 6. 각 플레이어에게 S_START_GAME (핸드카드 개별 전송)
  const playerInfos = players.map((p) => ({
    userId: p.userId,
    seatNumber: p.seatNumber,
    balance: playerStates.get(p.seatNumber).balance,
  }));

  for (const p of players) {
    p.socket.write(
      createResponse(PACKET_TYPE.S_START_GAME, {
        mySeatNumber: p.seatNumber,
        sbSeatNumber: room.sbSeat,
        bbSeatNumber: room.bbSeat,
        handCards: handCardsMap.get(p.seatNumber),
        players: playerInfos,
      }),
    );
  }

  // 7. 게임 시작 공지
  const sbPlayer = room.getPlayers().find((p) => p.seatNumber === room.sbSeat);
  const bbPlayer = room.getPlayers().find((p) => p.seatNumber === room.bbSeat);
  broadcastNotice(
    room,
    `새 게임이 시작되었습니다. SB: ${sbPlayer?.userId}(${smallBlind}), BB: ${bbPlayer?.userId}(${bigBlind})`,
  );

  // 8. UTG에게 첫 베팅 차례 알림 (차례인 플레이어만 버튼 활성화)
  const utgPlayer = room.getPlayers().find((p) => p.seatNumber === utgSeat);
  const utgState = room.gameState.playerStates.get(utgSeat);
  broadcastBetTurn(room, utgPlayer, utgState, room.gameState);
};
