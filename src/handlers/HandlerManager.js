import { PACKET_TYPE } from '../constants/packetType.js';

const handlers = {
  // [PACKET_TYPE.C_LobbyEnter]: {
  //   handler: lobbyEnterHandler,
  //   protoType: 'lobby.C_LobbyEnter',
  // },
};

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
      console.warn(`[HandlerManager] 등록되지 않은 패킷 타입 | type=0x${packetType.toString(16).padStart(4, '0')}`);
      return;
    }
    entry.handler(socket, payload);
  }
}

export default HandlerManager;
