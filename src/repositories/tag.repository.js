import Tag from "../models/tag.model.js";
import { buildTagFilter } from "./filters/tag.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findTags({
  search,
  domain,
  type,
  types,
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

  const filter = buildTagFilter({
    search,
    domain,
    type,
    types,
    isIndexable,
    isActive,
    ids,
  });

  let query = Tag.find(filter)
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
    ? Tag.countDocuments(filter).session(session)
    : Tag.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllTags({
  search,
  domain,
  type,
  types,
  isIndexable,
  isActive,
  ids,
  sort = { "meta.priority": -1, name: 1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildTagFilter({
    search,
    domain,
    type,
    types,
    isIndexable,
    isActive,
    ids,
  });

  let query = Tag.find(filter)
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

export async function findTagsByDomain(domain, options = {}) {
  return findTags({ ...options, domain });
}

export async function findAllTagsByDomain(domain, options = {}) {
  return findAllTags({ ...options, domain });
}

export async function findTagsByType(type, options = {}) {
  return findTags({ ...options, type });
}

export async function findAllTagsByType(type, options = {}) {
  return findAllTags({ ...options, type });
}

export async function findTagsByDomainAndType(domain, type, options = {}) {
  return findTags({ ...options, domain, type });
}

export async function findAllTagsByDomainAndType(domain, type, options = {}) {
  return findAllTags({ ...options, domain, type });
}

export async function findTagsGroupedByType(domain, options = {}) {
  const tags = await findAllTagsByDomain(domain, {
    ...options,
    isActive: true,
    sort: { "meta.priority": -1, name: 1 },
  });

  const grouped = {};

  for (const tag of tags) {
    if (!grouped[tag.type]) {
      grouped[tag.type] = [];
    }
    grouped[tag.type].push(tag);
  }

  return grouped;
}

export async function findTagById(id, populateFields = null, session = null) {
  let query = Tag.findById(id).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findTagBySlugDomainAndType(slug, domain, type, populateFields = null, session = null) {
  if (!slug || !domain || !type) return null;

  let query = Tag.findOne({
    slug: slug.toLowerCase().trim(),
    domain,
    type,
  }).lean();

  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function createTag(data, session = null) {
  const tag = new Tag(data);
  return tag.save({ session });
}

export async function updateTagById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;

  return Tag.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function deleteTagById(id, session = null) {
  const opts = session ? { session } : {};
  return Tag.findByIdAndDelete(id, opts).lean();
}

export async function countTags(filter = {}) {
  return Tag.countDocuments(filter);
}

export async function countTagsByDomain() {
  const result = await Tag.aggregate([
    { $group: { _id: "$domain", count: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const row of result) {
    counts[row._id] = row.count;
  }
  return counts;
}

export async function countTagsByType() {
  const result = await Tag.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const row of result) {
    counts[row._id] = row.count;
  }
  return counts;
}

export async function countTagsByStatus() {
  const result = await Tag.aggregate([
    { $group: { _id: "$meta.isActive", count: { $sum: 1 } } },
  ]);

  return {
    active: result.find((r) => r._id === true)?.count || 0,
    inactive: result.find((r) => r._id === false)?.count || 0,
  };
}

export default {
  findTags,
  findAllTags,
  findTagsByDomain,
  findAllTagsByDomain,
  findTagsByType,
  findAllTagsByType,
  findTagsByDomainAndType,
  findAllTagsByDomainAndType,
  findTagsGroupedByType,
  findTagById,
  findTagBySlugDomainAndType,
  createTag,
  updateTagById,
  deleteTagById,
  countTags,
  countTagsByDomain,
  countTagsByType,
  countTagsByStatus,
};