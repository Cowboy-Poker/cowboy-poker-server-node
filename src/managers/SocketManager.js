import net from "net";
import HandlerManager from "../handlers/HandlerManager.js";
import { parsePacket } from "../protobuf/request/packetParser.js";
import { applyLeaveRoomFromSocket } from "../handlers/poker/room/roomLeaveHandler.js";

class SocketManager {
  static #instance = null;

  #tcpServer = null;
  #socketMap = new Map(); // userId → socket

  constructor() {
    if (SocketManager.#instance) {
      return SocketManager.#instance;
    }
    SocketManager.#instance = this;
  }

  static getInstance() {
    if (!SocketManager.#instance) {
      SocketManager.#instance = new SocketManager();
    }
    return SocketManager.#instance;
  }

  initialize(port) {
    this.#tcpServer = net.createServer((socket) => {
      this.#onConnection(socket);
    });

    this.#tcpServer.listen(port, () => {
      console.log(`[SocketManager] TCP 서버 시작 | port=${port}`);
    });
  }

  /** 로그인 성공 시만 호출. 기존 소켓은 건드리지 않음(중복은 loginHandler에서 차단). */
  registerSocket(userId, socket) {
    this.#socketMap.set(userId, socket);
  }

  getSocket(userId) {
    return this.#socketMap.get(userId) ?? null;
  }

  /** 맵에 등록된 소켓과 같을 때만 제거 (교체 후 구 소켓 end가 새 등록을 지우지 않도록) */
  #unregisterIfCurrent(userId, socket) {
    if (this.#socketMap.get(userId) === socket) {
      this.#socketMap.delete(userId);
    }
  }

  #onConnection(socket) {
    console.log(
      `[Socket] 유저 접속 | address=${socket.remoteAddress}:${socket.remotePort}`,
    );

    socket.on("data", (buffer) => {
      try {
        const { packetType, payload } = parsePacket(buffer);
        HandlerManager.getInstance().handle(packetType, socket, payload);
      } catch (err) {
        console.error(
          `[Socket] 패킷 파싱 오류 | address=${socket.remoteAddress}:${socket.remotePort} | err=${err.message}`,
        );
      }
    });

    socket.on("end", () => {
      console.log(
        `[Socket] 유저 해제 | address=${socket.remoteAddress}:${socket.remotePort}`,
      );
      if (socket.userId) {
        applyLeaveRoomFromSocket(socket, "disconnect");
        this.#unregisterIfCurrent(socket.userId, socket);
      }
    });

    socket.on("error", (err) => {
      console.error(
        `[Socket] 에러 | address=${socket.remoteAddress}:${socket.remotePort} | err=${err.message}`,
      );
      if (socket.userId) {
        applyLeaveRoomFromSocket(socket, "disconnect");
        this.#unregisterIfCurrent(socket.userId, socket);
      }
    });
  }

  getServer() {
    if (!this.#tcpServer) {
      throw new Error(
        "SocketManager가 아직 초기화되지 않았습니다. initialize()를 먼저 호출하세요.",
      );
    }
    return this.#tcpServer;
  }
}

export default SocketManager;
