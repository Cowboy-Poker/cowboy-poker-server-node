import { createResponse } from "../../../protobuf/response/createResponse.js";
import { PACKET_TYPE } from "../../../protobuf/packetTypes.js";
import { getRoomList } from "../../../session/pokerRoom.js";

export const roomListHandler = (socket, payload) => {
  const rooms = getRoomList().map((room) => room.toInfo());

  socket.write(
    createResponse(PACKET_TYPE.S_GET_ROOM_LIST, { rooms }),
  );
};
