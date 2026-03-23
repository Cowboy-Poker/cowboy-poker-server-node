export const HTTP_PORT = process.env.PORT || 3000;
export const TCP_PORT = process.env.TCP_PORT || 4000;
export const NODE_ENV = process.env.NODE_ENV || "development";

export const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || "localhost";
export const CPP_SERVER_PORT = process.env.CPP_SERVER_PORT || 7777;

export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = parseInt(process.env.DB_PORT) || 5432;
export const DB_USER = process.env.DB_USER || "postgres";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_NAME = process.env.DB_NAME || "Cowboy_Poker";
