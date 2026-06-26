import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import logger from "./config/logger.config.js";
import { initTelegramBot, stopTelegramBot } from "./integrations/telegram/telegram.provider.js";

dotenv.config();

const PORT = process.env.PORT || 3002;

let bot;
let server;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    logger.info("📦 MongoDB connected");

    if (process.env.NODE_ENV === "production" && process.env.TELEGRAM_BOT_TOKEN) {
      bot = initTelegramBot();
    }

    server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

  } catch (error) {
    logger.error("❌ Startup failed", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`🛑 ${signal} received. Shutting down gracefully...`);

  try {
    if (bot) {
      await stopTelegramBot();
      logger.info("🤖 Telegram bot stopped");
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
      logger.info("📦 MongoDB connection closed");
    }

    if (server) {
      server.close(() => {
        logger.info("🖥 HTTP server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("⚠️ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }

  } catch (error) {
    logger.error("❌ Shutdown error", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error);
  process.exit(1);
});

start();

export default server;