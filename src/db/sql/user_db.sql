CREATE TABLE IF NOT EXISTS users (
    user_no         SERIAL PRIMARY KEY,
    user_id         VARCHAR(20) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    nickname        VARCHAR(20) NOT NULL,
    hp              INT DEFAULT 100,
    balance         BIGINT DEFAULT 1000,
    char_type       INT DEFAULT 0,

    pos_x           REAL DEFAULT 0.0,
    pos_y           REAL DEFAULT 1.0,
    pos_z           REAL DEFAULT 0.0,
    rot             REAL DEFAULT 0.0,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventories (
    user_no             INT PRIMARY KEY REFERENCES users(user_no) ON DELETE CASCADE,
    equipped_weapon     INT DEFAULT 0,
    ammo_rifle_count    INT DEFAULT 0,
    ammo_shotgun_count  INT DEFAULT 0,
    ammo_revolver_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poker_stats (
    user_no         INT PRIMARY KEY REFERENCES users(user_no) ON DELETE CASCADE,
    wins            INT DEFAULT 0, -- 패배시 아이디 삭제라 필요없음
    total_games     INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
