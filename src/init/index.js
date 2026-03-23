import { loadProtos } from "../protobuf/Init/loadProto.js";
import { initDatabase } from "../db/database.js";

export const initServer = async () => {
  await loadProtos();
  await initDatabase();
};
