import * as postService from "./post.service.js";
import * as categoryService from "./category.service.js";
import * as tagService from "./tag.service.js";
import { buildPageSeo } from "../seo/index.js";

export async function getBlogLandingData({
  featuredLimit = 4,
  publishedLimit = 12,
  page = 1,
} = {}) {
  const [featured, published, categories, tags] = await Promise.all([
    postService.findFeaturedPosts({ limit: featuredLimit, page: 1 }),
    postService.findPublishedPosts({ limit: publishedLimit, page }),
    categoryService.getPublicCategories("post"),
    tagService.getPublicTags("post"),
  ]);

  const seo = buildPageSeo({
    title: "Blog | TopHelanke",
    description: "Najnoviji članci, saveti i novosti iz sveta mode, helanki i fitnessa.",
    canonical: "/blog",
    isIndexable: true,
    type: "website",
  });

  return {
    featured: featured.data || [],
    posts: published.data || [],
    pagination: {
      total: published.total,
      page: published.page,
      limit: published.limit,
      totalPages: published.totalPages,
    },
    categories: categories || [],
    tags: tags || [],
    seo,
  };
}

export async function getBlogPost(slug) {
  const result = await postService.getPublicPostBySlug(slug);
  const categories = await categoryService.getPublicCategories("post");
  const tags = await tagService.getPublicTags("post");

  return { ...result, categories, tags };
}

export async function getPostsByCategory(slug, { limit = 12, page = 1 } = {}) {
  const [result, categories] = await Promise.all([
    postService.findPostsByCategorySlug(slug, { limit, page }),
    categoryService.getPublicCategories("post"),
  ]);

  const tags = await tagService.getPublicTags("post");

  return { ...result, categories, tags };
}

export async function getPostsByTag(slug, type, { limit = 12, page = 1 } = {}) {
  const [result, categories] = await Promise.all([
    postService.findPostsByTagSlug(slug, { limit, page }),
    categoryService.getPublicCategories("post"),
  ]);

  const tags = await tagService.getPublicTags("post");

  return { ...result, categories, tags };
}

export async function searchBlogPosts(search, { limit = 12, page = 1 } = {}) {
  const result = await postService.searchPosts(search, { limit, page });
  const categories = await categoryService.getPublicCategories("post");

  const seo = buildPageSeo({
    title: `Pretraga: ${search} | Blog | TopHelanke`,
    description: `Rezultati pretrage za "${search}" na blogu.`,
    canonical: "/blog/pretraga",
    isIndexable: false,
  });

  return { ...result, categories, seo };
}

export default {
  getBlogLandingData,
  getBlogPost,
  getPostsByCategory,
  getPostsByTag,
  searchBlogPosts,
};