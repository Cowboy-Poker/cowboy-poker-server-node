import { loadProtos } from "../protobuf/Init/loadProto.js";
import { initDatabase } from "../db/database.js";
import { initRedis } from "../db/redis/redis.js";

export const initServer = async () => {
  await loadProtos();
  await initDatabase();
  await initRedis();
};
