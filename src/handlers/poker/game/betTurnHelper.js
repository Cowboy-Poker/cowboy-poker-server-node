import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { config } from "../../../config/config.js";

// ─────────────────────────────────────────────
// 유틸: allSeats 배열을 startSeat부터 시작하는 순서로 정렬
// ─────────────────────────────────────────────
export const buildQueueFrom = (allSeats, startSeat) => {
  const sorted = [...allSeats].sort((a, b) => a - b);
  const idx = sorted.indexOf(startSeat);
  if (idx !== -1) {
    return [...sorted.slice(idx), ...sorted.slice(0, idx)];
  }
  const nextIdx = sorted.findIndex(s => s > startSeat);
  return nextIdx === -1 ? [...sorted] : [...sorted.slice(nextIdx), ...sorted.slice(0, nextIdx)];
};

// 차례인 플레이어용 페이로드 — 서버가 모든 값을 계산해서 내려줌
export const buildBetTurnPayload = (userId, pState, gs) => {
  const callAmount = Math.max(0, gs.currentBet - pState.roundBet);

  const canCheck = callAmount === 0;
  // 잔액이 callAmount 이상이어야 콜 가능 (부족하면 올인만 가능)
  const canCall  = callAmount > 0 && pState.balance >= callAmount;
  // 콜 후 잔액이 남아야 레이즈 가능
  const canRaise = pState.balance > callAmount;
  const canAllIn = pState.balance > 0;

  // 레이즈 슬라이더 범위
  // minBet: 이번 라운드 최소 레이즈 총액 (currentBet + minRaise)
  // maxBet: 보유 잔액 전체 (올인 = 슬라이더 최대)
  const minBet = gs.currentBet + gs.minRaise;
  const maxBet = pState.roundBet + pState.balance; // 현재까지 넣은 것 + 남은 잔액

  return {
    userId,
    timeLimit: config.poker.betTimeLimitSec,
    canFold: true,
    canCheck,
    canCall,
    canRaise,
    canAllIn,
    callAmount,
    minBet,
    maxBet,
    pot: gs.pot,
    balance: pState.balance,
    gamePhase: gs.phase,
  };
};

// 차례가 아닌 플레이어용 페이로드 (버튼 전부 비활성화, 팟/잔액 정보는 전달)
const buildBetTurnObserverPayload = (activeUserId, pState, gs) => ({
  userId: activeUserId,
  timeLimit: config.poker.betTimeLimitSec,
  canFold: false,
  canCheck: false,
  canCall: false,
  canRaise: false,
  canAllIn: false,
  callAmount: 0,
  minBet: 0,
  maxBet: 0,
  pot: gs.pot,
  balance: pState.balance,
  gamePhase: gs.phase,
});

// 차례인 플레이어에게만 버튼 활성화, 나머지는 비활성화로 개별 전송
// 각자 본인의 잔액(balance)을 포함해서 전송
export const broadcastBetTurn = (room, activePlayer, activeState, gs) => {
  const activePayload = buildBetTurnPayload(activePlayer.userId, activeState, gs);
  console.log(`[broadcastBetTurn] 차례: ${activePlayer.userId} | pot=${gs.pot} | currentBet=${gs.currentBet} | callAmount=${activePayload.callAmount} | minBet=${activePayload.minBet} | maxBet=${activePayload.maxBet} | balance=${activePayload.balance}`);
  for (const p of room.getPlayers()) {
    const isActive = p.userId === activePlayer.userId;
    const pState = gs.playerStates.get(p.seatNumber);
    const payload = isActive
      ? activePayload
      : buildBetTurnObserverPayload(activePlayer.userId, pState, gs);
    console.log(`  → ${p.userId} (${isActive ? '액티브' : '옵저버'}) canCheck=${payload.canCheck} canFold=${payload.canFold} canCall=${payload.canCall} canRaise=${payload.canRaise}`);
    p.socket.write(createResponse(PACKET_TYPE.S_BET_TURN, payload));
  }
};
