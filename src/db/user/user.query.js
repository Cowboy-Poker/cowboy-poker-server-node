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
  const user = rows[0];
  await query(`INSERT INTO inventories (user_no) VALUES ($1)`, [user.user_no]);
  return user;
};

export const updateLastLoginAndGetUser = async (userId) => {
  const { rows } = await query(
    `WITH updated AS (
       UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *
     )
     SELECT u.*, i.equipped_weapon, i.ammo_rifle_count, i.ammo_shotgun_count, i.ammo_revolver_count
     FROM updated u
     LEFT JOIN inventories i ON u.user_no = i.user_no`,
    [userId],
  );
  return rows[0] ?? null;
};
