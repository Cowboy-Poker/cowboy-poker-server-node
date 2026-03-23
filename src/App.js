import express from "express";
import http from "http";
import { healthCheck } from "./controllers/healthController.js";
import SocketManager from "./managers/SocketManager.js";
import { config } from "./config/config.js";

class App {
  static #instance = null;

  #express = null;
  #httpServer = null;

  constructor() {
    if (App.#instance) {
      return App.#instance;
    }
    App.#instance = this;
    this.#bootstrap();
  }

  static getInstance() {
    if (!App.#instance) {
      App.#instance = new App();
    }
    return App.#instance;
  }

  #bootstrap() {
    this.#express = express();
    this.#express.use(express.json());

    this.#registerRoutes();

    this.#httpServer = http.createServer(this.#express);

    SocketManager.getInstance().initialize(config.server.tcpPort);
  }

  #registerRoutes() {
    this.#express.get("/health", healthCheck);
  }

  listen(port) {
    this.#httpServer.listen(port, () => {
      console.log(
        `[App] HTTP 서버 시작 | port=${port} | env=${config.server.env}`,
      );
    });
  }

  getHttpServer() {
    return this.#httpServer;
  }
}

export default App;
