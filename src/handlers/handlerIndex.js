import { PACKET_TYPE } from "../protobuf/packetTypes.js";
import { loginHandler } from "./user/loginHandler.js";
import { registerHandler } from "./user/registerHandler.js";
import { roomMakeHandler } from "./poker/room/roomMakeHandler.js";
import { roomEnterHandler } from "./poker/room/roomEnterHandler.js";
import { roomLeaveHandler } from "./poker/room/roomLeaveHandler.js";
import { roomListHandler } from "./poker/room/roomListHandler.js";
import { betActionHandler } from "./poker/game/gameLogicHandler.js";

export const handlers = {
  [PACKET_TYPE.C_LOGIN]: loginHandler,
  [PACKET_TYPE.C_REGISTER]: registerHandler,

  [PACKET_TYPE.C_GET_ROOM_LIST]: roomListHandler,
  [PACKET_TYPE.C_CREATE_ROOM]: roomMakeHandler,
  [PACKET_TYPE.C_JOIN_ROOM]: roomEnterHandler,
  [PACKET_TYPE.C_LEAVE_ROOM]: roomLeaveHandler,

  [PACKET_TYPE.C_BET_ACTION]: betActionHandler,
};
