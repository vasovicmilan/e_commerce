import session from "express-session";
import MongoStore from "connect-mongo";

const isTest = process.env.NODE_ENV === "test";
const isProd = process.env.NODE_ENV === "production";

export function setupSession(app) {
  if (isTest) {
    app.use(
      session({
        name: "sid-test",
        secret: "test-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 1000 * 60 * 60 * 24,
        },
      })
    );

    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      if (!req.session) return next();
      if (!req.session.__init) {
        req.session.__init = true;
      }
      next();
    });

    return;
  }

  if (isProd) {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      name: "sid_tophelanke",
      secret: process.env.SESSION_SECRET || "tophelanke-session-secret",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || process.env.MONGODB_URI,
        collectionName: "sessions",
        ttl: 24 * 60 * 60,
        autoRemove: "native",
        stringify: false,
      }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );

  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();
    if (!req.session) return next();
    if (!req.session.__init) {
      req.session.__init = true;
    }
    next();
  });
}