const SITE_NAME = process.env.SITE_NAME || "TopHelanke";
const BASE_URL = process.env.BASE_URL || "https://www.tophelanke.com";
const DEFAULT_IMAGE = "/images/default-og.webp";

export const SITE_URL = BASE_URL; // DODATO

export function truncate(text, max = 160) {
  if (!text) return "";
  const plain = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max - 3) + "...";
}

export function escape(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

export function buildAbsoluteUrl(path) {
  if (!path) return BASE_URL;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export function getImageUrl(imagePath) {
  if (!imagePath || imagePath === "undefined" || imagePath === "null") {
    return buildAbsoluteUrl(DEFAULT_IMAGE);
  }
  if (imagePath.startsWith("http")) return imagePath;
  const cleanPath = imagePath.replace(/^\/+/, "");
  if (!cleanPath.startsWith("images/")) {
    return buildAbsoluteUrl(`images/${cleanPath}`);
  }
  return buildAbsoluteUrl(cleanPath);
}

export function resolveRobots({ isIndexable = true }) {
  return isIndexable ? "index,follow" : "noindex,follow";
}

export function formatMetaDescription(description, max = 160) {
  return truncate(description, max);
}

export function buildTitle(title, siteName = SITE_NAME) {
  if (!title || typeof title !== 'string') {
    title = 'TopHelanke';
  }
  const cleanTitle = title.replace(/\s*\|\s*TopHelanke\s*$/i, "").trim();
  return `${escape(cleanTitle)} | ${siteName}`;
}