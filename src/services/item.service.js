import mongoose from "mongoose";
import * as itemRepo from "../repositories/item.repository.js";
import * as categoryService from "./category.service.js";
import * as tagService from "./tag.service.js";
import { slugify } from "../utils/helpers.util.js";
import {
  mapItemsForAdminList,
  mapItemForAdminDetail,
  mapItemForEdit,
  mapItemsForShop,
  mapItemsForCard,
  mapItemForPublic,
  mapItemsForSelect,
  mapVariationSnapshotForOrder,
  mapVariationSnapshotForCart,
} from "../mappers/item.mapper.js";
import {
  validationError,
  notFound,
  conflict,
  badRequest,
} from "../utils/error.util.js";
import { buildSeo } from "../seo/index.js";
import { mapItemToSeoContract } from "../seo/contracts/item.contract.js";
import { mapCategoryToSeoContract } from "../seo/contracts/category.contract.js";
import { mapTagToSeoContract } from "../seo/contracts/tag.contract.js";

function validateBasicData(data) {
  if (!data) validationError("data");
  if (!data.title) validationError("title");
  if (!data.sku) validationError("sku");
  if (!data.featureImage?.img) validationError("featureImage");
}

// ============================================================
//  POMOĆNE FUNKCIJE ZA VIDEO
// ============================================================

function normalizeVideoData(video, videoDesc = '') {
  if (!video) return {};
  if (typeof video === 'string') {
    return { vid: video, vidDesc: videoDesc || '' };
  }
  if (typeof video === 'object') {
    return {
      vid: video.vid || '',
      vidDesc: video.vidDesc || videoDesc || '',
    };
  }
  return {};
}

// ============================================================
//  🧼 POMOĆNA FUNKCIJA ZA SANITIZACIJU VARIJACIJE
// ============================================================

function sanitizeVariationData(data) {
  // Dozvoljena polja za varijaciju
  const allowedFields = ['size', 'color', 'amount', 'price', 'actionPrice', 'onAction', 'image', 'measurements'];
  const clean = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined && data[field] !== null) {
      clean[field] = data[field];
    }
  }

  // Obraduj onAction – pretvori u boolean
  if (data.onAction !== undefined) {
    let onAction = data.onAction;
    if (Array.isArray(onAction)) {
      onAction = onAction.some(v => v === '1' || v === true);
    } else if (typeof onAction === 'string') {
      onAction = onAction === '1' || onAction === 'true';
    } else {
      onAction = !!onAction;
    }
    clean.onAction = onAction;
  }

  // Obavezno postavi measurements ako postoji (parseMeasurements je već napravio objekat)
  if (data.measurements && typeof data.measurements === 'object') {
    clean.measurements = data.measurements;
  } else {
    clean.measurements = {};
  }

  // Konvertuj brojčane vrednosti
  if (clean.amount !== undefined) clean.amount = Number(clean.amount);
  if (clean.price !== undefined) clean.price = Number(clean.price);
  if (clean.actionPrice !== undefined) clean.actionPrice = Number(clean.actionPrice);

  return clean;
}

// ============================================================
//  ADMIN - READ
// ============================================================

export async function listItems({
  search,
  status,
  categoryId,
  tagId,
  limit = 10,
  page = 1,
} = {}) {
  const result = await itemRepo.findItems({
    search,
    status,
    categoryIds: categoryId ? [categoryId] : undefined,
    tagIds: tagId ? [tagId] : undefined,
    limit,
    page,
    sort: { createdAt: -1 },
    populateFields: ["categories", "tags"],
  });

  return {
    data: mapItemsForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getItemById(itemId) {
  if (!itemId) validationError("itemId");
  const item = await itemRepo.findItemById(itemId, ["categories", "tags"]);
  if (!item) notFound("Artikal");
  return mapItemForAdminDetail(item);
}

export async function getItemBySku(sku) {
  if (!sku) validationError("sku");
  const item = await itemRepo.findItemBySku(sku);
  if (!item) notFound("Artikal");
  return mapItemForAdminDetail(item);
}

export async function getItemBySlug(slug) {
  if (!slug) validationError("slug");
  const item = await itemRepo.findItemBySlug(slug, ["categories", "tags", "upSellItems", "crossSellItems"]);
  if (!item) notFound("Artikal");
  const mappedItem = mapItemForPublic(item);
  const seoContract = mapItemToSeoContract(item);
  const seo = buildSeo("item", seoContract);
  return { item: mappedItem, seo };
}

export async function getItemForEdit(itemId) {
  if (!itemId) validationError("itemId");
  const item = await itemRepo.findItemById(itemId, ["categories", "tags"]);
  if (!item) notFound("Artikal");
  return mapItemForEdit(item);
}

// ============================================================
//  ADMIN - CREATE
// ============================================================

export async function createItem(data) {
  validateBasicData(data);
  const existing = await itemRepo.findItemBySku(data.sku);
  if (existing) conflict("SKU već postoji");
  const slug = slugify(data.title);
  const normalizedVideo = normalizeVideoData(data.video, data.videoDesc || '');

  const itemData = {
    title: data.title,
    sku: data.sku,
    featureImage: data.featureImage,
    video: normalizedVideo,
    categories: data.categories || [],
    tags: data.tags || [],
    status: "not-published",
    slug,
    description: "",
    shortDescription: "",
    keyWords: [],
    faq: [],
    variations: [],
    upSellItems: [],
    crossSellItems: [],
    partners: [],
    backOrder: { isAllowed: false, orders: [] },
  };

  try {
    const created = await itemRepo.createItem(itemData);
    const itemObject = created.toObject ? created.toObject() : created;
    return mapItemForAdminDetail(itemObject);
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "sku";
      conflict(`Artikal sa ovim ${field} već postoji`);
    }
    throw error;
  }
}

// ============================================================
//  ADMIN - UPDATE
// ============================================================

export async function updateItem(itemId, data) {
  if (!itemId) validationError("itemId");
  if (!data || Object.keys(data).length === 0) validationError("data");
  const updateData = { ...data };
  if (data.title) {
    updateData.slug = slugify(data.title);
  }
  if (data.video !== undefined) {
    updateData.video = normalizeVideoData(data.video, data.videoDesc || '');
  }
  const updated = await itemRepo.updateItemById(itemId, updateData);
  if (!updated) notFound("Artikal");
  return mapItemForAdminDetail(updated);
}

// ============================================================
//  ADMIN - VARIJACIJE (sa sanitizacijom)
// ============================================================

export async function addVariation(itemId, variationData) {
  if (!itemId) validationError("itemId");
  if (!variationData) validationError("variationData");
  if (!variationData.size) validationError("size");
  if (!variationData.color) validationError("color");

  const item = await itemRepo.findItemById(itemId);
  if (!item) notFound("Artikal");

  const duplicate = (item.variations || []).find(
    (v) => v.size === variationData.size && v.color === variationData.color
  );
  if (duplicate) conflict("Varijacija sa ovom veličinom i bojom već postoji");

  // 🔥 Sanitizacija: uklanjamo sva polja koja ne pripadaju šemi
  const cleanVariation = sanitizeVariationData(variationData);

  const updated = await itemRepo.addVariation(itemId, cleanVariation);
  return mapItemForAdminDetail(updated);
}

export async function updateVariation(itemId, variationId, data) {
  if (!itemId) validationError("itemId");
  if (!variationId) validationError("variationId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  // 🔥 Sanitizacija: uklanjamo sva polja koja ne pripadaju šemi
  const cleanVariation = sanitizeVariationData(data);

  const updated = await itemRepo.updateVariation(itemId, variationId, cleanVariation);
  if (!updated) notFound("Varijacija");
  return mapItemForAdminDetail(updated);
}

export async function removeVariation(itemId, variationId) {
  if (!itemId) validationError("itemId");
  if (!variationId) validationError("variationId");
  const updated = await itemRepo.removeVariation(itemId, variationId);
  return mapItemForAdminDetail(updated);
}

// ============================================================
//  ADMIN - SEO
// ============================================================

export async function updateItemSeo(itemId, seoData) {
  if (!itemId) validationError("itemId");
  if (!seoData || Object.keys(seoData).length === 0) validationError("seoData");
  const updated = await itemRepo.updateItemSeo(itemId, seoData);
  if (!updated) notFound("Artikal");
  return mapItemForAdminDetail(updated);
}

// ============================================================
//  ADMIN - STATUS
// ============================================================

export async function updateItemStatus(itemId, status) {
  if (!itemId) validationError("itemId");
  if (!status) validationError("status");
  const updated = await itemRepo.updateItemById(itemId, { status });
  if (!updated) notFound("Artikal");
  return mapItemForAdminDetail(updated);
}

// ============================================================
//  ADMIN - DELETE
// ============================================================

export async function deleteItem(itemId) {
  if (!itemId) validationError("itemId");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const item = await itemRepo.findItemById(itemId, null, null, session);
    if (!item) {
      await session.abortTransaction();
      notFound("Artikal");
    }
    await itemRepo.removeAllReferences(itemId, session);
    await itemRepo.deleteItemById(itemId, session);
    await session.commitTransaction();
    return { deleted: true, id: itemId };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// ============================================================
//  ADMIN - POMOĆNE FUNKCIJE
// ============================================================

export async function getItemsForSelect({ excludeId, categoryId } = {}) {
  const filter = { statuses: ["published", "actioned", "featured"] };
  if (excludeId) {
    filter.ids = undefined;
    filter.rawFilter = { _id: { $ne: excludeId } };
  }
  if (categoryId) {
    filter.categoryIds = [categoryId];
  }
  const items = await itemRepo.findAllItems({
    ...filter,
    sort: { title: 1 },
    selectFields: "_id title sku variations.price variations.onAction variations.actionPrice",
  });
  return mapItemsForSelect(items);
}

export async function addUpSellItem(itemId, upSellItemId) {
  if (!itemId || !upSellItemId) validationError("itemId and upSellItemId");
  if (itemId === upSellItemId) badRequest("Ne možete dodati isti artikal");
  const updated = await itemRepo.updateItemById(itemId, {
    $push: { upSellItems: upSellItemId },
  });
  return mapItemForAdminDetail(updated);
}

export async function removeUpSellItem(itemId, upSellItemId) {
  if (!itemId || !upSellItemId) validationError("itemId and upSellItemId");
  const updated = await itemRepo.updateItemById(itemId, {
    $pull: { upSellItems: upSellItemId },
  });
  return mapItemForAdminDetail(updated);
}

export async function addCrossSellItem(itemId, crossSellItemId) {
  if (!itemId || !crossSellItemId) validationError("itemId and crossSellItemId");
  if (itemId === crossSellItemId) badRequest("Ne možete dodati isti artikal");
  const updated = await itemRepo.updateItemById(itemId, {
    $push: { crossSellItems: crossSellItemId },
  });
  return mapItemForAdminDetail(updated);
}

export async function removeCrossSellItem(itemId, crossSellItemId) {
  if (!itemId || !crossSellItemId) validationError("itemId and crossSellItemId");
  const updated = await itemRepo.updateItemById(itemId, {
    $pull: { crossSellItems: crossSellItemId },
  });
  return mapItemForAdminDetail(updated);
}

export async function removeCategoryFromItems(categoryId, session) {
  await itemRepo.updateMany(
    { categories: categoryId },
    { $pull: { categories: categoryId } },
    session
  );
}

export async function removeTagFromItems(tagId, session) {
  await itemRepo.updateMany(
    { tags: tagId },
    { $pull: { tags: tagId } },
    session
  );
}

// ============================================================
//  PUBLIC - PRODAVNICA
// ============================================================

export async function findPublishedItems({ limit = 12, page = 1 } = {}) {
  const result = await itemRepo.findPublishedItems({
    limit,
    page,
    populateFields: ["categories"],
  });
  return {
    data: mapItemsForCard(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function findFeaturedItems({ limit = 12, page = 1 } = {}) {
  const result = await itemRepo.findItemsByStatus("featured", {
    limit,
    page,
    populateFields: ["categories"],
  });
  return {
    data: mapItemsForCard(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function findActionedItems({ limit = 12, page = 1 } = {}) {
  const result = await itemRepo.findItemsOnAction({
    limit,
    page,
    populateFields: ["categories"],
  });
  return {
    data: mapItemsForCard(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function findItemsByCategorySlug(categorySlug, { limit = 12, page = 1 } = {}) {
  if (!categorySlug) validationError("categorySlug");
  const category = await categoryService.getCategoryDocumentBySlug(categorySlug, "item");
  const result = await itemRepo.findItemsByCategory(category._id, {
    limit,
    page,
    populateFields: ["categories"],
    statuses: ["published", "actioned", "featured"],
  });
  const seoContract = mapCategoryToSeoContract(category, "item");
  const seo = buildSeo("category", seoContract, result.data);
  return {
    category,
    data: mapItemsForShop(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    seo,
  };
}

export async function getItemsByCategoryIdRaw(categoryId, options = {}) {
  const result = await itemRepo.findItemsByCategory(categoryId, options);
  return result.data;
}

export async function findItemsByTagSlug(tagSlug, tagType = null, { limit = 12, page = 1 } = {}) {
  if (!tagSlug) validationError("tagSlug");
  if (!tagType) validationError("tagType");
  const tag = await tagService.getTagDocumentBySlug(tagSlug, "item", tagType);
  const result = await itemRepo.findItemsByTag(tag._id, {
    limit,
    page,
    populateFields: ["tags"],
    statuses: ["published", "actioned", "featured"],
  });
  const seoContract = mapTagToSeoContract(tag, "item");
  const seo = buildSeo("tag", seoContract, result.data);
  return {
    tag,
    data: mapItemsForShop(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    seo,
  };
}

export async function searchItems(search, { limit = 12, page = 1 } = {}) {
  if (!search || !search.trim()) validationError("search");
  const result = await itemRepo.findItems({
    search,
    limit,
    page,
    statuses: ["published", "actioned", "featured"],
    populateFields: ["categories"],
  });
  return {
    data: mapItemsForShop(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    search,
  };
}

// ============================================================
//  ORDER & STOCK
// ============================================================

export async function getVariationSnapshotForOrder(itemId, variationId, session = null) {
  if (!itemId) validationError("itemId");
  if (!variationId) validationError("variationId");
  const item = await itemRepo.findItemById(itemId, null, null, session);
  if (!item) notFound("Artikal");
  const snapshot = mapVariationSnapshotForOrder(item, variationId);
  if (!snapshot) notFound("Varijacija");
  return snapshot;
}

export async function getVariationSnapshotForCart(itemId, variationId, affiliateCode = null, session = null) {
  if (!itemId) validationError("itemId");
  if (!variationId) validationError("variationId");
  const item = await itemRepo.findItemById(itemId, null, null, session);
  if (!item) notFound("Artikal");
  const snapshot = mapVariationSnapshotForCart(item, variationId, affiliateCode);
  if (!snapshot) notFound("Varijacija");
  return snapshot;
}

export async function decreaseStock(items = [], { session } = {}) {
  if (!Array.isArray(items) || !items.length) badRequest("items");
  for (const { itemId, variationId, quantity } of items) {
    const item = await itemRepo.findItemById(itemId, null, null, session);
    if (!item) throw notFound("Artikal");
    const variation = (item.variations || []).find(
      (v) => String(v._id) === String(variationId)
    );
    if (!variation) throw notFound("Varijacija");
    if (variation.amount < quantity) {
      throw conflict(`Nema dovoljno na stanju: ${item.title} - ${variation.size}/${variation.color}`);
    }
    await itemRepo.updateVariationAmount(
      itemId,
      variationId,
      variation.amount - quantity,
      session
    );
  }
  return { success: true };
}

export async function restoreStock(items = [], { session } = {}) {
  if (!Array.isArray(items) || !items.length) badRequest("items");
  for (const { itemId, variationId, quantity } of items) {
    const item = await itemRepo.findItemById(itemId, null, null, session);
    if (!item) continue;
    const variation = (item.variations || []).find(
      (v) => String(v._id) === String(variationId)
    );
    if (!variation) continue;
    await itemRepo.updateVariationAmount(
      itemId,
      variationId,
      variation.amount + quantity,
      session
    );
  }
  return { success: true };
}

// ============================================================
//  RATING & WISHLIST
// ============================================================

export async function addOrUpdateItemRating(itemId, userId, stars, review = "") {
  if (!itemId) validationError("itemId");
  if (!userId) validationError("userId");
  if (!stars || stars < 1 || stars > 5) validationError("stars");
  const item = await itemRepo.findItemById(itemId);
  if (!item) notFound("Artikal");
  const updated = await itemRepo.addOrUpdateRating(itemId, userId, stars, review);
  return {
    average: updated.rating.average,
    count: updated.rating.count,
    userRating: { stars, review },
  };
}

export async function removeItemRating(itemId, userId) {
  if (!itemId) validationError("itemId");
  if (!userId) validationError("userId");
  const item = await itemRepo.findItemById(itemId);
  if (!item) notFound("Artikal");
  const updated = await itemRepo.removeRating(itemId, userId);
  return {
    average: updated.rating.average,
    count: updated.rating.count,
  };
}

export async function getUserItemRating(itemId, userId) {
  if (!itemId) validationError("itemId");
  if (!userId) validationError("userId");
  return itemRepo.getUserRating(itemId, userId);
}

export async function addToWishlist(itemId, userId) {
  if (!itemId) validationError("itemId");
  if (!userId) validationError("userId");
  const item = await itemRepo.findItemById(itemId);
  if (!item) notFound("Artikal");
  const updated = await itemRepo.addToWishlist(itemId, userId);
  return { inWishlist: true };
}

export async function removeFromWishlist(itemId, userId) {
  if (!itemId) validationError("itemId");
  if (!userId) validationError("userId");
  const item = await itemRepo.findItemById(itemId);
  if (!item) notFound("Artikal");
  await itemRepo.removeFromWishlist(itemId, userId);
  return { inWishlist: false };
}

export async function isInWishlist(itemId, userId) {
  if (!itemId) validationError("itemId");
  if (!userId) validationError("userId");
  return itemRepo.isInWishlist(itemId, userId);
}

export async function getUserWishlist(userId, { limit = 12, page = 1 } = {}) {
  if (!userId) validationError("userId");
  const result = await itemRepo.findItemsByWishlist(userId, {
    limit,
    page,
    statuses: ["published", "actioned", "featured"],
    populateFields: ["categories"],
  });
  return {
    data: mapItemsForCard(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

// ============================================================
//  STATISTIKA
// ============================================================

export async function getItemStats() {
  const [total, byStatus, totalStock, totalSold] = await Promise.all([
    itemRepo.countItems(),
    itemRepo.countItemsByStatus(),
    itemRepo.getTotalStock(),
    itemRepo.getTotalSold(),
  ]);
  return { total, byStatus, totalStock, totalSold };
}

// ============================================================
//  DEFAULT EXPORT
// ============================================================

export default {
  listItems,
  getItemById,
  getItemBySku,
  getItemBySlug,
  getItemForEdit,
  createItem,
  updateItem,
  updateItemStatus,
  addVariation,
  updateVariation,
  removeVariation,
  updateItemSeo,
  deleteItem,
  getItemsForSelect,
  addUpSellItem,
  removeUpSellItem,
  addCrossSellItem,
  removeCrossSellItem,
  findPublishedItems,
  findFeaturedItems,
  findActionedItems,
  findItemsByCategorySlug,
  getItemsByCategoryIdRaw,
  findItemsByTagSlug,
  searchItems,
  getVariationSnapshotForOrder,
  getVariationSnapshotForCart,
  decreaseStock,
  restoreStock,
  removeCategoryFromItems,
  removeTagFromItems,
  addOrUpdateItemRating,
  removeItemRating,
  getUserItemRating,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  getUserWishlist,
  getItemStats,
};