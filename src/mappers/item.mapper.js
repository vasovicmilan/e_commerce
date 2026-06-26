import { formatDateTime, formatDate } from "../utils/date.time.util.js";

function translateStatus(status) {
  const map = {
    "not-published": "Nije objavljen",
    published: "Objavljen",
    actioned: "Na akciji",
    featured: "Istaknut",
    empty: "Nema na stanju",
    partnership: "Partnerstvo",
  };
  return map[status] || status;
}

function formatFeatureImage(image) {
  if (!image?.img) return null;
  return {
    url: image.img,
    opis: image.imgDesc || "",
  };
}

function getUniqueVariationImages(variations = [], featureImageUrl = "") {
  const seen = new Set();
  const images = [];

  for (const v of variations) {
    const url = v?.image?.img;
    if (!url || url === featureImageUrl || seen.has(url)) continue;
    seen.add(url);
    images.push({
      url,
      opis: v.image?.imgDesc || "",
    });
  }

  return images;
}

function getPriceRange(variations = []) {
  if (!variations.length) return { min: 0, max: 0, single: 0 };

  const prices = variations.map((v) => v.price).filter((p) => typeof p === "number");
  if (!prices.length) return { min: 0, max: 0, single: 0 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    min,
    max,
    single: min === max ? min : null,
  };
}

function getActionPriceRange(variations = []) {
  const actionVariations = variations.filter(
    (v) => v.onAction && typeof v.actionPrice === "number"
  );
  if (!actionVariations.length) {
    return { min: 0, max: 0, single: 0, isOnAction: false };
  }

  const prices = actionVariations.map((v) => v.actionPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    min,
    max,
    single: min === max ? min : null,
    isOnAction: true,
  };
}

function formatPrice(price) {
  if (typeof price !== "number") return "0";
  return price.toString();
}

function formatPriceRange(priceRange, actionPriceRange) {
  if (actionPriceRange.isOnAction && actionPriceRange.single) {
    return formatPrice(actionPriceRange.single);
  }
  if (actionPriceRange.isOnAction) {
    return `${formatPrice(actionPriceRange.min)}–${formatPrice(actionPriceRange.max)}`;
  }
  if (priceRange.single) {
    return formatPrice(priceRange.single);
  }
  return `${formatPrice(priceRange.min)}–${formatPrice(priceRange.max)}`;
}

function mapMeasurements(measurements) {
  if (!measurements || typeof measurements !== "object") return null;

  const labels = {
    bust: "Grudi",
    chest: "Grudni koš",
    sleeve: "Dužina rukava",
    length: "Ukupna dužina",
    waist: "Struk",
    hips: "Kukovi",
    inseam: "Unutrašnja dužina nogavice",
    rise: "Visina struka",
    thigh: "Obim butine",
    note: "Napomena",
  };

  const unit = measurements.unit || "cm";
  const result = {};

  for (const [key, label] of Object.entries(labels)) {
    const value = measurements[key];
    if (typeof value === "number" && value > 0) {
      result[label] = `${value} ${unit}`;
    } else if (typeof value === "string" && value.trim()) {
      result[label] = value.trim();
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function mapCategoryList(categories = []) {
  return categories.map((c) => ({
    id: c._id?.toString(),
    naziv: c.name,
    slug: c.slug,
  }));
}

function mapTagList(tags = []) {
  return tags.map((t) => ({
    id: t._id?.toString(),
    naziv: t.name,
    slug: t.slug,
    tip: t.type,
  }));
}

function mapKeywords(keyWords = []) {
  return keyWords.filter((k) => k && k.trim());
}

function mapFaq(faq = []) {
  return faq.map((f) => ({
    id: f._id?.toString(),
    pitanje: f.question,
    odgovor: f.answer,
    ikona: f.icon || null,
  }));
}

function mapRatings(ratings = []) {
  return ratings.map((r) => ({
    id: r._id?.toString(),
    userId: r.userId?.toString(),
    ocena: r.stars,
    komentar: r.review || "",
    datum: r.createdAt ? formatDateTime(r.createdAt) : null,
  }));
}

export function mapItemsForAdminList(items = []) {
  return items
    .map((item) => {
      if (!item) return null;

      const priceRange = getPriceRange(item.variations);
      const actionPriceRange = getActionPriceRange(item.variations);

      return {
        id: item._id.toString(),
        sku: item.sku,
        naziv: item.title,
        slug: item.slug,
        status: translateStatus(item.status),
        statusRaw: item.status,
        slika: item.featureImage?.img ? `/images/items/${item.featureImage.img}` : null,
        kategorije: (item.categories || []).map((c) => c.name || c).join(", "),
        tagovi: (item.tags || []).map((t) => t.name || t).join(", "),
        brojVarijacija: (item.variations || []).length,
        cena: formatPrice(priceRange.single || priceRange.min),
        akcijskaCena: actionPriceRange.isOnAction
          ? formatPrice(actionPriceRange.single || actionPriceRange.min)
          : null,
        naAkciji: actionPriceRange.isOnAction,
        prosecnaOcena: item.rating?.average || 0,
        brojOcena: item.rating?.count || 0,
        ukupnoProdato: item.soldCount,
        ukupnoVraceno: item.returnedCount,
        kreiran: formatDate(item.createdAt),
        azuriran: formatDate(item.updatedAt),
      };
    })
    .filter(Boolean);
}

export function mapItemForAdminDetail(item) {
  if (!item) return null;

  const variations = item.variations || [];
  const priceRange = getPriceRange(variations);
  const actionPriceRange = getActionPriceRange(variations);
  const featureImage = formatFeatureImage(item.featureImage);

  return {
    id: item._id.toString(),
    osnovno: {
      naziv: item.title,
      sku: item.sku,
      slug: item.slug,
      status: translateStatus(item.status),
      statusRaw: item.status,
    },
    slike: {
      istaknuta: featureImage,
      galerija: getUniqueVariationImages(variations, featureImage?.url),
    },
    video: item.video?.vid
      ? {
          url: item.video.vid,
          opis: item.video.vidDesc || "",
        }
      : null,
    cene: {
      osnovna: formatPriceRange(priceRange, {
        isOnAction: false,
        single: null,
        min: 0,
        max: 0,
      }),
      akcijska: actionPriceRange.isOnAction
        ? formatPriceRange(priceRange, actionPriceRange)
        : null,
      naAkciji: actionPriceRange.isOnAction,
      brojVarijacijaNaAkciji: variations.filter((v) => v.onAction).length,
    },
    varijacije: variations.map((v) => ({
      id: v._id?.toString(),
      velicina: v.size,
      boja: v.color,
      kolicina: v.amount,
      naStanju: v.amount > 0,
      cena: formatPrice(v.price),
      akcijskaCena: v.onAction ? formatPrice(v.actionPrice) : null,
      naAkciji: v.onAction,
      usteda: v.onAction && v.actionPrice ? formatPrice(v.price - v.actionPrice) : null,
      slika: v.image?.img
        ? {
            url: v.image.img,
            opis: v.image.imgDesc || "",
          }
        : null,
      merenja: mapMeasurements(v.measurements),
      merenjaRaw: v.measurements || null,
    })),
    kategorije: mapCategoryList(item.categories || []),
    tagovi: mapTagList(item.tags || []),
    rating: {
      prosek: item.rating?.average || 0,
      brojOcena: item.rating?.count || 0,
      ocene: mapRatings(item.rating?.ratings || []),
    },
    seo: {
      opis: item.description || "",
      kratakOpis: item.shortDescription || "",
      kljucneReci: mapKeywords(item.keyWords || []),
      faq: mapFaq(item.faq || []),
    },
    marketing: {
      upSell: (item.upSellItems || []).map((id) => id.toString()),
      crossSell: (item.crossSellItems || []).map((id) => id.toString()),
    },
    partneri: (item.partners || []).map((p) => ({
      id: p._id?.toString(),
      partnerId: p.partnerId?.toString(),
      kod: p.partnerCode,
      procenat: p.partnerShare,
    })),
    backorder: {
      dozvoljen: item.backOrder?.isAllowed || false,
      broj: (item.backOrder?.orders || []).length,
    },
    wishlist: (item.wishlist || []).length,
    statistika: {
      prodato: item.soldCount,
      vraceno: item.returnedCount,
    },
    vreme: {
      kreirano: formatDateTime(item.createdAt),
      azurirano: formatDateTime(item.updatedAt),
    },
  };
}

export function mapItemForEdit(item) {
  if (!item) return null;

  return {
    id: item._id.toString(),
    title: item.title,
    sku: item.sku,
    slug: item.slug,
    status: item.status,
    featureImage: item.featureImage,
    video: item.video,
    categories: (item.categories || []).map((c) => c._id?.toString() || c),
    tags: (item.tags || []).map((t) => t._id?.toString() || t),
    variations: item.variations || [],
    description: item.description,
    shortDescription: item.shortDescription,
    keyWords: item.keyWords || [],
    faq: item.faq || [],
    upSellItems: (item.upSellItems || []).map((id) => id.toString()),
    crossSellItems: (item.crossSellItems || []).map((id) => id.toString()),
    partners: item.partners || [],
    backOrder: item.backOrder,
  };
}

export function mapItemsForShop(items = []) {
  return items
    .map((item) => {
      if (!item) return null;

      const priceRange = getPriceRange(item.variations);
      const actionPriceRange = getActionPriceRange(item.variations);

      return {
        id: item._id.toString(),
        naziv: item.title,
        slug: item.slug,
        kratakOpis: item.shortDescription || "",
        status: item.status,
        // 🔥 IZMENA: direktna putanja do slike (string)
        slika: item.featureImage?.img ? `/images/items/${item.featureImage.img}` : null,
        cena: formatPriceRange(priceRange, actionPriceRange),
        originalnaCena: actionPriceRange.isOnAction
          ? formatPriceRange(priceRange, {
              isOnAction: false,
              single: null,
              min: 0,
              max: 0,
            })
          : null,
        naAkciji: actionPriceRange.isOnAction,
        prosecnaOcena: item.rating?.average || 0,
        brojOcena: item.rating?.count || 0,
        kategorije: mapCategoryList(item.categories || []),
      };
    })
    .filter(Boolean);
}

export function mapItemsForCard(items = []) {
  return mapItemsForShop(items).map((item) => ({
    ...item,
    kategorije: undefined,
  }));
}

export function mapItemForPublic(item) {
  if (!item) return null;

  const variations = item.variations || [];
  const priceRange = getPriceRange(variations);
  const actionPriceRange = getActionPriceRange(variations);
  
  // 🔥 Puna putanja za glavnu sliku
  const featureImage = item.featureImage?.img 
    ? `/images/items/${item.featureImage.img}` 
    : null;
  const featureImageDesc = item.featureImage?.imgDesc || "";

  // 🔥 Galerija – pune putanje
  const galleryImages = getUniqueVariationImages(variations, item.featureImage?.img)
    .map(img => `/images/items/${img.url}`);

  // 🔥 Varijacije sa punim putanjama za slike
  const variationsMapped = variations.map((v) => ({
    id: v._id?.toString(),
    velicina: v.size,
    boja: v.color,
    kolicina: v.amount,
    naStanju: v.amount > 0,
    cena: formatPrice(v.price),
    akcijskaCena: v.onAction ? formatPrice(v.actionPrice) : null,
    naAkciji: v.onAction,
    slika: v.image?.img ? {
      url: v.image.img,
      opis: v.image.imgDesc || "",
    } : null,
    slikaUrl: v.image?.img ? `/images/items/${v.image.img}` : null, // 🔥 Dodato
    merenja: mapMeasurements(v.measurements),
    merenjaRaw: v.measurements || null,
  }));

  return {
    id: item._id.toString(),
    naziv: item.title,
    sku: item.sku,
    slug: item.slug,
    status: item.status,
    cena: formatPriceRange(priceRange, actionPriceRange),
    originalnaCena: actionPriceRange.isOnAction
      ? formatPriceRange(priceRange, {
          isOnAction: false,
          single: null,
          min: 0,
          max: 0,
        })
      : null,
    naAkciji: actionPriceRange.isOnAction,
    kratakOpis: item.shortDescription || "",
    opis: item.description || "",
    slike: {
      istaknuta: featureImage,
      galerija: galleryImages,
    },
    video: item.video?.vid
      ? {
          url: item.video.vid,
          opis: item.video.vidDesc || "",
        }
      : null,
    varijacije: variationsMapped,
    rating: {
      prosek: item.rating?.average || 0,
      brojOcena: item.rating?.count || 0,
    },
    kategorije: mapCategoryList(item.categories || []),
    tagovi: mapTagList(item.tags || []),
    kljucneReci: mapKeywords(item.keyWords || []),
    faq: mapFaq(item.faq || []),
    upSellItems: item.upSellItems ? mapItemsForCard(item.upSellItems) : [],
    crossSellItems: item.crossSellItems ? mapItemsForCard(item.crossSellItems) : [],
  };
}

export function mapItemsForSelect(items = []) {
  return items.map((item) => ({
    id: item._id.toString(),
    naziv: item.title,
    sku: item.sku,
    cena: formatPriceRange(
      getPriceRange(item.variations),
      getActionPriceRange(item.variations)
    ),
  }));
}

export function mapVariationSnapshotForOrder(item, variationId) {
  if (!item) return null;

  const variation = (item.variations || []).find(
    (v) => String(v._id) === String(variationId)
  );

  if (!variation) return null;

  const isOnAction = item.status === "actioned" && variation.onAction;
  const finalPrice =
    isOnAction && variation.actionPrice
      ? variation.actionPrice
      : variation.price;

  return {
    itemId: item._id.toString(),
    variationId: variation._id.toString(),
    title: item.title,
    size: variation.size,
    color: variation.color,
    price: finalPrice,
    image: {
      img: variation.image?.img || item.featureImage?.img || null,
      imgDesc:
        variation.image?.imgDesc || item.featureImage?.imgDesc || null,
    },
    sku: item.sku,
    code: null,
  };
}

export function mapVariationSnapshotForCart(
  item,
  variationId,
  affiliateCode = null
) {
  const snapshot = mapVariationSnapshotForOrder(item, variationId);
  if (!snapshot) return null;

  if (affiliateCode) {
    const partner = (item.partners || []).find(
      (p) => p.partnerCode === affiliateCode
    );
    if (partner) {
      snapshot.code = partner.partnerCode;
    }
  }

  return snapshot;
}

export function mapItemRaw(item) {
  return item;
}

export { getPriceRange, getActionPriceRange, formatPriceRange };

export default {
  mapItemsForAdminList,
  mapItemForAdminDetail,
  mapItemForEdit,
  mapItemsForShop,
  mapItemsForCard,
  mapItemForPublic,
  mapItemsForSelect,
  mapVariationSnapshotForOrder,
  mapVariationSnapshotForCart,
  mapItemRaw,
  getPriceRange,
  getActionPriceRange,
  formatPriceRange,
};