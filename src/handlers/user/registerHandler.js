import { createResponse } from "../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../protobuf/packetTypes.js";
import { register } from "../../db/user/user.js";

export const registerHandler = async (socket, payload) => {
  const { userId, password, nickname } = payload;

  const result = await register(userId, password, nickname);

  if (!result.success) {
    return socket.write(
      createResponse(PACKET_TYPE.S_REGISTER, {
        success: false,
        message: result.message,
      }),
    );
  }

  console.log(
    `[registerHandler] 회원가입 성공 | userId=${userId} | nickname=${nickname}`,
  );

  socket.write(
    createResponse(PACKET_TYPE.S_REGISTER, {
      success: true,
      message: result.message,
    }),
  );
};
