import bcrypt from "bcrypt";
import {
  findUserById,
  findUserByNickname,
  updateLastLoginAndGetUser,
  createUser,
} from "./user.query.js";
import { config } from "../../config/config.js";

export const login = async (userId, password) => {
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, message: "존재하지 않는 아이디입니다." };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return { success: false, message: "비밀번호가 올바르지 않습니다." };
  }

  const userWithInventory = await updateLastLoginAndGetUser(userId);
  return { success: true, message: "로그인 성공", user: userWithInventory };
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

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
  const user = await createUser(userId, passwordHash, nickname);
  return { success: true, message: "회원가입 성공", user };
};
