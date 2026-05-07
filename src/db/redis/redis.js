import { createClient } from "redis";
import { config } from "../../config/config.js";

var redisClient = null;

export async function initRedis() {
  redisClient = createClient({
    url: `redis://${config.redis.host}:${config.redis.port}`,
  });

  redisClient.on("error", (err) => {
    console.error("[Redis] 연결 오류:", err);
  });

  await redisClient.connect();
  console.log("[Redis] 연결 성공");
}

export const getRedisClient = () => {
  return redisClient;
};
