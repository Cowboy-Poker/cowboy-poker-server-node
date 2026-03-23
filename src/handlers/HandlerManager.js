import { handlers } from "./handlerIndex.js";

class HandlerManager {
  static #instance = null;

  constructor() {
    if (HandlerManager.#instance) {
      return HandlerManager.#instance;
    }
    HandlerManager.#instance = this;
  }

  static getInstance() {
    if (!HandlerManager.#instance) {
      HandlerManager.#instance = new HandlerManager();
    }
    return HandlerManager.#instance;
  }

  handle(packetType, socket, payload) {
    const entry = handlers[packetType];
    if (!entry) {
      console.warn(
        `[HandlerManager] 등록되지 않은 패킷 타입 | type=0x${packetType.toString(16).padStart(4, "0")}`,
      );
      return;
    }
    Promise.resolve(entry(socket, payload)).catch((err) => {
      console.error(
        `[HandlerManager] 핸들러 오류 | type=${packetType} | err=${err.message}`,
      );
    });
  }
}

export default HandlerManager;
