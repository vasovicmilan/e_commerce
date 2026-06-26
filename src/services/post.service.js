import mongoose from "mongoose";
import * as postRepo from "../repositories/post.repository.js";
import * as categoryRepo from "../repositories/category.repository.js";
import * as tagRepo from "../repositories/tag.repository.js";
import { slugify } from "../utils/helpers.util.js";
import {
  mapPostsForAdminList,
  mapPostForAdminDetail,
  mapPostForEdit,
  mapPostsForCards,
  mapPostForPublic,
} from "../mappers/post.mapper.js";
import {
  validationError,
  notFound,
  conflict,
  badRequest,
} from "../utils/error.util.js";
import { buildSeo } from "../seo/index.js";
import { mapPostToSeoContract } from "../seo/contracts/post.contract.js";
import { mapCategoryToSeoContract } from "../seo/contracts/category.contract.js";
import { mapTagToSeoContract } from "../seo/contracts/tag.contract.js";

// ============================================================
//  VALIDACIJA
// ============================================================

function validateBasicData(data) {
  if (!data) validationError("data");
  if (!data.title) validationError("title");
  if (!data.featureImage?.img) validationError("featureImage");
  if (!data.author) validationError("author");
}

// ============================================================
//  ADMIN - READ
// ============================================================

export async function listPosts({
  search,
  status,
  authorId,
  categoryId,
  tagId,
  limit = 10,
  page = 1,
} = {}) {
  const result = await postRepo.findPosts({
    search,
    status,
    authorId,
    categoryIds: categoryId ? [categoryId] : undefined,
    tagIds: tagId ? [tagId] : undefined,
    limit,
    page,
    sort: { createdAt: -1 },
    populateFields: ["categories", "tags", "author"],
  });

  return {
    data: mapPostsForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getPostById(postId) {
  if (!postId) validationError("postId");

  const post = await postRepo.findPostById(postId, ["categories", "tags", "author"]);
  if (!post) notFound("Post");

  return mapPostForAdminDetail(post);
}

export async function getPostBySlug(slug) {
  if (!slug) validationError("slug");

  const post = await postRepo.findPostBySlug(slug, ["categories", "tags", "author"]);
  if (!post) notFound("Post");

  return mapPostForAdminDetail(post);
}

export async function getPostForEdit(postId) {
  if (!postId) validationError("postId");

  const post = await postRepo.findPostById(postId, ["categories", "tags"]);
  if (!post) notFound("Post");

  return mapPostForEdit(post);
}

// ============================================================
//  ADMIN - CREATE (Faza 1: Osnovno)
// ============================================================

export async function createPost(data) {
  validateBasicData(data);

  const slug = slugify(data.title);

  const postData = {
    title: data.title,
    slug,
    status: "not-published",
    author: data.author,
    featureImage: data.featureImage,
    categories: data.categories || [],
    tags: data.tags || [],
    content: [],
    description: "",
    shortDescription: "",
    keyWords: [],
    faq: [],
  };

  try {
    const created = await postRepo.createPost(postData);
    const postObject = created.toObject ? created.toObject() : created;
    return mapPostForAdminDetail(postObject);
  } catch (error) {
    if (error?.code === 11000) {
      conflict("Post sa ovim slug-om već postoji");
    }
    throw error;
  }
}

// ============================================================
//  ADMIN - UPDATE OSNOVNO (Faza 1)
// ============================================================

export async function updatePost(postId, data) {
  if (!postId) validationError("postId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  const updateData = { ...data };

  if (data.title) {
    updateData.slug = slugify(data.title);
  }

  const updated = await postRepo.updatePostBasic(postId, updateData);
  if (!updated) notFound("Post");

  return mapPostForAdminDetail(updated);
}

// ============================================================
//  ADMIN - FAZA 2: SADRŽAJ
// ============================================================

export async function updatePostContent(postId, content) {
  if (!postId) validationError("postId");
  if (!Array.isArray(content)) validationError("content");

  const updated = await postRepo.updatePostContent(postId, content);
  if (!updated) notFound("Post");

  return mapPostForAdminDetail(updated);
}

// ============================================================
//  ADMIN - FAZA 3: SEO
// ============================================================

export async function updatePostSeo(postId, seoData) {
  if (!postId) validationError("postId");
  if (!seoData || Object.keys(seoData).length === 0) validationError("seoData");

  const updated = await postRepo.updatePostSeo(postId, seoData);
  if (!updated) notFound("Post");

  return mapPostForAdminDetail(updated);
}

// ============================================================
//  ADMIN - STATUS
// ============================================================

export async function updatePostStatus(postId, status) {
  if (!postId) validationError("postId");
  if (!status) validationError("status");

  const updated = await postRepo.updatePostStatus(postId, status);
  if (!updated) notFound("Post");

  return mapPostForAdminDetail(updated);
}

// ============================================================
//  ADMIN - DELETE
// ============================================================

export async function deletePost(postId) {
  if (!postId) validationError("postId");

  const deleted = await postRepo.deletePostById(postId);
  if (!deleted) notFound("Post");

  return { deleted: true, id: postId };
}

// ============================================================
//  ADMIN - POMOĆNE FUNKCIJE ZA KATEGORIJE I TAGOVE (DODATO)
// ============================================================

export async function removeCategoryFromPosts(categoryId, session = null) {
  if (!categoryId) validationError("categoryId");

  const result = await postRepo.updateMany(
    { categories: categoryId },
    { $pull: { categories: categoryId } },
    session
  );

  return { modifiedCount: result?.modifiedCount || 0 };
}

export async function removeTagFromPosts(tagId, session = null) {
  if (!tagId) validationError("tagId");

  const result = await postRepo.updateMany(
    { tags: tagId },
    { $pull: { tags: tagId } },
    session
  );

  return { modifiedCount: result?.modifiedCount || 0 };
}

// ============================================================
//  PUBLIC - BLOG
// ============================================================

export async function findPublishedPosts({
  limit = 12,
  page = 1,
} = {}) {
  const result = await postRepo.findPublishedPosts({
    limit,
    page,
    populateFields: ["categories", "tags"],
  });

  return {
    data: mapPostsForCards(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function findPostsByCategorySlug(categorySlug, { limit = 12, page = 1 } = {}) {
  if (!categorySlug) validationError("categorySlug");

  const category = await categoryRepo.findCategoryBySlugAndDomain(categorySlug, "post");
  if (!category) notFound("Kategorija");

  const result = await postRepo.findPostsByCategory(category._id, {
    limit,
    page,
    populateFields: ["categories", "tags"],
    statuses: ["published", "featured"],
  });

  const seoContract = mapCategoryToSeoContract(category, "post");
  const seo = buildSeo("category", seoContract, result.data);

  return {
    category,
    data: mapPostsForCards(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    seo,
  };
}

export async function findPostsByTagSlug(tagSlug, { limit = 12, page = 1 } = {}) {
  if (!tagSlug) validationError("tagSlug");

  const tag = await tagRepo.findTagBySlugDomainAndType(tagSlug, "post", null);
  if (!tag) notFound("Tag");

  const result = await postRepo.findPostsByTag(tag._id, {
    limit,
    page,
    populateFields: ["tags"],
    statuses: ["published", "featured"],
  });

  const seoContract = mapTagToSeoContract(tag, "post");
  const seo = buildSeo("tag", seoContract, result.data);

  return {
    tag,
    data: mapPostsForCards(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    seo,
  };
}

export async function findFeaturedPosts({
  limit = 6,
  page = 1,
} = {}) {
  const result = await postRepo.findPosts({
    limit,
    page,
    status: "featured",
    populateFields: ["categories"],
  });

  return {
    data: mapPostsForCards(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function searchPosts(search, { limit = 12, page = 1 } = {}) {
  if (!search || !search.trim()) validationError("search");

  const result = await postRepo.findPosts({
    search,
    limit,
    page,
    statuses: ["published", "featured"],
    populateFields: ["categories"],
  });

  return {
    data: mapPostsForCards(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    search,
  };
}

export async function getPublicPostBySlug(slug) {
  if (!slug) validationError("slug");

  const post = await postRepo.findPostBySlug(slug, ["categories", "tags", "author"]);
  if (!post) notFound("Post");

  const mappedPost = mapPostForPublic(post);
  const seoContract = mapPostToSeoContract(post);
  const seo = buildSeo("post", seoContract);

  return { post: mappedPost, seo };
}

export async function getPostStats() {
  const [total, byStatus] = await Promise.all([
    postRepo.countPosts(),
    postRepo.countPostsByStatus(),
  ]);

  return {
    total,
    published: byStatus?.published || 0,
    featured: byStatus?.featured || 0,
    notPublished: byStatus?.["not-published"] || 0,
    byStatus,
  };
}

// ============================================================
//  DEFAULT EXPORT
// ============================================================

export default {
  // Admin read
  listPosts,
  getPostById,
  getPostBySlug,
  getPostForEdit,

  // Admin create/update
  createPost,
  updatePost,
  updatePostContent,
  updatePostSeo,
  updatePostStatus,

  // Admin delete
  deletePost,

  // Pomoćne funkcije
  removeCategoryFromPosts,
  removeTagFromPosts,

  // Public
  findPublishedPosts,
  findPostsByCategorySlug,
  findPostsByTagSlug,
  findFeaturedPosts,
  searchPosts,
  getPublicPostBySlug,
  getPostStats,
};