import { buildPageSeo } from "../seo/index.js";

export function adminSeoMiddleware(req, res, next) {
  const adminSeo = buildPageSeo({
    title: "Admin Panel",
    description: "Administracioni panel",
    canonical: req.originalUrl,
    isIndexable: false,
  });

  res.locals.seo = adminSeo;

  next();
}