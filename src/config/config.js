import {
  HTTP_PORT,
  TCP_PORT,
  NODE_ENV,
  CPP_SERVER_HOST,
  CPP_SERVER_PORT,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} from "../constants/env.js";

export const config = {
  bcrypt: {
    saltRounds: 10,
  },
  poker: {
    betTimeLimitSec: 300, // 베팅 제한 시간 (초)
    nextGameDelayMs: 10000, // 게임 종료 후 다음 게임 시작까지 대기 (ms)
  },
  server: {
    httpPort: HTTP_PORT,
    tcpPort: TCP_PORT,
    env: NODE_ENV,
  },
  cpp: {
    host: CPP_SERVER_HOST,
    port: CPP_SERVER_PORT,
  },
  packet: {
    headerSize: 6,
    packetTypeSize: 2,
    totalLengthSize: 4,
  },
  db: {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    name: DB_NAME,
  },
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
};
