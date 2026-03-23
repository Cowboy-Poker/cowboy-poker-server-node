export class Room {
  #roomId;
  #roomName;
  #maxPlayers;
  #blindAmount;
  #slots; // 1~5번 슬롯, 인덱스 0~4
  #state; // 0: WAITING, 1: IN_GAME

  constructor(roomId, roomName, maxPlayers, blindAmount) {
    this.#roomId = roomId;
    this.#roomName = roomName;
    this.#maxPlayers = maxPlayers;
    this.#blindAmount = blindAmount;
    this.#slots = new Array(maxPlayers).fill(null); // null = 빈 슬롯
    this.#state = 0;
  }

  // 입장 순서대로 빈 슬롯(1번부터) 배정
  addPlayer(userId, socket) {
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

    this.#slots[slotIndex] = null;
    return this.isEmpty() ? "empty" : "removed";
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
        player.socket.write(buffer);
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
    };
  }

  get roomId() { return this.#roomId; }
  get hostUserId() { return this.#slots.find((s) => s !== null)?.userId ?? null; }
}
