import Post from "../models/post.model.js";
import { buildPostFilter } from "./filters/post.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findPosts({
  search,
  slug,
  status,
  statuses,
  authorId,
  categoryIds,
  tagIds,
  isFeatured,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  selectFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildPostFilter({
    search,
    slug,
    status,
    statuses,
    authorId,
    categoryIds,
    tagIds,
    isFeatured,
    ids,
  });

  let query = Post.find(filter);

  if (filter.$text) {
    query = query.select({ score: { $meta: "textScore" } });
    query = query.sort({ score: { $meta: "textScore" } });
  } else {
    query = query.sort(sort);
  }

  query = query.skip(skip).limit(limit).lean();

  if (selectFields) {
    query = query.select(selectFields);
  }

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  const countQuery = session
    ? Post.countDocuments(filter).session(session)
    : Post.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllPosts({
  search,
  status,
  statuses,
  authorId,
  categoryIds,
  tagIds,
  ids,
  sort = { createdAt: -1 },
  populateFields = null,
  selectFields = null,
  session = null,
} = {}) {
  const filter = buildPostFilter({
    search,
    status,
    statuses,
    authorId,
    categoryIds,
    tagIds,
    ids,
  });

  let query = Post.find(filter);

  if (filter.$text) {
    query = query.select({ score: { $meta: "textScore" } });
    query = query.sort({ score: { $meta: "textScore" } });
  } else {
    query = query.sort(sort);
  }

  query = query.lean();

  if (selectFields) {
    query = query.select(selectFields);
  }

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  return query;
}

export async function findPublishedPosts(options = {}) {
  return findPosts({
    ...options,
    statuses: ["published", "featured"],
  });
}

export async function findPostsByCategory(categoryId, options = {}) {
  return findPosts({ ...options, categoryIds: [categoryId] });
}

export async function findPostsByTag(tagId, options = {}) {
  return findPosts({ ...options, tagIds: [tagId] });
}

export async function findPostsByAuthor(authorId, options = {}) {
  return findPosts({ ...options, authorId });
}

export async function findPostById(id, populateFields = null, selectFields = null, session = null) {
  let query = Post.findById(id).lean();
  if (selectFields) query = query.select(selectFields);
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findPostBySlug(slug, populateFields = null, session = null) {
  if (!slug) return null;

  let query = Post.findOne({
    slug: slug.toLowerCase().trim(),
  }).lean();

  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function createPost(data, session = null) {
  const post = new Post(data);
  return post.save({ session });
}

export async function updatePostBasic(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Post.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function updatePostContent(id, content, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Post.findByIdAndUpdate(
    id,
    { $set: { content } },
    opts
  ).lean();
}

export async function updatePostSeo(id, seoData, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Post.findByIdAndUpdate(id, { $set: seoData }, opts).lean();
}

export async function updatePostStatus(id, status, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Post.findByIdAndUpdate(id, { $set: { status } }, opts).lean();
}

export async function deletePostById(id, session = null) {
  const opts = session ? { session } : {};
  return Post.findByIdAndDelete(id, opts).lean();
}

export async function countPosts(filter = {}) {
  return Post.countDocuments(filter);
}

export async function countPostsByStatus() {
  const result = await Post.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const row of result) {
    counts[row._id] = row.count;
  }
  return counts;
}

export async function countPostsByCategory() {
  const result = await Post.aggregate([
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return result;
}

export default {
  findPosts,
  findAllPosts,
  findPublishedPosts,
  findPostsByCategory,
  findPostsByTag,
  findPostsByAuthor,
  findPostById,
  findPostBySlug,
  createPost,
  updatePostBasic,
  updatePostContent,
  updatePostSeo,
  updatePostStatus,
  deletePostById,
  countPosts,
  countPostsByStatus,
  countPostsByCategory,
};