import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { createRoom } from "../../../session/pokerRoom.js";

export const roomMakeHandler = (socket, payload) => {
  const { roomName, maxPlayers, blindAmount } = payload;

  if (!roomName || roomName.trim() === "") {
    return socket.write(
      createResponse(PACKET_TYPE.S_CREATE_ROOM, {
        success: false,
        message: "방 이름을 입력해주세요.",
      }),
    );
  }

  if (maxPlayers < 2 || maxPlayers > 5) {
    return socket.write(
      createResponse(PACKET_TYPE.S_CREATE_ROOM, {
        success: false,
        message: "최대 인원은 2~5명이어야 합니다.",
      }),
    );
  }

  const room = createRoom(roomName.trim(), maxPlayers, blindAmount);
  room.addPlayer(socket.userId, socket);

  console.log(
    `[roomMakeHandler] 방 생성 | roomId=${room.roomId} | roomName=${roomName} | userId=${socket.userId}`,
  );

  socket.write(
    createResponse(PACKET_TYPE.S_CREATE_ROOM, {
      success: true,
      message: "방이 생성되었습니다.",
      room: room.toInfo(),
    }),
  );
};
