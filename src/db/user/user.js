import bcrypt from "bcrypt";
import { findUserById, findUserByNickname, createUser, updateLastLogin } from "./user.query.js";

const SALT_ROUNDS = 10;

export const login = async (userId, password) => {
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, message: "존재하지 않는 아이디입니다." };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return { success: false, message: "비밀번호가 올바르지 않습니다." };
  }

  await updateLastLogin(userId);
  return { success: true, message: "로그인 성공", user };
};

export const register = async (userId, password, nickname) => {
  const existingId = await findUserById(userId);
  if (existingId) {
    return { success: false, message: "이미 사용 중인 아이디입니다." };
  }

  const existingNickname = await findUserByNickname(nickname);
  if (existingNickname) {
    return { success: false, message: "이미 사용 중인 닉네임입니다." };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser(userId, passwordHash, nickname);
  return { success: true, message: "회원가입 성공", user };
};
