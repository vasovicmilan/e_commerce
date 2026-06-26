import eventEmitter from "../event.emitter.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logInfo, logError } from "../../utils/logger.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, "..", "..", "logs");
const FAILED_EMAILS_LOG = path.join(LOGS_DIR, "failed-emails.json");

export function registerEmailFailedListeners() {

  eventEmitter.on("email:failed", async (failedData) => {
    try {
      let failedEmails = [];
      try {
        if (fs.existsSync(FAILED_EMAILS_LOG)) {
          const data = fs.readFileSync(FAILED_EMAILS_LOG, "utf8");
          failedEmails = JSON.parse(data);
        }
      } catch (err) {
        logError("Failed to read failed emails log", err);
      }

      failedEmails.push({
        ...failedData,
        attempts: 0,
        maxAttempts: 3,
        firstAttempt: new Date().toISOString(),
        lastAttempt: new Date().toISOString(),
      });

      if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }

      fs.writeFileSync(FAILED_EMAILS_LOG, JSON.stringify(failedEmails, null, 2));

      logInfo("Failed email logged for retry", {
        type: failedData.type,
        email: failedData.email,
        totalFailed: failedEmails.length,
      });
    } catch (error) {
      logError("Failed to log failed email", error);
    }
  });

  logInfo("Email failed listeners registered");
}