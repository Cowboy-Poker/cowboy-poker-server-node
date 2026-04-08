import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { getRoomById } from "../../../session/pokerRoom.js";
import { startGame } from "../game/gameStartHandler.js";

export const roomEnterHandler = (socket, payload) => {
  const { roomId } = payload;

  const room = getRoomById(roomId);
  if (!room) {
    return socket.write(
      createResponse(PACKET_TYPE.S_JOIN_ROOM, {
        success: false,
        message: "존재하지 않는 방입니다.",
      }),
    );
  }

  if (room.isInGame()) {
    return socket.write(
      createResponse(PACKET_TYPE.S_JOIN_ROOM, {
        success: false,
        message: "이미 게임이 진행 중인 방입니다.",
      }),
    );
  }

  if (room.isFull()) {
    return socket.write(
      createResponse(PACKET_TYPE.S_JOIN_ROOM, {
        success: false,
        message: "방이 가득 찼습니다.",
      }),
    );
  }

  room.addPlayer(socket.userId, socket);

  console.log(
    `[roomEnterHandler] 방 입장 | roomId=${roomId} | userId=${socket.userId} | seatNumber=${room.getPlayer(socket.userId).seatNumber}`,
  );

  const joinResponse = createResponse(PACKET_TYPE.S_JOIN_ROOM, {
    success: true,
    message: "방에 입장했습니다.",
    room: room.toInfo(),
  });

  // 기존 플레이어들에게도 브로드캐스트
  room.broadcast(joinResponse);

  // 2명 이상이면 자동 게임 시작
  if (room.getPlayers().length >= 2 && !room.isInGame()) {
    startGame(room);
  }
};
