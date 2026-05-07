import { Room } from "../class/room.js";

const roomList = [];
let nextRoomId = 1;

export const createRoom = (roomName, maxPlayers, blindAmount) => {
  const room = new Room(nextRoomId++, roomName, maxPlayers, blindAmount);
  roomList.push(room);
  return room;
};

export const getRoomById = (roomId) => {
  return roomList.find((r) => r.roomId === roomId) ?? null;
};

export const getRoomList = () => {
  return [...roomList];
};

export const removeRoom = (roomId) => {
  const index = roomList.findIndex((r) => r.roomId === roomId);
  if (index === -1) return false;
  roomList.splice(index, 1);
  return true;
};
