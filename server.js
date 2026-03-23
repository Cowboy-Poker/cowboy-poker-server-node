import "dotenv/config";
import App from "./src/App.js";
import { config } from "./src/config/config.js";

App.getInstance().listen(config.server.httpPort);
