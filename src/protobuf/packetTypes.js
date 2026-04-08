import { PACKET_TYPE } from "../../Protocols/packetTypes/packetTypes.js";
export { PACKET_TYPE };

// 패킷 타입 -> { namespace, typeName } 매핑
export const PACKET_TYPE_MAP = {
  [PACKET_TYPE.C_LOGIN]: { namespace: "login", typeName: "C_Login" },
  [PACKET_TYPE.S_LOGIN]: { namespace: "login", typeName: "S_Login" },
  [PACKET_TYPE.C_REGISTER]: { namespace: "login", typeName: "C_Register" },
  [PACKET_TYPE.S_REGISTER]: { namespace: "login", typeName: "S_Register" },

  [PACKET_TYPE.C_GET_ROOM_LIST]: {
    namespace: "poker_request",
    typeName: "C_GetRoomList",
  },
  [PACKET_TYPE.S_GET_ROOM_LIST]: {
    namespace: "poker_response",
    typeName: "S_GetRoomList",
  },
  [PACKET_TYPE.C_CREATE_ROOM]: {
    namespace: "poker_request",
    typeName: "C_CreateRoom",
  },
  [PACKET_TYPE.S_CREATE_ROOM]: {
    namespace: "poker_response",
    typeName: "S_CreateRoom",
  },
  [PACKET_TYPE.C_JOIN_ROOM]: {
    namespace: "poker_request",
    typeName: "C_JoinRoom",
  },
  [PACKET_TYPE.S_JOIN_ROOM]: {
    namespace: "poker_response",
    typeName: "S_JoinRoom",
  },
  [PACKET_TYPE.C_LEAVE_ROOM]: {
    namespace: "poker_request",
    typeName: "C_LeaveRoom",
  },
  [PACKET_TYPE.S_LEAVE_ROOM]: {
    namespace: "poker_response",
    typeName: "S_LeaveRoom",
  },
  [PACKET_TYPE.C_START_GAME]: {
    namespace: "poker_request",
    typeName: "C_StartGame",
  },
  [PACKET_TYPE.S_START_GAME]: {
    namespace: "poker_response",
    typeName: "S_StartGame",
  },
  [PACKET_TYPE.C_BET_ACTION]: {
    namespace: "poker_request",
    typeName: "C_BetAction",
  },
  [PACKET_TYPE.S_BET_TURN]: {
    namespace: "poker_response",
    typeName: "S_BetTurn",
  },
  [PACKET_TYPE.S_BET_RESULT]: {
    namespace: "poker_response",
    typeName: "S_BetResult",
  },
  [PACKET_TYPE.S_OPEN_COMMUNITY_CARDS]: {
    namespace: "poker_response",
    typeName: "S_OpenCommunityCards",
  },
  [PACKET_TYPE.S_GAME_RESULT]: {
    namespace: "poker_response",
    typeName: "S_GameResult",
  },
};
