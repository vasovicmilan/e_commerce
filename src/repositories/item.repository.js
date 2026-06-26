import mongoose from "mongoose";
import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import { buildItemFilter } from "./filters/item.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

// ============================================================
//  FIND
// ============================================================

export async function findItems({
  search, sku, slug, status, statuses, categoryIds, tagIds,
  hasVariations, isOnAction, minPrice, maxPrice, size, color,
  inStock, isBackOrder, minRating, ids, rawFilter,
  limit: rawLimit, page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  selectFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildItemFilter({
    search, sku, slug, status, statuses, categoryIds, tagIds,
    hasVariations, isOnAction, minPrice, maxPrice, size, color,
    inStock, isBackOrder, minRating, ids, rawFilter,
  });

  let query = Item.find(filter).sort(sort).skip(skip).limit(limit).lean();
  if (selectFields) query = query.select(selectFields);
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  const countQuery = session
    ? Item.countDocuments(filter).session(session)
    : Item.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return { data, total, page: parseInt(rawPage, 10) || 1, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function findAllItems({
  search, sku, slug, status, statuses, categoryIds, tagIds,
  hasVariations, isOnAction, minPrice, maxPrice, size, color,
  inStock, isBackOrder, minRating, ids, rawFilter,
  sort = { createdAt: -1 },
  populateFields = null,
  selectFields = null,
  session = null,
} = {}) {
  const filter = buildItemFilter({
    search, sku, slug, status, statuses, categoryIds, tagIds,
    hasVariations, isOnAction, minPrice, maxPrice, size, color,
    inStock, isBackOrder, minRating, ids, rawFilter,
  });

  let query = Item.find(filter).sort(sort).lean();
  if (selectFields) query = query.select(selectFields);
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  return query;
}

export async function findItemsByCategory(categoryId, options = {}) {
  return findItems({ ...options, categoryIds: [categoryId] });
}

export async function findItemsByTag(tagId, options = {}) {
  return findItems({ ...options, tagIds: [tagId] });
}

export async function findItemsByStatus(status, options = {}) {
  return findItems({ ...options, status });
}

export async function findPublishedItems(options = {}) {
  return findItems({ ...options, statuses: ["published", "actioned", "featured"] });
}

export async function findItemsOnAction(options = {}) {
  return findItems({ ...options, isOnAction: true, statuses: ["published", "actioned"] });
}

export async function findItemsInStock(options = {}) {
  return findItems({ ...options, inStock: true });
}

export async function findItemById(id, populateFields = null, selectFields = null, session = null) {
  let query = Item.findById(id).lean();
  if (selectFields) query = query.select(selectFields);
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findItemBySku(sku, session = null) {
  let query = Item.findOne({ sku: sku.toLowerCase().trim() }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findItemBySlug(slug, populateFields = null, session = null) {
  if (!slug) return null;
  let query = Item.findOne({ slug: slug.toLowerCase().trim() }).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findItemDocument(id, session = null) {
  let query = Item.findById(id);
  if (session) query = query.session(session);
  return query;
}

export async function findItemsByWishlist(userId, options = {}) {
  return findItems({ ...options, rawFilter: { "wishlist.userId": userId } });
}

// ============================================================
//  CREATE / UPDATE / DELETE
// ============================================================

export async function createItem(data, session = null) {
  const item = new Item(data);
  return item.save({ session });
}

export async function updateItemById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Item.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function updateMany(filter, updateData, session = null) {
  const opts = session ? { session } : {};
  return Item.updateMany(filter, updateData, opts);
}

export async function deleteItemById(id, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndDelete(id, opts).lean();
}

// ============================================================
//  ⭐ SEO – izmenjena funkcija (sa sanitizacijom)
// ============================================================

export async function updateItemSeo(id, seoData, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;

  // Dozvoljena polja za SEO
  const allowedFields = ['description', 'shortDescription', 'keyWords', 'faq'];
  const update = {};

  for (const field of allowedFields) {
    if (seoData[field] !== undefined) {
      // Ako je faq, osiguraj da je niz (ako nije, pretvori ga)
      if (field === 'faq') {
        let faq = seoData[field];
        // Ako je objekat, uzmi vrednosti (indeksi)
        if (typeof faq === 'object' && faq !== null && !Array.isArray(faq)) {
          faq = Object.values(faq);
        }
        // Ako nije niz, postavi prazan niz
        if (!Array.isArray(faq)) {
          faq = [];
        }
        // Filtriraj samo validne stavke (moraju imati question i answer)
        faq = faq.filter(item =>
          item &&
          typeof item === 'object' &&
          item.question &&
          item.question.trim() !== '' &&
          item.answer &&
          item.answer.trim() !== ''
        );
        // Normalizuj svaku stavku
        update.faq = faq.map(item => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
          icon: item.icon ? item.icon.trim() : '',
        }));
      } else if (field === 'keyWords') {
        // Ako keyWords nije niz, pretvori ga u niz (ako je string, podeli po zarezu)
        let keywords = seoData[field];
        if (typeof keywords === 'string') {
          keywords = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
        }
        if (!Array.isArray(keywords)) {
          keywords = [];
        }
        update.keyWords = keywords;
      } else {
        // description i shortDescription – samo trim
        update[field] = typeof seoData[field] === 'string' ? seoData[field].trim() : seoData[field];
      }
    }
  }

  // Ako nema ništa za ažuriranje, vrati dokument bez promene
  if (Object.keys(update).length === 0) {
    return Item.findById(id).lean().session(session || null);
  }

  return Item.findByIdAndUpdate(id, { $set: update }, opts).lean();
}

// ============================================================
//  VARIJACIJE
// ============================================================

export async function addVariation(itemId, variation, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(itemId, { $push: { variations: variation } }, { new: true, ...opts }).lean();
}

export async function updateVariation(itemId, variationId, data, session = null) {
  const opts = session ? { session } : {};
  const updateData = {};
  for (const [key, value] of Object.entries(data)) {
    updateData[`variations.$.${key}`] = value;
  }
  return Item.findOneAndUpdate(
    { _id: itemId, "variations._id": variationId },
    { $set: updateData },
    { new: true, ...opts }
  ).lean();
}

export async function removeVariation(itemId, variationId, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(itemId, { $pull: { variations: { _id: variationId } } }, { new: true, ...opts }).lean();
}

export async function updateVariationAmount(itemId, variationId, amount, session = null) {
  const opts = session ? { session } : {};
  return Item.findOneAndUpdate(
    { _id: itemId, "variations._id": variationId },
    { $set: { "variations.$.amount": amount } },
    { new: true, ...opts }
  ).lean();
}

// ============================================================
//  PARTNERI
// ============================================================

export async function addPartner(itemId, partnerData, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(itemId, { $push: { partners: partnerData } }, { new: true, ...opts }).lean();
}

export async function removePartner(itemId, partnerId, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(itemId, { $pull: { partners: { partnerId } } }, { new: true, ...opts }).lean();
}

// ============================================================
//  WISHLIST
// ============================================================

export async function addToWishlist(itemId, userId, session = null) {
  const opts = session ? { session } : {};
  const alreadyExists = await Item.findOne({ _id: itemId, "wishlist.userId": userId }).session(session || null);
  if (alreadyExists) return Item.findById(itemId).lean().session(session || null);

  return Item.findByIdAndUpdate(
    itemId,
    { $push: { wishlist: { userId, date: new Date() } } },
    { new: true, ...opts }
  ).lean();
}

export async function removeFromWishlist(itemId, userId, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(
    itemId,
    { $pull: { wishlist: { userId } } },
    { new: true, ...opts }
  ).lean();
}

export async function isInWishlist(itemId, userId, session = null) {
  const item = await Item.findOne(
    { _id: itemId, "wishlist.userId": userId },
    { _id: 1 }
  ).lean().session(session || null);
  return !!item;
}

// ============================================================
//  BACKORDER
// ============================================================

export async function addBackOrder(itemId, orderData, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(itemId, { $push: { "backOrder.orders": orderData } }, { new: true, ...opts }).lean();
}

// ============================================================
//  STATISTIKA
// ============================================================

export async function incrementSoldCount(itemId, count = 1, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(itemId, { $inc: { soldCount: count } }, opts).lean();
}

export async function incrementReturnedCount(itemId, count = 1, session = null) {
  const opts = session ? { session } : {};
  return Item.findByIdAndUpdate(itemId, { $inc: { returnedCount: count } }, opts).lean();
}

// ============================================================
//  RATING
// ============================================================

export async function addOrUpdateRating(itemId, userId, stars, review = "", session = null) {
  const opts = session ? { session } : {};
  const item = await Item.findById(itemId, null, opts);
  if (!item) return null;

  const existingIndex = item.rating.ratings.findIndex(
    (r) => r.userId.toString() === userId.toString()
  );

  if (existingIndex > -1) {
    item.rating.ratings[existingIndex].stars = stars;
    if (review !== undefined) item.rating.ratings[existingIndex].review = review;
  } else {
    item.rating.ratings.push({ userId, stars, review });
  }

  const totalStars = item.rating.ratings.reduce((sum, r) => sum + r.stars, 0);
  item.rating.count = item.rating.ratings.length;
  item.rating.average = item.rating.count > 0
    ? Math.round((totalStars / item.rating.count) * 10) / 10
    : 0;

  await item.save(opts);
  return item;
}

export async function removeRating(itemId, userId, session = null) {
  const opts = session ? { session } : {};
  const item = await Item.findById(itemId, null, opts);
  if (!item) return null;

  const beforeCount = item.rating.ratings.length;
  item.rating.ratings = item.rating.ratings.filter(
    (r) => r.userId.toString() !== userId.toString()
  );

  if (item.rating.ratings.length === beforeCount) return item;

  const totalStars = item.rating.ratings.reduce((sum, r) => sum + r.stars, 0);
  item.rating.count = item.rating.ratings.length;
  item.rating.average = item.rating.count > 0
    ? Math.round((totalStars / item.rating.count) * 10) / 10
    : 0;

  await item.save(opts);
  return item;
}

export async function getUserRating(itemId, userId, session = null) {
  const item = await Item.findById(itemId, { "rating.ratings": 1 }).lean().session(session || null);
  if (!item) return null;
  return item.rating.ratings.find((r) => r.userId.toString() === userId.toString()) || null;
}

// ============================================================
//  BRISANJE REFERENCI
// ============================================================

export async function removeReferencesFromOtherItems(itemId, session = null) {
  const opts = session ? { session } : {};
  await Item.updateMany({ upSellItems: itemId }, { $pull: { upSellItems: itemId } }, opts);
  await Item.updateMany({ crossSellItems: itemId }, { $pull: { crossSellItems: itemId } }, opts);
}

export async function removeFromAllCarts(itemId, session = null) {
  const opts = session ? { session } : {};
  await User.updateMany({ "cart.itemId": itemId }, { $pull: { cart: { itemId } } }, opts);
}

export async function removeFromAllPartnerOffers(itemId, session = null) {
  const opts = session ? { session } : {};
  await User.updateMany({ "partner.affiliateOffers.itemId": itemId }, { $pull: { "partner.affiliateOffers": { itemId } } }, opts);
}

export async function removeAllReferences(itemId, session = null) {
  await removeReferencesFromOtherItems(itemId, session);
  await removeFromAllCarts(itemId, session);
  await removeFromAllPartnerOffers(itemId, session);
}

// ============================================================
//  BROJANJE
// ============================================================

export async function countItems(filter = {}) {
  return Item.countDocuments(filter);
}

export async function countItemsByStatus() {
  const result = await Item.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const counts = {};
  for (const row of result) counts[row._id] = row.count;
  return counts;
}

export async function countItemsByCategory() {
  return Item.aggregate([
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
}

export async function getTotalStock() {
  const result = await Item.aggregate([
    { $unwind: "$variations" },
    { $group: { _id: null, total: { $sum: "$variations.amount" } } },
  ]);
  return result[0]?.total || 0;
}

export async function getTotalSold() {
  const result = await Item.aggregate([{ $group: { _id: null, total: { $sum: "$soldCount" } } }]);
  return result[0]?.total || 0;
}

// ============================================================
//  DEFAULT EXPORT
// ============================================================

export default {
  findItems, findAllItems, findItemsByCategory, findItemsByTag,
  findItemsByStatus, findPublishedItems, findItemsOnAction, findItemsInStock,
  findItemById, findItemBySku, findItemBySlug, findItemDocument,
  findItemsByWishlist,
  addVariation, updateVariation, removeVariation, updateVariationAmount,
  createItem, updateItemById, updateMany, deleteItemById, updateItemSeo,
  addPartner, removePartner,
  addToWishlist, removeFromWishlist, isInWishlist,
  addBackOrder,
  incrementSoldCount, incrementReturnedCount,
  addOrUpdateRating, removeRating, getUserRating,
  removeReferencesFromOtherItems, removeFromAllCarts, removeFromAllPartnerOffers, removeAllReferences,
  countItems, countItemsByStatus, countItemsByCategory, getTotalStock, getTotalSold,
};