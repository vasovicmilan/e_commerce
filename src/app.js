import express from "express";
import { httpLogger } from "./config/morgan.config.js";
import logger from "./config/logger.config.js";

import { corsConfig } from "./config/cors.config.js";
import { setupHelmet } from "./config/helmet.config.js";
import { setupStatic } from "./config/static.config.js";
import { setupSession } from "./config/session.config.js";
import { setupFlash } from "./config/flash.config.js";
import { setupMethodOverride } from "./config/method.override.config.js";
import { setupSanitize } from "./config/sanitize.config.js";
import { setupLocals } from "./config/locals.config.js";
import { setupViewEngine } from "./config/view.engine.config.js";

import { csrfLocals, csrfWebProtection } from "./config/csrf.config.js";
import { cartCountMiddleware } from "./middlewares/cart.middleware.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/error.middleware.js";
import { registerAllListeners } from "./events/listeners/index.js";

import { globalLimiter } from "./middlewares/rate.limiter.middleware.js";
import routes from "./routes/index.routes.js";

const app = express();

setupViewEngine(app);

setupHelmet(app);

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(globalLimiter);

app.use(httpLogger);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

setupSanitize(app);

// setupMethodOverride(app);

app.use((req, res, next) => {
  if (req.method === "POST") {
    const method = req.body?._method || req.query?._method;
    if (method && ["PUT", "DELETE", "PATCH"].includes(method.toUpperCase())) {
      req.method = method.toUpperCase();
      req.originalMethod = "POST";
    }
  }
  next();
});

setupStatic(app);

setupSession(app);

setupFlash(app);

setupLocals(app);

app.use(cartCountMiddleware);

app.use(csrfLocals);
app.use(csrfWebProtection);

registerAllListeners();

app.use(routes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;