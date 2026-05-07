import "dotenv/config";
import fs from "fs";
import path from "path";
import pool from "../database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const executeSqlFile = async (filePath) => {
  const sql = fs.readFileSync(filePath, "utf8");
  const queries = sql
    .split(";")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  for (const q of queries) await pool.query(q);
};

const createSchemas = async () => {
  const sqlDir = path.join(__dirname, "../sql");
  try {
    await executeSqlFile(path.join(sqlDir, "user_db.sql"));
    console.log("데이터베이스 테이블이 성공적으로 생성되었습니다.");
  } catch (err) {
    console.error("데이터베이스 테이블 생성 중 오류가 발생했습니다:", err);
  }
};

createSchemas()
  .then(() => {
    console.log("마이그레이션이 완료되었습니다.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("마이그레이션 중 오류가 발생했습니다:", err);
    process.exit(1);
  });
