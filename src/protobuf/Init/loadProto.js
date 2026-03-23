import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import protobuf from "protobufjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const protoDir = path.join(__dirname, "../../../Protocols");

const ALLOWED_NAMESPACES = ["common", "poker", "login"];

const getAllProtoFiles = (dir, fileList = []) => {
  const entries = fs.readdirSync(dir);
  entries.forEach((entry) => {
    const entryPath = path.join(dir, entry);
    if (fs.statSync(entryPath).isDirectory()) {
      if (dir === protoDir && !ALLOWED_NAMESPACES.includes(entry)) return;
      getAllProtoFiles(entryPath, fileList);
    } else if (path.extname(entry) === ".proto") {
      fileList.push(entryPath);
    }
  });
  return fileList;
};

const protoFiles = getAllProtoFiles(protoDir);
const protoMessages = {};

const collectMessages = (namespace, obj) => {
  if (!obj.nested) return;
  for (const [key, value] of Object.entries(obj.nested)) {
    if (value instanceof protobuf.Type) {
      if (!protoMessages[namespace]) protoMessages[namespace] = {};
      protoMessages[namespace][key] = value;
    } else if (value instanceof protobuf.Namespace) {
      collectMessages(key, value);
    }
  }
};

export const loadProtos = async () => {
  try {
    const root = new protobuf.Root();

    await Promise.all(protoFiles.map((file) => root.load(file)));

    console.log("[loadProtos] 로드된 파일:", protoFiles);
    console.log(
      "[loadProtos] root.nestedArray:",
      root.nestedArray?.map((n) => n.name),
    );

    collectMessages("", root);
    Object.freeze(protoMessages);

    console.log("[loadProtos] protoMessages:", protoMessages);
  } catch (err) {
    console.error("Protobuf 파일 로드 중 오류가 발생했습니다:", err);
  }
};

export const getProtoMessages = () => {
  return protoMessages;
};
