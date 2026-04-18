import { createClient } from "redis";
import { config } from "../../config/config.js";

export async function initRedis() {
  const client = createClient({
    url: `redis://${config.redis.host}:${config.redis.port}`,
  });

  client.on("error", (err) => {
    console.error("[Redis] 연결 오류:", err);
  });

  await client.connect();
  console.log("[Redis] 연결 성공");
  return client;
}
