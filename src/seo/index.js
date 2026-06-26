import { buildItemSeo } from "./builders/item.builder.js";
import { buildCategorySeo } from "./builders/category.builder.js";
import { buildTagSeo } from "./builders/tag.builder.js";
import { buildPageSeo } from "./builders/page.builder.js";
import { buildPostSeo } from "./builders/post.builder.js";

const builders = {
  item: buildItemSeo,
  category: buildCategorySeo,
  tag: buildTagSeo,
  post: buildPostSeo,
  page: buildPageSeo,
};

export function buildSeo(type, contract, items = []) {
  const builder = builders[type];
  if (!builder) {
    return buildPageSeo({ title: "TopHelanke", description: "", canonical: "/", isIndexable: true });
  }
  // 🔥 Zaštita: ako contract nije validan, prosledi prazan objekat
  const safeContract = contract || {};
  const result = builder(safeContract, items);
  // Osiguraj da result ima sva potrebna polja
  return result || buildPageSeo({ title: "TopHelanke", description: "", canonical: "/", isIndexable: true });
}

export { buildPageSeo };