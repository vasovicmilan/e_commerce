import * as blogService from "../../../services/blog.service.js";
import {
  prepareBlogHomeData,
  prepareBlogPostData,
  prepareBlogCategoryData,
  prepareBlogTagData,
  prepareBlogSearchData,
} from "../../../presenters/blog/blog.presenter.js";
import { logError, logInfo } from "../../../utils/logger.util.js";   // ← dodato

export async function blogHome(req, res, next) {
  try {
    const { page = 1 } = req.query;

    const data = await blogService.getBlogLandingData({
      page: parseInt(page, 10) || 1,
    });

    const viewData = prepareBlogHomeData(data);

    return res.render("blog/index", {
      pageTitle: data.seo.pageTitle,
      pageDescription: data.seo.pageDescription,
      data: viewData,
    });
  } catch (error) {
    logError(`[blogHome] Greška pri učitavanju blog početne strane`, error, {
      page: req.query.page,
    });
    next(error);
  }
}

export async function blogPost(req, res, next) {
  try {
    const { slug } = req.params;

    const data = await blogService.getBlogPost(slug);
    const viewData = prepareBlogPostData(data);

    return res.render("blog/post", {
      pageTitle: data.seo?.pageTitle || data.post.naziv,
      pageDescription: data.seo?.pageDescription || data.post.kratakOpis,
      data: viewData,
    });
  } catch (error) {
    logError(`[blogPost] Greška pri učitavanju blog posta`, error, {
      slug: req.params.slug,
    });
    next(error);
  }
}

export async function blogCategory(req, res, next) {
  try {
    const { slug } = req.params;
    const { page = 1 } = req.query;

    const data = await blogService.getPostsByCategory(slug, {
      page: parseInt(page, 10) || 1,
    });

    const viewData = prepareBlogCategoryData(data);

    return res.render("blog/listing", {
      pageTitle: data.seo?.pageTitle || data.category?.name,
      pageDescription: data.seo?.pageDescription || "",
      data: viewData,
    });
  } catch (error) {
    logError(`[blogCategory] Greška pri učitavanju blog kategorije`, error, {
      slug: req.params.slug,
      page: req.query.page,
    });
    next(error);
  }
}

export async function blogTag(req, res, next) {
  try {
    const { slug, type } = req.params;
    const { page = 1 } = req.query;

    const data = await blogService.getPostsByTag(slug, type, {
      page: parseInt(page, 10) || 1,
    });

    const viewData = prepareBlogTagData(data);

    return res.render("blog/listing", {
      pageTitle: data.seo?.pageTitle || data.tag?.name,
      pageDescription: data.seo?.pageDescription || "",
      data: viewData,
    });
  } catch (error) {
    logError(`[blogTag] Greška pri učitavanju blog tagova`, error, {
      slug: req.params.slug,
      type: req.params.type,
      page: req.query.page,
    });
    next(error);
  }
}

export async function blogSearch(req, res, next) {
  try {
    const { q, page = 1 } = req.query;

    if (!q || !q.trim()) {
      logInfo(`[blogSearch] Prazan upit za pretragu, preusmeravanje na /blog`, {
        ip: req.ip,
      });
      return res.redirect("/blog");
    }

    const data = await blogService.searchBlogPosts(q, {
      page: parseInt(page, 10) || 1,
    });

    const viewData = prepareBlogSearchData(data);

    logInfo(`[blogSearch] Pretraga bloga: "${q}" - pronađeno ${data.total || 0} rezultata`, {
      query: q,
      page: page,
      totalResults: data.total || 0,
      ip: req.ip,
    });

    return res.render("blog/search", {
      pageTitle: `Pretraga: ${q} | Blog`,
      pageDescription: `Rezultati pretrage za "${q}" na blogu.`,
      data: viewData,
    });
  } catch (error) {
    logError(`[blogSearch] Greška pri pretrazi bloga`, error, {
      query: req.query.q,
      page: req.query.page,
    });
    next(error);
  }
}

export default {
  blogHome,
  blogPost,
  blogCategory,
  blogTag,
  blogSearch,
};