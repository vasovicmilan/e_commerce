import { SITE_URL } from "../utils.js";

function toAbsoluteUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  const clean = img.replace(/^images\//, "");
  return `${SITE_URL}/images/${clean}`;
}

function getImageList(item) {
  const variations = item.variations || [];
  const images = variations
    .map(v => v.image?.img)
    .filter(Boolean)
    .map(toAbsoluteUrl);

  const featureImage = item.featureImage?.img
    ? toAbsoluteUrl(item.featureImage.img)
    : null;

  return {
    main: featureImage,
    gallery: images,
    all: [featureImage, ...images].filter(Boolean),
  };
}

function getPriceData(variations) {
  const validVariations = variations.filter(v => Number(v.price) > 0);
  if (!validVariations.length) {
    return {
      regularPrice: 0,
      salePrice: null,
      minPrice: 0,
      maxPrice: 0,
      hasDiscount: false,
      savingsAmount: 0,
      savingsPercentage: 0,
    };
  }

  const regularPrices = validVariations.map(v => Number(v.price));
  const actionPrices = validVariations
    .filter(v => v.onAction && Number(v.actionPrice) > 0)
    .map(v => Number(v.actionPrice));

  const regularPrice = Math.min(...regularPrices);
  const maxRegularPrice = Math.max(...regularPrices);
  const minSalePrice = actionPrices.length ? Math.min(...actionPrices) : null;

  const hasDiscount = Boolean(minSalePrice && minSalePrice < regularPrice);
  const savingsAmount = hasDiscount ? regularPrice - minSalePrice : 0;
  const savingsPercentage = hasDiscount && regularPrice > 0
    ? Math.round((savingsAmount / regularPrice) * 100)
    : 0;

  return {
    regularPrice,
    salePrice: minSalePrice,
    minPrice: minSalePrice ?? regularPrice,
    maxPrice: maxRegularPrice,
    hasDiscount,
    savingsAmount,
    savingsPercentage,
  };
}

function getStockData(variations) {
  const inStockVariations = variations.filter(v => Number(v.amount) > 0);
  const totalStock = variations.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  return {
    inStock: inStockVariations.length > 0,
    totalStock,
    availableSizes: [...new Set(inStockVariations.map(v => v.size).filter(Boolean))],
    availableColors: [...new Set(inStockVariations.map(v => v.color).filter(Boolean))],
    variantCount: variations.length,
    stockVariants: inStockVariations.length,
  };
}

export function mapItemToSeoContract(item) {
  // 🔥 ZAŠTITA: ako nema item-a, vrati minimalni kontrakt
  if (!item) {
    return {
      title: 'Artikal',
      description: '',
      image: null,
      isIndexable: true,
      price: 0,
      salePrice: null,
    };
  }

  const variations = Array.isArray(item.variations) ? item.variations : [];
  const status = String(item.status).toLowerCase();
  const title = item.title || 'Artikal';

  const images = getImageList(item);
  const prices = getPriceData(variations);
  const stock = getStockData(variations);

  const isIndexable = !["not-published", "empty"].includes(status);

  const fullDescription = item.description || "";
  const wordCount = fullDescription ? fullDescription.split(/\s+/).length : 0;

  return {
    id: item._id?.toString(),
    slug: item.slug || '',
    sku: item.sku || '',
    title: title,

    description: item.shortDescription || "",
    fullDescription: item.description || "",

    image: images.main,
    images: images.all,
    gallery: images.gallery,

    price: prices.regularPrice,
    salePrice: prices.salePrice,
    priceRange: {
      min: prices.minPrice,
      max: prices.maxPrice,
      currency: "RSD",
    },

    hasDiscount: prices.hasDiscount,
    savingsAmount: prices.savingsAmount,
    savingsPercentage: prices.savingsPercentage,

    inStock: stock.inStock,
    isActioned: status === "actioned",
    isFeatured: status === "featured",
    isIndexable: isIndexable,

    categories: (item.categories || []).map(c => ({
      id: c._id?.toString(),
      name: c.name || c.title,
      slug: c.slug,
    })),

    tags: (item.tags || []).map(t => ({
      id: t._id?.toString(),
      name: t.name,
      slug: t.slug,
    })),

    variations: variations.map(v => ({
      size: v.size,
      color: v.color,
      price: Number(v.price),
      actionPrice: v.onAction ? Number(v.actionPrice) : null,
      onSale: Boolean(v.onAction),
      inStock: Number(v.amount) > 0,
      stock: Number(v.amount) || 0,
      image: v.image?.img ? toAbsoluteUrl(v.image.img) : null,
    })),

    stockData: {
      total: stock.totalStock,
      variantsInStock: stock.stockVariants,
      availableSizes: stock.availableSizes,
      availableColors: stock.availableColors,
      totalVariants: stock.variantCount,
    },

    faq: (item.faq || []).map(f => ({
      question: f.question,
      answer: f.answer,
    })),

    rating: item.rating?.average || null,
    reviewCount: item.rating?.count || 0,

    aiAttributes: {
      hasDiscount: prices.hasDiscount,
      savingsAmount: prices.savingsAmount,
      savingsPercentage: prices.savingsPercentage,
      availableSizes: stock.availableSizes,
      availableColors: stock.availableColors,
      totalStock: stock.totalStock,
      imageCount: images.all.length,
      hasGallery: images.all.length > 1,
      wordCount: wordCount,
      hasLongDescription: fullDescription.length > 300,
      hasVariants: variations.length > 1,
      variantCount: variations.length,
      garmentType: "lingerie",
      subType: "panties",
      sizeType: "mixed",
      sizeSystem: "EU",
      gender: "female",
      ageGroup: "adult",
      isNew: item.createdAt ? (Date.now() - new Date(item.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000) : false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    },
  };
}