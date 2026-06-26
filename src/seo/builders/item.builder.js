import { buildBaseSeo } from "./base.builder.js";

export function buildItemSeo(contract) {
  if (!contract) {
    return buildBaseSeo({ title: "Artikal nije pronađen", description: "", canonical: "/404" });
  }

  const title = contract.title || 'Artikal';
  let description = contract.description || contract.fullDescription || "";
  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  const canonical = `/prodavnica/artikal/${contract.slug || ''}`;

  return buildBaseSeo({
    ...contract,
    title: title,
    description: description,
    canonical: canonical,
    isIndexable: contract.isIndexable !== false,

    product: {
      price: contract.price,
      salePrice: contract.salePrice,
      inStock: contract.inStock,
      hasDiscount: contract.hasDiscount,
      savingsPercentage: contract.savingsPercentage,
      categories: contract.categories?.map(c => c.name) || [],
      tags: contract.tags?.map(t => t.name) || [],
      availableSizes: contract.stockData?.availableSizes || [],
      availableColors: contract.stockData?.availableColors || [],
      variations: contract.variations?.length || 0,
    },

    aiAttributes: contract.aiAttributes || {},
    faq: contract.faq || [],
    rating: contract.rating,
    reviewCount: contract.reviewCount,
  });
}