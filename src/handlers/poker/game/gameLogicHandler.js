import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { dealCards } from "../../../utils/deck.js";
import { evaluateBestHand } from "../../../utils/handEvaluator.js";
import { getRoomList } from "../../../session/pokerRoom.js";
import { startGame } from "./gameStartHandler.js";
import { buildQueueFrom, broadcastBetTurn } from "./betTurnHelper.js";
import { config } from "../../../config/config.js";

// 현재 플레이어가 속한 방 반환
const findRoomByUserId = (userId) => {
  return getRoomList().find((r) => r.getPlayer(userId)) ?? null;
};

// NoticeType 상수 (proto enum NoticeType과 동일 순서)
const NOTICE_TYPE = { SYSTEM: 0, ACTION: 1, WINNER: 2, COMMUNITY: 3 };

// 로그 메시지를 방 전체에 브로드캐스트
const broadcastNotice = (room, message, noticeType = NOTICE_TYPE.SYSTEM) => {
  room.broadcast(createResponse(PACKET_TYPE.S_NOTICE, { message, noticeType }));
};

// ─────────────────────────────────────────────
// 게임 종료: 팟 분배 및 결과 전송 후 다음 게임 시작
// ─────────────────────────────────────────────
const endGame = (room, gs, showdown = false) => {
  const players = room.getPlayers();

  // 결과 계산
  const results = players.map((p) => {
    const ps = gs.playerStates.get(p.seatNumber);
    return {
      userId: p.userId,
      seatNumber: p.seatNumber,
      handCards: ps.handCards,
      totalBet: ps.totalBet,
      folded: ps.folded,
      score: 0,
      handRank: "",
    };
  });

  // 쇼다운: 패 평가
  if (showdown) {
    for (const r of results) {
      if (!r.folded) {
        const { score, handName } = evaluateBestHand(
          r.handCards,
          gs.communityCards,
        );
        r.score = score;
        r.handRank = handName;
      }
    }
  }

  // 승자 결정 (폴드하지 않은 플레이어 중 최고 점수)
  const activePlayers = results.filter((r) => !r.folded);
  activePlayers.sort((a, b) => b.score - a.score);
  const topScore = activePlayers[0]?.score ?? 0;
  const winners = activePlayers.filter((r) => r.score === topScore);
  const sharePerWinner = Math.floor(gs.pot / winners.length);

  for (const w of winners) {
    w.isWinner = true;
    w.gainAmount = sharePerWinner - w.totalBet;
  }
  for (const r of results) {
    if (!r.isWinner) r.gainAmount = -r.totalBet;
  }

  console.log(
    `[endGame] roomId=${room.roomId} | showdown=${showdown} | pot=${gs.pot} | winner=${winners.map((w) => w.userId).join(",")}`,
  );

  // 공통 results 빌드
  // 진짜 쇼다운(showdown=true): 비폴드 플레이어만 홀 카드·핸드랭크 공개. 폴드한 사람은 빈 배열.
  // 폴드 펏 등(showdown=false): 쇼다운 아님 — 홀 카드·핸드랭크 모두 비공개
  const builtResults = results.map((r) => {
    const ps = gs.playerStates.get(r.seatNumber);
    const gain = r.gainAmount ?? -r.totalBet;
    const showCards = showdown && !r.folded;
    return {
      userId: r.userId,
      seatNumber: r.seatNumber,
      handCards: showCards ? r.handCards : [],
      gainAmount: gain,
      isWinner: r.isWinner ?? false,
      handRank: showCards ? r.handRank : "",
      finalBalance: ps.balance + (r.isWinner ? gain + r.totalBet : 0),
    };
  });

  // 쇼다운 시 revealTargetSeatNumber: 개인별로 다르게 계산
  // - 루저(비폴드): 승자(들) 중 첫 번째 시트
  // - 위너: 비폴드 플레이어 중 자신 바로 다음으로 높은 점수 보유자 시트 (없으면 0)
  // - 폴드: 0 (모션 없음)
  // - 쇼다운 아님: 0
  const winnerSeat = winners[0]?.seatNumber ?? 0;

  // activePlayers는 이미 점수 내림차순 정렬된 상태 (58~59번째 줄)
  // 쇼다운에서만 의미 있는 rankedActive
  const rankedActive = showdown ? activePlayers : [];

  const getRevealTarget = (r) => {
    if (!showdown || r.folded) return 0;
    if (!r.isWinner) {
      // 루저: 승자 시트
      return winnerSeat;
    }
    // 위너: 나 다음으로 높은 점수 보유자 (동점 위너 제외)
    const myIndex = rankedActive.findIndex((p) => p.seatNumber === r.seatNumber);
    // 동점 위너가 여럿이면 myIndex 이후에 다른 위너가 올 수 있으므로
    // 위너가 아닌 첫 번째 플레이어를 찾음
    const nextOpponent = rankedActive.find(
      (p, i) => i > myIndex && !p.isWinner,
    ) ?? rankedActive.find((p) => !p.isWinner); // 없으면 전체에서 첫 번째 패배자
    return nextOpponent?.seatNumber ?? 0;
  };

  // 개인별 전송 (revealTargetSeatNumber가 수신자마다 다름)
  for (const player of players) {
    const myResult = results.find((r) => r.seatNumber === player.seatNumber);
    const revealTargetSeatNumber = myResult ? getRevealTarget(myResult) : 0;
    player.socket.write(
      createResponse(PACKET_TYPE.S_GAME_RESULT, {
        isShowdown: showdown,
        revealTargetSeatNumber,
        results: builtResults,
      }),
    );
  }

  const winnerNames = winners.map((w) => w.userId).join(", ");
  if (showdown) {
    broadcastNotice(room, `${winnerNames}가 ${winners[0].handRank}(으)로 ${sharePerWinner} 칩을 획득했습니다.`, NOTICE_TYPE.WINNER);
  } else {
    broadcastNotice(room, `${winnerNames}가 팟 ${sharePerWinner} 칩을 획득했습니다.`, NOTICE_TYPE.WINNER);
  }

  room.clearGameState();
  // 핸드 사이(~nextGameDelayMs): gameState 없음 + 대기 상태 → 입장 허용, 퇴장은 예약 없이 즉시(C_LEAVE_ROOM / 끊김)
  room.setWaiting();

  // 잠시 후 다음 게임 자동 시작
  setTimeout(() => startGame(room), config.poker.nextGameDelayMs);
};

// ─────────────────────────────────────────────
// 베팅 라운드 종료: 페이즈 전진 또는 게임 종료
// ─────────────────────────────────────────────
const advanceBettingRound = (room, gs) => {
  // 라운드 베팅 초기화
  for (const ps of gs.playerStates.values()) {
    ps.roundBet = 0;
    ps.hasActed = false;
  }
  gs.currentBet = 0;
  gs.minRaise = room.bigBlind;
  gs.phase += 1;

  if (gs.phase >= 4) {
    // SHOWDOWN
    endGame(room, gs, true);
    return;
  }

  // 커뮤니티 카드 공개
  const cardsToDeal = gs.phase === 1 ? 3 : 1; // FLOP: 3장, TURN/RIVER: 1장
  const newCards = dealCards(gs.deck, cardsToDeal);
  gs.communityCards.push(...newCards);

  room.broadcast(
    createResponse(PACKET_TYPE.S_OPEN_COMMUNITY_CARDS, {
      phase: gs.phase,
      cards: newCards,
    }),
  );

  const phaseNames = ["", "플랍", "턴", "리버"];
  broadcastNotice(room, `${phaseNames[gs.phase]} 카드가 공개되었습니다.`, NOTICE_TYPE.COMMUNITY);

  // 액션 가능한 플레이어 (폴드X, 올인X) 큐 구성 (SB부터)
  const activeSeats = [...gs.playerStates.entries()]
    .filter(([, ps]) => !ps.folded && !ps.allIn)
    .map(([seat]) => seat);

  if (activeSeats.length === 0) {
    // 모두 올인 → 페이즈만 계속 진행
    advanceBettingRound(room, gs);
    return;
  }

  gs.bettingQueue = buildQueueFrom(activeSeats, room.sbSeat);

  const nextSeat = gs.bettingQueue[0];
  const nextPlayer = room.getPlayers().find((p) => p.seatNumber === nextSeat);
  const nextState = gs.playerStates.get(nextSeat);

  broadcastBetTurn(room, nextPlayer, nextState, gs);
};

// ─────────────────────────────────────────────
// 다음 플레이어에게 베팅 차례 전송
// 큐 앞에서 이미 currentBet을 맞춘 플레이어는 자동으로 건너뜀
// ─────────────────────────────────────────────
const sendNextBetTurn = (room, gs) => {
  // 액션이 필요 없는 플레이어는 큐에서 제거
  // 조건: 폴드/올인 이거나, 이미 액션했고 currentBet을 맞춘 경우
  while (gs.bettingQueue.length > 0) {
    const seat = gs.bettingQueue[0];
    const ps = gs.playerStates.get(seat);
    if (
      ps.folded ||
      ps.allIn ||
      (ps.hasActed && ps.roundBet === gs.currentBet)
    ) {
      gs.bettingQueue.shift();
    } else {
      break;
    }
  }

  if (gs.bettingQueue.length === 0) {
    advanceBettingRound(room, gs);
    return;
  }

  const nextSeat = gs.bettingQueue[0];
  const nextPlayer = room.getPlayers().find((p) => p.seatNumber === nextSeat);
  const nextState = gs.playerStates.get(nextSeat);

  broadcastBetTurn(room, nextPlayer, nextState, gs);
};

// ─────────────────────────────────────────────
// C_BetAction 핸들러
// ─────────────────────────────────────────────
export const betActionHandler = (socket, payload) => {
  const userId = socket.userId;
  if (!userId) return;

  const { action, amount } = payload;

  const room = findRoomByUserId(userId);
  if (!room || !room.isInGame()) return;

  const gs = room.gameState;
  if (!gs) return;

  const player = room.getPlayer(userId);
  if (!player) return;

  // 차례 검증
  if (gs.bettingQueue[0] !== player.seatNumber) {
    console.warn(`[betAction] 차례 아님 | userId=${userId}`);
    return;
  }

  const pState = gs.playerStates.get(player.seatNumber);
  let betAmount = 0;
  let isRaise = false;

  switch (action) {
    case 0: {
      // FOLD
      pState.folded = true;
      break;
    }

    case 1: {
      // CHECK
      if (pState.roundBet < gs.currentBet) {
        console.warn(`[betAction] 체크 불가 (콜 필요) | userId=${userId}`);
        return;
      }
      break;
    }

    case 2: {
      // CALL
      const callNeeded = gs.currentBet - pState.roundBet;
      betAmount = Math.min(callNeeded, pState.balance);
      pState.roundBet += betAmount;
      pState.totalBet += betAmount;
      pState.balance -= betAmount;
      gs.pot += betAmount;
      if (pState.balance === 0) pState.allIn = true;
      break;
    }

    case 3: {
      // RAISE
      // amount = 클라이언트가 선택한 이번 라운드 총 베팅액 (minBet ~ maxBet 사이)
      const minBet = gs.currentBet + gs.minRaise;
      const maxBet = pState.roundBet + pState.balance;
      if (amount < minBet || amount > maxBet) {
        console.warn(
          `[betAction] 레이즈 범위 초과 | min=${minBet} max=${maxBet} got=${amount}`,
        );
        return;
      }
      const raiseAmount = amount - pState.roundBet;
      gs.minRaise = amount - gs.currentBet; // 이번 레이즈 크기가 다음 최소 레이즈
      gs.currentBet = amount;
      betAmount = raiseAmount;
      pState.roundBet = amount;
      pState.totalBet += raiseAmount;
      pState.balance -= raiseAmount;
      gs.pot += raiseAmount;
      if (pState.balance === 0) pState.allIn = true;
      isRaise = true;
      break;
    }

    case 4: {
      // ALL_IN
      betAmount = pState.balance;
      const newRoundBet = pState.roundBet + betAmount;
      pState.totalBet += betAmount;
      gs.pot += betAmount;
      pState.balance = 0;
      pState.allIn = true;
      if (newRoundBet > gs.currentBet) {
        gs.minRaise = newRoundBet - gs.currentBet;
        gs.currentBet = newRoundBet;
        isRaise = true;
      }
      pState.roundBet = newRoundBet;
      break;
    }

    default:
      return;
  }

  pState.hasActed = true;

  // 베팅 결과 브로드캐스트
  room.broadcast(
    createResponse(PACKET_TYPE.S_BET_RESULT, {
      userId,
      action,
      amount: betAmount,
      pot: gs.pot,
      playerBalance: pState.balance,
    }),
  );

  // 액션 로그 공지
  if (action === 0) {
    broadcastNotice(room, `${userId}가 폴드했습니다.`, NOTICE_TYPE.ACTION);
  } else if (action === 1) {
    broadcastNotice(room, `${userId}가 체크했습니다.`, NOTICE_TYPE.ACTION);
  } else if (action === 2) {
    broadcastNotice(room, `${userId}가 ${betAmount} 칩을 콜했습니다.`, NOTICE_TYPE.ACTION);
  } else if (action === 3) {
    broadcastNotice(room, `${userId}가 ${gs.currentBet} 칩으로 레이즈했습니다.`, NOTICE_TYPE.ACTION);
  } else if (action === 4) {
    broadcastNotice(room, `${userId}가 ${betAmount} 칩을 올인했습니다.`, NOTICE_TYPE.ACTION);
  }

  // 큐에서 현재 플레이어 제거
  gs.bettingQueue.shift();

  // 폴드 후 1명만 남으면 즉시 게임 종료
  const remainingPlayers = room.getPlayers().filter((p) => {
    return !gs.playerStates.get(p.seatNumber).folded;
  });
  console.log(
    `[betAction] 액션=${action} | 남은 플레이어=${remainingPlayers.length}`,
  );
  if (remainingPlayers.length === 1) {
    endGame(room, gs, false);
    return;
  }

  // 레이즈(또는 올인 레이즈)면 아직 액션하지 않은 플레이어 큐 재구성
  // 레이즈 이후 모든 액티브 플레이어가 다시 콜/레이즈/폴드 기회를 가짐
  // (레이즈한 본인은 제외)
  if (isRaise) {
    // 레이즈 후 다른 모든 액티브 플레이어의 hasActed 리셋 (다시 액션 기회 부여)
    for (const [seat, ps] of gs.playerStates.entries()) {
      if (seat !== player.seatNumber && !ps.folded && !ps.allIn) {
        ps.hasActed = false;
      }
    }
    // 레이저 본인 제외한 액티브 시트를, 레이저 바로 다음 시트부터 시작하는 순서로 재구성
    const activeSeats = [...gs.playerStates.entries()]
      .filter(([, ps]) => !ps.folded && !ps.allIn)
      .map(([seat]) => seat);
    const othersSeats = activeSeats.filter((s) => s !== player.seatNumber);
    gs.bettingQueue = buildQueueFrom(othersSeats, player.seatNumber);
  }

  sendNextBetTurn(room, gs);
};
