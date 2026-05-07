import { createResponse } from "../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../protobuf/packetTypes.js";
import { login } from "../../db/user/user.js";
import { saveUserSession, getUserSession } from "../../session/userSession.js";
import { sessionToProto } from "../../session/sessionMapper.js";
import SocketManager from "../../managers/SocketManager.js";

export const loginHandler = async (socket, payload) => {
  const { userId, password } = payload;

  const result = await login(userId, password);

  if (!result.success) {
    return socket.write(
      createResponse(PACKET_TYPE.S_LOGIN, {
        success: false,
        message: result.message,
      }),
    );
  }

  // 중복 로그인: 맵에 있는 기존 소켓(active)은 읽기만 하고 절대 건드리지 않음. 실패 응답은 지금 패킷을 보낸 소켓에만.
  const active = SocketManager.getInstance().getSocket(userId);
  if (active && active !== socket) {
    return socket.write(
      createResponse(PACKET_TYPE.S_LOGIN, {
        success: false,
        message: "이미 접속 중인 계정입니다.",
      }),
    );
  }

  socket.userId = userId;
  SocketManager.getInstance().registerSocket(userId, socket);
  await saveUserSession(userId, result.user);
  const session = await getUserSession(userId);
  console.log(`[loginHandler] 로그인 성공 | userId=${userId}`);

  socket.write(
    createResponse(PACKET_TYPE.S_LOGIN, {
      success: true,
      message: result.message,
      ...sessionToProto(session),
    }),
  );
};
