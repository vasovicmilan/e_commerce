import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const LOGS_DIR = path.join(__dirname, "..", "..", "logs");

let streams = [];

if (isProd) {
  // Produkcija: samo fajlovi (JSON lines)
  streams = [
    {
      stream: pino.destination({ dest: path.join(LOGS_DIR, "app.log"), mkdir: true }),
      level: "info",
    },
    {
      stream: pino.destination({ dest: path.join(LOGS_DIR, "error.log"), mkdir: true }),
      level: "error",
    },
  ];
} else if (!isTest) {
  // Development: konzola (pretty) + fajlovi (JSON lines)
  const prettyStream = pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:dd.mm.yyyy HH:MM:ss",
      ignore: "pid,hostname",
    },
  });

  streams = [
    { stream: prettyStream, level: "info" },
    {
      stream: pino.destination({ dest: path.join(LOGS_DIR, "app-dev.log"), mkdir: true }),
      level: "info",
    },
    {
      stream: pino.destination({ dest: path.join(LOGS_DIR, "error-dev.log"), mkdir: true }),
      level: "error",
    },
  ];
} else {
  // Test: tiho
  streams = [{ stream: pino.destination("/dev/null") }];
}

const logger = pino(
  {
    level: isTest ? "silent" : process.env.LOG_LEVEL || "info",
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        pid: bindings.pid,
        host: bindings.hostname,
        env: process.env.NODE_ENV || "development",
      }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams)
);

logger.on("error", (err) => {
  console.error("Logger stream error:", err);
});

export default logger;