import pg from "pg";
import { config } from "../config/config.js";

const { Pool } = pg;
const { db } = config;

const pool = new Pool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.name,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("[DB] 유휴 클라이언트 오류:", err);
});

export const initDatabase = async () => {
  const client = await pool.connect();
  client.release();
  console.log("[DB] 연결 성공");
};

export const query = (sql, params) => {
  console.log(
    `[DB] ${sql}${params ? ` | params: ${JSON.stringify(params)}` : ""}`,
  );
  return pool.query(sql, params);
};

export default pool;
