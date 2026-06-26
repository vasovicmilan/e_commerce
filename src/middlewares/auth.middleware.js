import jwt from "jsonwebtoken";

export function webAuthMiddleware(req, res, next) {
  if (req.session?.isLoggedIn) {
    req.user = req.session.user;
    return next();
  }

  req.flash("error", "Morate biti prijavljeni");
  return res.redirect("/auth/prijava");
}

export function apiAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No token provided",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token",
    });
  }
}

export function optionalApiAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Nije ulogovan - ignoriši
    }
  }

  next();
}

export function optionalWebAuth(req, res, next) {
  if (req.session?.isLoggedIn) {
    req.user = req.session.user;
  }

  next();
}