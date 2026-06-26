import mongoose from "mongoose";
import * as tagRepo from "../repositories/tag.repository.js";
import * as itemService from "./item.service.js";
import * as categoryService from "./category.service.js";
import * as postService from "./post.service.js";
import {
  mapTagsForAdminList,
  mapTagForAdminDetail,
  mapTagsForSelect,
  mapTagsForPublic,
  mapTagForPublic,
  mapTagsGroupedForPublic,
} from "../mappers/tag.mapper.js";
import { validationError, notFound, conflict } from "../utils/error.util.js";
import { buildSeo } from "../seo/index.js";
import { mapTagToSeoContract } from "../seo/contracts/tag.contract.js";
import { slugify } from "../utils/helpers.util.js";

export async function listTags({
  search,
  domain,
  type,
  isIndexable,
  isActive,
  limit = 10,
  page = 1,
} = {}) {
  const result = await tagRepo.findTags({
    search,
    domain,
    type,
    isIndexable,
    isActive,
    limit,
    page,
    sort: { name: 1 },
  });

  return {
    data: mapTagsForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getTagById(tagId) {
  if (!tagId) validationError("tagId");

  const tag = await tagRepo.findTagById(tagId);
  if (!tag) notFound("Tag");

  return mapTagForAdminDetail(tag);
}

export async function getTagBySlug(slug, domain, type) {
  if (!slug) validationError("slug");
  if (!domain) validationError("domain");
  if (!type) validationError("type");

  const tag = await tagRepo.findTagBySlugDomainAndType(slug, domain, type);
  if (!tag) notFound("Tag");

  return mapTagForAdminDetail(tag);
}

export async function getAllTagsForSelect(domain, type = null) {
  if (!domain) validationError("domain");

  const options = type ? { type } : {};
  const tags = await tagRepo.findAllTagsByDomain(domain, options);
  return mapTagsForSelect(tags);
}

export async function getPublicTags(domain) {
  const tags = await tagRepo.findAllTagsByDomain(domain, {
    isActive: true,
    isIndexable: true,
  });
  return mapTagsForPublic(tags);
}

export async function getPublicTagsGrouped(domain) {
  const grouped = await tagRepo.findTagsGroupedByType(domain);
  return mapTagsGroupedForPublic(Object.values(grouped).flat());
}

export async function getPublicTagsByType(domain, type) {
  if (!type) validationError("type");

  const tags = await tagRepo.findAllTagsByDomainAndType(domain, type, {
    isActive: true,
    isIndexable: true,
  });
  return mapTagsForPublic(tags);
}

export async function getPublicTagsByCategory(categorySlug) {
  if (!categorySlug) validationError("categorySlug");

  const category = await categoryService.getCategoryDocumentBySlug(categorySlug, "item");
  if (!category) return [];

  const items = await itemService.getItemsByCategoryIdRaw(category._id, {
    statuses: ["published", "actioned", "featured"],
    selectFields: "tags",
  });

  const tagIds = [...new Set((items || []).flatMap(item => (item.tags || []).map(t => t.toString())))].filter(Boolean);

  if (!tagIds.length) return [];

  const tags = await tagRepo.findAllTags({
    ids: tagIds,
    isActive: true,
    isIndexable: true,
  });

  return mapTagsForPublic(tags);
}

// 🔥 NOVA, ISPRAVLJENA FUNKCIJA: direktno grupiše sirove tagove
export async function getPublicTagsGroupedByCategory(categorySlug) {
  if (!categorySlug) validationError("categorySlug");

  const category = await categoryService.getCategoryDocumentBySlug(categorySlug, "item");
  if (!category) return {};

  const items = await itemService.getItemsByCategoryIdRaw(category._id, {
    statuses: ["published", "actioned", "featured"],
    selectFields: "tags",
  });

  const tagIds = [...new Set((items || []).flatMap(item => (item.tags || []).map(t => t.toString())))].filter(Boolean);
  if (!tagIds.length) return {};

  const tags = await tagRepo.findAllTags({
    ids: tagIds,
    isActive: true,
    isIndexable: true,
  });

  // Grupiši sirove tagove po tipu, pa ih tek onda mapiraj
  const grouped = {};
  for (const tag of tags) {
    if (!tag || !tag._id) continue;
    const mapped = mapTagForPublic(tag);
    if (!mapped) continue;
    const type = tag.type || "custom";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(mapped);
  }
  return grouped;
}

export async function getPublicTagBySlug(slug, domain, type) {
  if (!slug) validationError("slug");
  if (!domain) validationError("domain");
  if (!type) validationError("type");

  const tag = await tagRepo.findTagBySlugDomainAndType(slug, domain, type);
  if (!tag) notFound("Tag");

  const mappedTag = mapTagForPublic(tag);
  const seoContract = mapTagToSeoContract(tag);
  const seo = buildSeo("tag", seoContract);

  return { tag: mappedTag, seo };
}

export async function createTag(data) {
  if (!data) validationError("data");
  if (!data.name) validationError("name");
  if (!data.domain) validationError("domain");
  if (!data.type) validationError("type");

  let slug = data.slug;
  if (!slug || slug.trim() === '') {
    slug = slugify(data.name);
  }

  const tagData = {
    ...data,
    slug,
  };

  try {
    const created = await tagRepo.createTag(tagData);
    const tagObject = created.toObject ? created.toObject() : created;
    return mapTagForAdminDetail(tagObject);
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "slug";
      conflict(`Tag sa ovim ${field} već postoji`);
    }
    throw error;
  }
}

export async function updateTag(tagId, data) {
  if (!tagId) validationError("tagId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  const updateData = { ...data };
  if (updateData.slug && updateData.slug.trim() === '') {
    delete updateData.slug;
  }

  const updated = await tagRepo.updateTagById(tagId, updateData);
  if (!updated) notFound("Tag");

  return mapTagForAdminDetail(updated);
}

export async function deleteTag(tagId) {
  if (!tagId) validationError("tagId");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const tag = await tagRepo.findTagById(tagId, null, session);
    if (!tag) {
      await session.abortTransaction();
      notFound("Tag");
    }

    const deleted = await tagRepo.deleteTagById(tagId, session);
    if (!deleted) {
      await session.abortTransaction();
      notFound("Tag");
    }

    if (tag.domain === "item") {
      await itemService.removeTagFromItems(tagId, session);
    }

    if (tag.domain === "post") {
      await postService.removeTagFromPosts(tagId, session);
    }

    await session.commitTransaction();

    return { deleted: true, id: tagId };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getTagStats() {
  const [total, byDomain, byType, byStatus] = await Promise.all([
    tagRepo.countTags(),
    tagRepo.countTagsByDomain(),
    tagRepo.countTagsByType(),
    tagRepo.countTagsByStatus(),
  ]);

  return { total, byDomain, byType, byStatus };
}

export async function getTagDocumentBySlug(slug, domain, type) {
  if (!slug) validationError("slug");
  if (!domain) validationError("domain");
  if (!type) validationError("type");
  const tag = await tagRepo.findTagBySlugDomainAndType(slug, domain, type);
  if (!tag) notFound("Tag");
  return tag;
}

export default {
  listTags,
  getTagById,
  getTagBySlug,
  getAllTagsForSelect,
  getPublicTags,
  getPublicTagsGrouped,
  getPublicTagsByType,
  getPublicTagsByCategory,
  getPublicTagsGroupedByCategory,
  getPublicTagBySlug,
  createTag,
  updateTag,
  deleteTag,
  getTagStats,
  getTagDocumentBySlug,
};