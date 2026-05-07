import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { getRoomList, removeRoom } from "../../../session/pokerRoom.js";

/** C_LEAVE_ROOM 패킷과 소켓 끊김 모두 동일 규칙으로 처리 */
export const applyLeaveRoomFromSocket = (socket, reason = "packet") => {
  const userId = socket.userId;
  if (!userId) return;

  const room = getRoomList().find((r) => r.getPlayer(userId));
  if (!room) return;

  // 게임 진행 플래그가 켜진 동안만 퇴장 예약 — endGame 후 setWaiting으로 핸드 사이에는 즉시 퇴장
  // (startGame 초반 setInGame ~ initGameState 도중 끊김도 예약으로 처리해 딜 로직과 충돌 방지)
  if (room.isInGame()) {
    room.addPendingLeave(userId);
    console.log(
      `[leave] 퇴장 예약 (${reason}) | roomId=${room.roomId} | userId=${userId}`,
    );
    return;
  }

  const result = room.removePlayer(userId);

  if (result === "empty") {
    removeRoom(room.roomId);
    console.log(`[leave] 방 삭제 (${reason}) | roomId=${room.roomId} (플레이어 0명)`);
    return;
  }

  console.log(`[leave] 방 퇴장 (${reason}) | roomId=${room.roomId} | userId=${userId}`);

  room.broadcast(createResponse(PACKET_TYPE.S_LEAVE_ROOM, { userId }));
};

export const roomLeaveHandler = (socket, payload) => {
  applyLeaveRoomFromSocket(socket, "packet");
};
