import { config } from "../../config/config.js";
import { getProtoMessages } from "../Init/loadProto.js";
import { PACKET_TYPE_MAP } from "../packetTypes.js";

// 헤더: [totalLength(4) | packetType(2)]

const protoMessages = getProtoMessages();

export const createResponse = (packetType, data) => {
  const typeInfo = PACKET_TYPE_MAP[packetType];
  if (!typeInfo) {
    throw new Error(`알 수 없는 패킷 타입: ${packetType}`);
  }

  const MessageType = protoMessages[typeInfo.namespace]?.[typeInfo.typeName];
  if (!MessageType) {
    throw new Error(
      `proto 타입을 찾을 수 없습니다: ${typeInfo.namespace}.${typeInfo.typeName}`,
    );
  }

  const errMsg = MessageType.verify(data);
  if (errMsg) {
    throw new Error(`proto 검증 실패: ${errMsg}`);
  }

  const payload = MessageType.encode(MessageType.create(data)).finish();

  const totalLength = config.packet.headerSize + payload.length;
  const buffer = Buffer.allocUnsafe(totalLength);
  buffer.writeUInt32BE(totalLength, 0);
  buffer.writeUInt16BE(packetType, 4);
  payload.copy(buffer, config.packet.headerSize);

  return buffer;
};
