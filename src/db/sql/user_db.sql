-- 기존 잔재 제거
DROP TABLE IF EXISTS users CASCADE;
-- 유저 테이블
CREATE TABLE IF NOT EXISTS users (
    user_no         SERIAL PRIMARY KEY,
    user_id         VARCHAR(20) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    nickname        VARCHAR(20) UNIQUE NOT NULL,
    balance         BIGINT DEFAULT 10000,
    wins            INT DEFAULT 0,
    losses          INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
