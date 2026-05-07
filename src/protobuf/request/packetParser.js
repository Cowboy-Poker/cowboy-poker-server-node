import { config } from "../../config/config.js";
import { getProtoMessages } from "../Init/loadProto.js";
import { PACKET_TYPE_MAP } from "../packetTypes.js";

const protoMessages = getProtoMessages();

export const parsePacket = (buffer) => {
  const totalLength = buffer.readUInt32BE(0);
  const packetType = buffer.readUInt16BE(config.packet.totalLengthSize);
  const payload = buffer.subarray(config.packet.headerSize, totalLength);

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

  const decoded = MessageType.decode(payload);

  return { packetType, payload: decoded };
};
