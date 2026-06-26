import Category from "../models/category.model.js";
import { buildCategoryFilter } from "./filters/category.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findCategories({
  search,
  domain,
  parent,
  isIndexable,
  isActive,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { "meta.priority": -1, name: 1 },
  populateFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildCategoryFilter({
    search,
    domain,
    parent,
    isIndexable,
    isActive,
    ids,
  });

  let query = Category.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  const countQuery = session
    ? Category.countDocuments(filter).session(session)
    : Category.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllCategories({
  search,
  domain,
  parent,
  isIndexable,
  isActive,
  ids,
  sort = { "meta.priority": -1, name: 1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildCategoryFilter({
    search,
    domain,
    parent,
    isIndexable,
    isActive,
    ids,
  });

  let query = Category.find(filter)
    .sort(sort)
    .lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  return query;
}

export async function findCategoriesByDomain(domain, options = {}) {
  return findCategories({ ...options, domain });
}

export async function findAllCategoriesByDomain(domain, options = {}) {
  return findAllCategories({ ...options, domain });
}

export async function findRootCategories({ domain, ...options } = {}) {
  return findCategories({ ...options, domain, parent: "root" });
}

export async function findAllRootCategories({ domain, ...options } = {}) {
  return findAllCategories({ ...options, domain, parent: "root" });
}

export async function findSubcategories(parentId, { domain, ...options } = {}) {
  return findCategories({ ...options, domain, parent: parentId });
}

export async function findAllSubcategories(parentId, { domain, ...options } = {}) {
  return findAllCategories({ ...options, domain, parent: parentId });
}

export async function findCategoryById(id, populateFields = null, session = null) {
  let query = Category.findById(id).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findCategoryBySlugAndDomain(slug, domain, populateFields = null, session = null) {
  if (!slug || !domain) return null;

  let query = Category.findOne({
    slug: slug.toLowerCase().trim(),
    domain,
  }).lean();

  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function createCategory(data, session = null) {
  const category = new Category(data);
  return category.save({ session });
}

export async function updateCategoryById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;

  return Category.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function deleteCategoryById(id, session = null) {
  const opts = session ? { session } : {};
  return Category.findByIdAndDelete(id, opts).lean();
}

export async function countCategories(filter = {}) {
  return Category.countDocuments(filter);
}

export async function countCategoriesByDomain() {
  const result = await Category.aggregate([
    { $group: { _id: "$domain", count: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const row of result) {
    counts[row._id] = row.count;
  }
  return counts;
}

export async function countCategoriesByStatus() {
  const result = await Category.aggregate([
    { $group: { _id: "$meta.isActive", count: { $sum: 1 } } },
  ]);

  return {
    active: result.find((r) => r._id === true)?.count || 0,
    inactive: result.find((r) => r._id === false)?.count || 0,
  };
}

export default {
  findCategories,
  findAllCategories,
  findCategoriesByDomain,
  findAllCategoriesByDomain,
  findRootCategories,
  findAllRootCategories,
  findSubcategories,
  findAllSubcategories,
  findCategoryById,
  findCategoryBySlugAndDomain,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  countCategories,
  countCategoriesByDomain,
  countCategoriesByStatus,
};