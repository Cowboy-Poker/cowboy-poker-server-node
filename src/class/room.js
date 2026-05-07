export class Room {
  #roomId;
  #roomName;
  #maxPlayers;
  /** 테이블 스테이크 = 빅 블라인드(C_CreateRoom.blindAmount와 동일). SB는 항상 floor(BB/2). */
  #blindAmount;
  #slots; // 1~5번 슬롯, 인덱스 0~4
  #state; // 0: WAITING, 1: IN_GAME

  // 블라인드 포지션 (시트 번호 기준)
  // 첫 게임: SB=1, BB=2
  // 이후 게임마다 한 칸씩 이동
  #sbSeat; // 스몰 블라인드 시트 번호
  #bbSeat; // 빅 블라인드 시트 번호
  #isFirstGame; // 첫 게임 여부 (rotateBlinds 스킵)
  #pendingLeave; // 게임 종료 후 나갈 플레이어 userId Set
  #gameState; // 진행 중인 게임 상태

  constructor(roomId, roomName, maxPlayers, blindAmount) {
    this.#roomId = roomId;
    this.#roomName = roomName;
    this.#maxPlayers = maxPlayers;
    this.#blindAmount = blindAmount;
    this.#slots = new Array(maxPlayers).fill(null); // null = 빈 슬롯
    this.#state = 0;
    this.#sbSeat = 1;
    this.#bbSeat = 2;
    this.#isFirstGame = true;
    this.#pendingLeave = new Set();
    this.#gameState = null;
  }

  // 입장 순서대로 빈 슬롯(1번부터) 배정
  addPlayer(userId, socket) {
    // 이미 방에 있는 플레이어면 중복 입장 방지
    if (this.#slots.some((s) => s?.userId === userId)) {
      console.warn(`[addPlayer] 중복 입장 시도 | userId=${userId}`);
      return false;
    }

    const slotIndex = this.#slots.findIndex((s) => s === null);
    if (slotIndex === -1) return false;

    this.#slots[slotIndex] = { userId, socket, seatNumber: slotIndex + 1 };
    return true;
  }

  // 반환값: "removed" | "empty" | false
  // "empty" 이면 호출한 쪽에서 세션에서 방을 삭제해야 함
  removePlayer(userId) {
    const slotIndex = this.#slots.findIndex((s) => s?.userId === userId);
    if (slotIndex === -1) return false;

    const removedSeat = slotIndex + 1;
    this.#slots[slotIndex] = null;

    if (this.isEmpty()) return "empty";

    const seats = this.getPlayers()
      .map((p) => p.seatNumber)
      .sort((a, b) => a - b);

    // SB가 나간 경우: BB는 유지, SB는 BB 바로 이전 시트로
    if (this.#sbSeat === removedSeat) {
      this.#sbSeat = this.#getPrevOccupiedSeat(this.#bbSeat);
    }

    // BB가 나간 경우: SB는 유지, BB는 SB 바로 다음 시트로
    if (this.#bbSeat === removedSeat) {
      this.#bbSeat = this.#getNextOccupiedSeat(this.#sbSeat);
    }

    // 플레이어가 1명만 남은 경우 SB=BB 방지
    if (seats.length === 1) {
      this.#sbSeat = seats[0];
      this.#bbSeat = seats[0];
    }

    return "removed";
  }

  getPlayer(userId) {
    return this.#slots.find((s) => s?.userId === userId) ?? null;
  }

  getPlayers() {
    return this.#slots.filter((s) => s !== null);
  }

  broadcast(buffer, excludeUserId = null) {
    for (const player of this.getPlayers()) {
      if (player.userId !== excludeUserId) {
        player.socket.write(Buffer.from(buffer));
      }
    }
  }

  isFull() {
    return this.#slots.every((s) => s !== null);
  }

  isEmpty() {
    return this.#slots.every((s) => s === null);
  }

  isInGame() {
    return this.#state === 1;
  }

  setInGame() {
    this.#state = 1;
  }

  setWaiting() {
    this.#state = 0;
  }

  toInfo() {
    return {
      roomId: this.#roomId,
      roomName: this.#roomName,
      currentPlayers: this.getPlayers().length,
      maxPlayers: this.#maxPlayers,
      blindAmount: this.#blindAmount,
      state: this.#state,
      players: this.getPlayers().map((p) => ({
        userId: p.userId,
        seatNumber: p.seatNumber,
      })),
    };
  }

  // 프리플랍 베팅 시작: BB 다음 시트 (UTG)
  getUTGSeat() {
    return this.#getNextOccupiedSeat(this.#bbSeat);
  }

  // 플랍/턴/리버 베팅 시작: SB
  getSBSeat() {
    return this.#sbSeat;
  }

  getBBSeat() {
    return this.#bbSeat;
  }

  // 게임 종료 후 블라인드 한 칸 이동
  // 이전 BB가 새 SB, 이전 BB 다음이 새 BB
  rotateBlinds() {
    const newSB = this.#getNextOccupiedSeat(this.#sbSeat);
    const newBB = this.#getNextOccupiedSeat(newSB);
    this.#sbSeat = newSB;
    this.#bbSeat = newBB;
  }

  // 현재 시트 기준 다음 점유 시트 (오름차순 순환)
  #getNextOccupiedSeat(currentSeat) {
    const seats = this.getPlayers()
      .map((p) => p.seatNumber)
      .sort((a, b) => a - b);

    const currentIndex = seats.indexOf(currentSeat);

    if (currentIndex !== -1) {
      return seats[(currentIndex + 1) % seats.length];
    }

    // 현재 시트가 비어있으면 currentSeat보다 큰 첫 번째 시트, 없으면 가장 작은 시트
    const next = seats.find((s) => s > currentSeat);
    return next ?? seats[0];
  }

  // 현재 시트 기준 이전 점유 시트 (내림차순 순환)
  #getPrevOccupiedSeat(currentSeat) {
    const seats = this.getPlayers()
      .map((p) => p.seatNumber)
      .sort((a, b) => a - b);

    const currentIndex = seats.indexOf(currentSeat);

    if (currentIndex !== -1) {
      return seats[(currentIndex - 1 + seats.length) % seats.length];
    }

    // 현재 시트가 비어있으면 currentSeat보다 작은 마지막 시트, 없으면 가장 큰 시트
    const prev = [...seats].reverse().find((s) => s < currentSeat);
    return prev ?? seats[seats.length - 1];
  }

  addPendingLeave(userId) {
    this.#pendingLeave.add(userId);
  }

  // 예약된 퇴장 처리 후 퇴장한 userId 배열 반환
  processPendingLeaves() {
    const left = [];
    for (const userId of this.#pendingLeave) {
      if (this.getPlayer(userId)) {
        this.removePlayer(userId);
        left.push(userId);
      }
    }
    this.#pendingLeave.clear();
    return left;
  }

  hasPendingLeave(userId) {
    return this.#pendingLeave.has(userId);
  }

  initGameState(state) {
    this.#gameState = state;
  }

  clearGameState() {
    this.#gameState = null;
  }

  get roomId() {
    return this.#roomId;
  }
  get hostUserId() {
    return this.#slots.find((s) => s !== null)?.userId ?? null;
  }
  get sbSeat() {
    return this.#sbSeat;
  }
  get bbSeat() {
    return this.#bbSeat;
  }
  get blindAmount() {
    return this.#blindAmount;
  }
  get bigBlind() {
    return this.#blindAmount;
  }
  get smallBlind() {
    return Math.max(1, Math.floor(this.#blindAmount / 2));
  }
  get gameState() {
    return this.#gameState;
  }
  get isFirstGame() {
    return this.#isFirstGame;
  }
  set isFirstGame(v) {
    this.#isFirstGame = v;
  }
}
