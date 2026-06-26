import mongoose from "mongoose";
import * as categoryRepo from "../repositories/category.repository.js";
import * as itemService from "./item.service.js";
import {
  mapCategoriesForAdminList,
  mapCategoryForAdminDetail,
  mapCategoriesForSelect,
  mapCategoriesForPublic,
  mapCategoryForPublic,
} from "../mappers/category.mapper.js";
import { validationError, notFound, conflict } from "../utils/error.util.js";
import { buildSeo } from "../seo/index.js";
import { mapCategoryToSeoContract } from "../seo/contracts/category.contract.js";
import { slugify } from "../utils/helpers.util.js"; // DODATO

export async function listCategories({
  search,
  domain,
  parent,
  isIndexable,
  isActive,
  limit = 10,
  page = 1,
} = {}) {
  const result = await categoryRepo.findCategories({
    search,
    domain,
    parent,
    isIndexable,
    isActive,
    limit,
    page,
    sort: { name: 1 },
  });

  return {
    data: mapCategoriesForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getCategoryById(categoryId) {
  if (!categoryId) validationError("categoryId");

  const category = await categoryRepo.findCategoryById(categoryId);
  if (!category) notFound("Kategorija");

  console.log("OVO je service:")
  console.log(category);
  return mapCategoryForAdminDetail(category);
}

export async function getCategoryBySlug(slug, domain) {
  if (!slug) validationError("slug");
  if (!domain) validationError("domain");

  const category = await categoryRepo.findCategoryBySlugAndDomain(slug, domain);
  if (!category) notFound("Kategorija");

  return mapCategoryForAdminDetail(category);
}

export async function getAllCategoriesForSelect(domain) {
  if (!domain) validationError("domain");

  const categories = await categoryRepo.findAllCategoriesByDomain(domain);
  return mapCategoriesForSelect(categories);
}

export async function getPublicCategories(domain) {
  const categories = await categoryRepo.findAllCategoriesByDomain(domain, {
    isActive: true,
    isIndexable: true,
  });
  return mapCategoriesForPublic(categories);
}

export async function getPublicRootCategories(domain) {
  const categories = await categoryRepo.findAllRootCategories({
    domain,
    isActive: true,
    isIndexable: true,
  });
  return mapCategoriesForPublic(categories);
}

export async function getPublicSubcategories(parentId, domain) {
  if (!parentId) validationError("parentId");

  const categories = await categoryRepo.findAllSubcategories(parentId, {
    domain,
    isActive: true,
    isIndexable: true,
  });
  return mapCategoriesForPublic(categories);
}

export async function getPublicCategoryBySlug(slug, domain) {
  if (!slug) validationError("slug");
  if (!domain) validationError("domain");

  const category = await categoryRepo.findCategoryBySlugAndDomain(slug, domain);
  if (!category) notFound("Kategorija");

  const mappedCategory = mapCategoryForPublic(category);
  const seoContract = mapCategoryToSeoContract(category);
  const seo = buildSeo("category", seoContract);

  return { category: mappedCategory, seo };
}

export async function createCategory(data) {
  if (!data) validationError("data");
  if (!data.name) validationError("name");
  if (!data.domain) validationError("domain");

  // Generiši slug ako nije prosleđen
  let slug = data.slug;
  if (!slug || slug.trim() === '') {
    slug = slugify(data.name);
  }

  const categoryData = {
    ...data,
    slug,
  };

  try {
    const created = await categoryRepo.createCategory(categoryData);
    const categoryObject = created.toObject ? created.toObject() : created;
    return mapCategoryForAdminDetail(categoryObject);
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "slug";
      conflict(`Kategorija sa ovim ${field} već postoji`);
    }
    throw error;
  }
}

export async function updateCategory(categoryId, data) {
  if (!categoryId) validationError("categoryId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  // Ako je slug prosleđen, koristi ga; inače ostavi stari
  // (ne diramo slug osim ako nije eksplicitno prosleđen)
  const updateData = { ...data };
  if (updateData.slug && updateData.slug.trim() === '') {
    delete updateData.slug; // ne dozvoli prazan slug
  }

  const updated = await categoryRepo.updateCategoryById(categoryId, updateData);
  if (!updated) notFound("Kategorija");

  return mapCategoryForAdminDetail(updated);
}

export async function deleteCategory(categoryId) {
  if (!categoryId) validationError("categoryId");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const category = await categoryRepo.findCategoryById(categoryId, null, session);
    if (!category) {
      await session.abortTransaction();
      notFound("Kategorija");
    }

    const deleted = await categoryRepo.deleteCategoryById(categoryId, session);
    if (!deleted) {
      await session.abortTransaction();
      notFound("Kategorija");
    }

    if (category.domain === "item") {
      await itemService.removeCategoryFromItems(categoryId, session);
    }

    if (category.domain === "post") {
      await postService.removeCategoryFromPosts(categoryId, session);
    }

    await session.commitTransaction();

    return { deleted: true, id: categoryId };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getCategoryStats() {
  const [total, byDomain, byStatus] = await Promise.all([
    categoryRepo.countCategories(),
    categoryRepo.countCategoriesByDomain(),
    categoryRepo.countCategoriesByStatus(),
  ]);

  return { total, byDomain, byStatus };
}

export async function getCategoryDocumentBySlug(slug, domain) {
  if (!slug) validationError("slug");
  if (!domain) validationError("domain");
  const category = await categoryRepo.findCategoryBySlugAndDomain(slug, domain);
  if (!category) notFound("Kategorija");
  return category;
}

export default {
  listCategories,
  getCategoryById,
  getCategoryBySlug,
  getAllCategoriesForSelect,
  getPublicCategories,
  getPublicRootCategories,
  getPublicSubcategories,
  getPublicCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  getCategoryDocumentBySlug,
};