import { getRedisClient } from "../db/redis/redis.js";

const USER_SESSION_TTL = 60 * 60 * 24; // 24시간

const userSessionKey = (userId) => `user:${userId}`;

export const saveUserSession = async (userId, user) => {
  const redis = getRedisClient();
  const key = userSessionKey(userId);
  await redis.hSet(key, "nickname", user.nickname ?? "");
  await redis.hSet(key, "hp", String(user.hp ?? 100));
  await redis.hSet(key, "balance", String(user.balance ?? 0));
  await redis.hSet(key, "char_type", String(user.char_type ?? 0));
  await redis.hSet(key, "pos_x", String(user.pos_x ?? 0));
  await redis.hSet(key, "pos_y", String(user.pos_y ?? 1));
  await redis.hSet(key, "pos_z", String(user.pos_z ?? 0));
  await redis.hSet(key, "rot", String(user.rot ?? 0));
  await redis.hSet(key, "weapon", String(user.equipped_weapon ?? 0));
  await redis.hSet(key, "ammo_type", "0");
  await redis.hSet(key, "scene", "Lobby");

  await redis.expire(key, USER_SESSION_TTL);
};

export const getUserSession = async (userId) => {
  const redis = getRedisClient();
  return await redis.hGetAll(userSessionKey(userId));
};

export const deleteUserSession = async (userId) => {
  const redis = getRedisClient();
  await redis.del(userSessionKey(userId));
};
