import { buildBaseSeo } from "./base.builder.js";

export function buildPostSeo(contract) {
  if (!contract) {
    return buildBaseSeo({ title: "Članak nije pronađen", description: "", canonical: "/404" });
  }

  const title = contract.title || 'Članak';
  const canonical = `/blog/${contract.slug || ''}`;

  return buildBaseSeo({
    ...contract,
    title: title,
    description: contract.description || contract.excerpt || "",
    canonical: canonical,
    image: contract.image,
    isIndexable: contract.isIndexable !== false,

    article: {
      publishedTime: contract.publishedTime,
      modifiedTime: contract.modifiedTime,
      author: contract.author?.name,
      section: contract.category?.name,
      tags: contract.tags || [],
      readTime: contract.readTime,
    },

    aiAttributes: contract.aiAttributes || {},
    faq: contract.faq || [],
  });
}