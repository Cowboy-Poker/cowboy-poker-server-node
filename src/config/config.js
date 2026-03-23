import { HTTP_PORT, TCP_PORT, NODE_ENV, CPP_SERVER_HOST, CPP_SERVER_PORT } from '../constants/env.js';

export const config = {
  server: {
    httpPort: HTTP_PORT,
    tcpPort: TCP_PORT,
    env: NODE_ENV,
  },
  cpp: {
    host: CPP_SERVER_HOST,
    port: CPP_SERVER_PORT,
  },
};
