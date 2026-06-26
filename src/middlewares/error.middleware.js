import { buildWebErrorContext, buildApiErrorPayload, AppError } from "../utils/error.util.js";
import { logError } from "../utils/logger.util.js";
import { maskSensitive } from "../utils/logger.util.js";
import { buildPageSeo } from "../seo/index.js";

function isApiRequest(req) {
  return (
    req.isApi ||
    Boolean(req.baseUrl && req.baseUrl.startsWith("/api")) ||
    Boolean(req.originalUrl && req.originalUrl.startsWith("/api")) ||
    Boolean((req.get("Accept") || "").includes("application/json")) ||
    Boolean(req.xhr)
  );
}

export function globalErrorHandler(err, req, res, next) {
  const errorId = Math.random().toString(36).slice(2, 10);
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === "development";

  logError(
    `[ERR ${errorId}] ${req.method} ${req.originalUrl} - ${err.message}`,
    err,
    {
      errorId,
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: maskSensitive(req.body),
      userId: req.session?.user?.id || req.session?.user?._id || null,
      ip: req.ip || req.headers["x-forwarded-for"] || null,
      statusCode,
      isOperational: err.isOperational,
    }
  );

  // X-Error-ID header za debugging
  try {
    res.setHeader("X-Error-ID", errorId);
  } catch (e) {
    // ignore
  }

  if (isApiRequest(req)) {
    const { statusCode: apiStatus, payload } = buildApiErrorPayload(err, req, { errorId });
    return res.status(apiStatus).json(payload);
  }

  const ctx = buildWebErrorContext(err, req, { errorId });

  const seo = buildPageSeo({
    title: `Greška ${ctx.statusCode} - ${ctx.errorMsg}`,
    description: `Došlo je do greške prilikom učitavanja stranice.`,
    canonical: req.originalUrl,
    isIndexable: false,
  });

  return res.status(ctx.statusCode).render("errors/error", {
    pageTitle: `Greška ${ctx.statusCode}`,
    pageDescription: ctx.errorMsg,
    isDevelopment,
    data: {
      seo,
      errorId: ctx.errorId,
      statusCode: ctx.statusCode,
      errorMsg: ctx.errorMsg,
      errorDetails: ctx.errorDetails,
    },
    ...ctx,
  });
}

export function notFoundHandler(req, res, next) {
  if (isApiRequest(req)) {
    return next(new AppError("API ruta nije pronađena", 404, { name: "NotFoundError" }));
  }

  return next(new AppError("Stranica nije pronađena", 404, { name: "NotFoundError" }));
}