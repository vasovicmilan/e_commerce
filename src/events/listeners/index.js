import { registerEmailListeners } from "./email.listener.js";
import { registerEmailFailedListeners } from "./email-failed.listener.js";
import { registerTelegramListeners } from "./telegram.listener.js";

export function registerAllListeners() {
  registerEmailListeners();
  registerEmailFailedListeners();
  registerTelegramListeners();
}

export default {
  registerAllListeners,
};