import net from "net";
import HandlerManager from "../handlers/HandlerManager.js";
import { parsePacket } from "../protobuf/request/packetParser.js";

class SocketManager {
  static #instance = null;

  #tcpServer = null;

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
    });

    socket.on("error", (err) => {
      console.error(
        `[Socket] 에러 | address=${socket.remoteAddress}:${socket.remotePort} | err=${err.message}`,
      );
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
