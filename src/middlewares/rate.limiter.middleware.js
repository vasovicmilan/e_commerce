import rateLimit from "express-rate-limit";
import path from "path";
import { AppError } from "../utils/error.util.js"; // prilagodite putanju vašoj implementaciji

function skipStatic(req) {
  if (req.method !== "GET") return false;

  const staticExt = [
    ".js", ".css", ".png", ".jpg", ".jpeg", ".webp", ".svg",
    ".gif", ".woff", ".woff2", ".ttf", ".eot",
    ".ico", ".map", ".mp4", ".webm", ".pdf", ".json",
  ];

  const ext = path.extname(req.path).toLowerCase();
  return staticExt.includes(ext);
}

// Zajednički handler za sve limitere
function handleRateLimitExceeded(message, statusCode = 429) {
  return (req, res, next) => {
    // Ako je API ruta, vrati JSON
    if (req.originalUrl.startsWith("/api")) {
      return res.status(statusCode).json({
        success: false,
        message: message,
      });
    }

    // Za web rute, prosledi grešku globalnom error handler-u
    const error = new AppError(message, statusCode);
    next(error);
  };
}

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipStatic,
  handler: handleRateLimitExceeded("Previše zahteva – pokušajte ponovo kasnije."),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handleRateLimitExceeded("Previše pokušaja prijave – pokušajte ponovo za 15 minuta."),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše pokušaja registracije – pokušajte ponovo za 1 sat."),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše zahteva za reset lozinke – pokušajte ponovo za 1 sat."),
});

export const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše pokušaja verifikacije – pokušajte ponovo za 1 sat."),
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Možete poslati samo jednu poruku u minuti."),
});

export const newsletterLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše pokušaja – pokušajte ponovo kasnije."),
});

export const testimonialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše testimoniala – pokušajte ponovo za 1 sat."),
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše pretraga – pokušajte ponovo kasnije."),
});

export const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše zahteva – pokušajte ponovo kasnije."),
});

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše pokušaja – pokušajte ponovo za 1 minut."),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("API rate limit exceeded.", 429),
});

export const apiAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handleRateLimitExceeded("Previše API auth pokušaja.", 429),
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded("Previše zahteva ka admin panelu.", 429),
});