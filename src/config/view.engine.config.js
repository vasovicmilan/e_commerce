import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupViewEngine(app) {
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  const publicPath = path.join(__dirname, "..", "..", "public");
  app.use(express.static(publicPath));
}