import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_PATH = path.join(__dirname, "..", "public");
const isProd = process.env.NODE_ENV === "production";

export function setupStatic(app) {
  app.use(
    express.static(PUBLIC_PATH, {
      etag: true,
      lastModified: true,
      maxAge: isProd ? "30d" : 0,
      index: false,
    })
  );

  app.use(
    "/images",
    express.static(path.join(PUBLIC_PATH, "images"), {
      etag: true,
      lastModified: true,
      maxAge: isProd ? "30d" : 0,
      index: false,
      setHeaders: (res, filePath) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");

        if (filePath.endsWith(".webp")) {
          res.setHeader("Content-Type", "image/webp");
        }
        if (filePath.endsWith(".avif")) {
          res.setHeader("Content-Type", "image/avif");
        }
      },
    })
  );

  app.use(
    "/videos",
    express.static(path.join(PUBLIC_PATH, "videos"), {
      etag: true,
      lastModified: true,
      maxAge: isProd ? "30d" : 0,
      index: false,
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");
      },
    })
  );

  app.use(
    "/pdfs",
    express.static(path.join(PUBLIC_PATH, "pdfs"), {
      etag: true,
      lastModified: true,
      maxAge: isProd ? "30d" : 0,
      index: false,
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");
      },
    })
  );

  app.use(
    "/json",
    express.static(path.join(PUBLIC_PATH, "json"), {
      etag: true,
      lastModified: true,
      maxAge: isProd ? "30d" : 0,
      index: false,
    })
  );

  app.use(
    "/bootstrap/css",
    express.static(path.join(__dirname, "..", "..", "node_modules", "bootstrap", "dist", "css"), {
      maxAge: isProd ? "30d" : 0,
    })
  );

  app.use(
    "/bootstrap/js",
    express.static(path.join(__dirname, "..", "..", "node_modules", "bootstrap", "dist", "js"), {
      maxAge: isProd ? "30d" : 0,
    })
  );
}