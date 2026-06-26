import {
  buildAbsoluteUrl,
  resolveRobots,
  getImageUrl,
  buildTitle,
  formatMetaDescription,
} from "../utils.js";

export function buildBaseSeo({
  title,
  description,
  canonical,
  image,
  isIndexable = true,
  type = "website",
  siteName,
  locale = "sr_RS",
  twitterHandle = "@tophelanke",
} = {}) {
  // 🔥 ZAŠTITA: osiguraj da title uvek postoji
  const safeTitle = title || 'TopHelanke';
  const finalTitle = buildTitle(safeTitle, siteName);
  const finalDescription = formatMetaDescription(description);
  const finalUrl = buildAbsoluteUrl(canonical);
  const finalImage = getImageUrl(image);

  return {
    title: finalTitle,
    description: finalDescription,
    canonical: finalUrl,

    meta: {
      robots: resolveRobots({ isIndexable }),
    },

    openGraph: {
      type,
      title: finalTitle,
      description: finalDescription,
      url: finalUrl,
      site_name: siteName || "TopHelanke",
      locale,
      image: finalImage,
      imageWidth: 1200,
      imageHeight: 630,
      imageAlt: safeTitle,
    },

    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: finalTitle,
      description: finalDescription,
      image: finalImage,
      imageAlt: safeTitle,
      site: twitterHandle,
      creator: twitterHandle,
    },

    pageTitle: finalTitle,
    pageDescription: finalDescription,
    pageCanonical: finalUrl,
    pageRobots: resolveRobots({ isIndexable }),
    pageOgImage: finalImage,
  };
}