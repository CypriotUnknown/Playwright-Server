import APIServer from "./api-server.js";
import PlaywrightServer from "./playwright-server.js";
import { config as LoadENV } from 'dotenv';

LoadENV({ path: process.env.ENV_FILE_PATH });
const playwrightServer = await PlaywrightServer.start();

APIServer.start(playwrightServer);