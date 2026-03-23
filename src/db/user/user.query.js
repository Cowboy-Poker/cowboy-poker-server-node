import { query } from "../database.js";

export const findUserById = async (userId) => {
  const { rows } = await query(`SELECT * FROM users WHERE user_id = $1`, [
    userId,
  ]);
  return rows[0] ?? null;
};

export const findUserByNickname = async (nickname) => {
  const { rows } = await query(`SELECT * FROM users WHERE nickname = $1`, [
    nickname,
  ]);
  return rows[0] ?? null;
};

export const createUser = async (userId, passwordHash, nickname) => {
  const { rows } = await query(
    `INSERT INTO users (user_id, password_hash, nickname)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, passwordHash, nickname],
  );
  return rows[0];
};

export const updateLastLogin = async (userId) => {
  await query(
    `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
    [userId],
  );
};
