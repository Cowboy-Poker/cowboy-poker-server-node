import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { getRoomList, removeRoom } from "../../../session/pokerRoom.js";

export const roomLeaveHandler = (socket, payload) => {
  const userId = socket.userId;

  const room = getRoomList().find((r) => r.getPlayer(userId));
  if (!room) return;

  // 게임 중이면 퇴장 예약 (게임 종료 후 startGame에서 처리)
  if (room.isInGame()) {
    room.addPendingLeave(userId);
    console.log(`[roomLeaveHandler] 퇴장 예약 | roomId=${room.roomId} | userId=${userId}`);
    return;
  }

  const result = room.removePlayer(userId);

  if (result === "empty") {
    removeRoom(room.roomId);
    console.log(`[roomLeaveHandler] 방 삭제 | roomId=${room.roomId} (플레이어 0명)`);
    return;
  }

  console.log(`[roomLeaveHandler] 방 퇴장 | roomId=${room.roomId} | userId=${userId}`);

  room.broadcast(
    createResponse(PACKET_TYPE.S_LEAVE_ROOM, { userId }),
  );
};
