import "dotenv/config";
import App from "./src/App.js";
import { config } from "./src/config/config.js";
import { initServer } from "./src/init/index.js";

await initServer();
App.getInstance().listen(config.server.httpPort);
