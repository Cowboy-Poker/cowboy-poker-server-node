import { createResponse } from "../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../protobuf/packetTypes.js";
import { login } from "../../db/user/user.js";

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

  socket.userId = userId;
  console.log(`[loginHandler] 로그인 성공 | userId=${userId}`);

  socket.write(
    createResponse(PACKET_TYPE.S_LOGIN, {
      success: true,
      message: result.message,
    }),
  );
};
