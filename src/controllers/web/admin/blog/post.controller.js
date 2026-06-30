import * as postService from "../../../../services/post.service.js";
import * as categoryService from "../../../../services/category.service.js";
import * as tagService from "../../../../services/tag.service.js";
import {
  preparePostListData,
  preparePostDetailsData,
  preparePostFormData,
} from "../../../../presenters/admin/post.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";
import { flashAndRedirect } from "../../../../utils/flash.util.js";

export async function listPosts(req, res, next) {
  try {
    const { search, status, authorId, categoryId, page = 1, limit = 10 } = req.query;

    const result = await postService.listPosts({
      search: search || req.params.search,
      status: status || undefined,
      authorId: authorId || undefined,
      categoryId: categoryId || undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = preparePostListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Blog postovi",
      pageDescription: "Pregled svih blog postova",
      data: viewData,
    });
  } catch (error) {
    logError(`[listPosts] Greška pri učitavanju liste postova`, error, {
      search: req.query.search,
      status: req.query.status,
      authorId: req.query.authorId,
      categoryId: req.query.categoryId,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function postDetails(req, res, next) {
  try {
    const { postId } = req.params;

    const post = await postService.getPostById(postId);
    const viewData = preparePostDetailsData(post);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const categoriesResult = await categoryService.listCategories({ domain: 'post', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'post', limit: 1000, page: 1 });

      const formData = preparePostFormData(
        post,
        categoriesResult.data || [],
        tagsResult.data || []
      );

      return res.render("admin/_form", {
        pageTitle: `Izmena - ${post.osnovno.naziv}`,
        pageDescription: post.seo?.kratakOpis || post.osnovno.naziv,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Post - ${post.osnovno.naziv}`,
      pageDescription: post.seo?.kratakOpis || post.osnovno.naziv,
      data: viewData,
    });
  } catch (error) {
    logError(`[postDetails] Greška pri učitavanju detalja posta`, error, {
      postId: req.params.postId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function newPostForm(req, res, next) {
  try {
    const categoriesResult = await categoryService.listCategories({ domain: 'post', limit: 1000, page: 1 });
    const tagsResult = await tagService.listTags({ domain: 'post', limit: 1000, page: 1 });

    const formData = preparePostFormData(
      null,
      categoriesResult.data || [],
      tagsResult.data || []
    );

    return res.render("admin/_form", {
      pageTitle: "Novi blog post",
      pageDescription: "Kreiraj novi blog post - Faza 1: Osnovni podaci",
      data: { ...formData, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[newPostForm] Greška pri prikazu forme za novi post`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function createPost(req, res, next) {
  try {
    // 1. Validacija
    if (req.validationErrors) {
      logWarn(`[createPost] Validacione greške pri kreiranju posta`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
        body: req.body,
      });
      const categoriesResult = await categoryService.listCategories({ domain: 'post', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'post', limit: 1000, page: 1 });
      const formData = preparePostFormData(null, categoriesResult.data || [], tagsResult.data || []);

      return res.render("admin/_form", {
        pageTitle: "Novi blog post",
        pageDescription: "Kreiraj novi blog post - Faza 1",
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    // 2. Provera slike
    let imageName = null;
    if (req.uploadedFile && req.uploadedFile.img) {
      imageName = req.uploadedFile.img;
    } else if (req.file && req.file.filename) {
      imageName = req.file.filename;
    }

    if (!imageName) {
      const categoriesResult = await categoryService.listCategories({ domain: 'post', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'post', limit: 1000, page: 1 });
      const formData = preparePostFormData(null, categoriesResult.data || [], tagsResult.data || []);

      const errors = { postImage: "Istaknuta slika je obavezna" };

      logWarn(`[createPost] Nedostaje istaknuta slika`, {
        userId: req.session?.user?.id || req.session?.user?._id,
        body: req.body,
      });

      return res.render("admin/_form", {
        pageTitle: "Novi blog post",
        pageDescription: "Kreiraj novi blog post - Faza 1",
        data: { ...formData, errors, formData: req.body },
      });
    }

    // 3. Autor iz sesije
    const authorId = req.session?.user?.id || req.session?.user?._id;
    if (!authorId) {
      logError(`[createPost] Korisnik nije prijavljen`, null, {
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      throw new Error("Korisnik nije prijavljen");
    }

    // 4. featureImage objekat
    const featureImage = {
      img: imageName,
      imgDesc: req.body.featureImageDesc || '',
    };

    // 5. Pripremi podatke
    const categories = Array.isArray(req.body.categories)
      ? req.body.categories.filter(id => id && id.trim() !== '')
      : [];
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags.filter(id => id && id.trim() !== '')
      : [];

    const postData = {
      title: req.body.title,
      author: authorId,
      featureImage,
      categories,
      tags,
    };

    // 6. Kreiraj post
    const post = await postService.createPost(postData);

    logInfo(`[createPost] Blog post kreiran: "${post.osnovno.naziv}" (ID: ${post.id})`, {
      postId: post.id,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Blog post je uspešno kreiran. Dodajte sadržaj.",
      `/admin/blog/${post.id}/sadrzaj`
    );
  } catch (error) {
    logError(`[createPost] Greška pri kreiranju posta`, error, {
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 409) {
      const categoriesResult = await categoryService.listCategories({ domain: 'post', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'post', limit: 1000, page: 1 });
      const formData = preparePostFormData(null, categoriesResult.data || [], tagsResult.data || []);

      return res.render("admin/_form", {
        pageTitle: "Novi blog post",
        pageDescription: "Kreiraj novi blog post - Faza 1",
        data: { ...formData, errors: { general: error.message }, formData: req.body },
      });
    }
    next(error);
  }
}

export async function updatePost(req, res, next) {
  try {
    const { postId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updatePost] Validacione greške za postId=${postId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      const post = await postService.getPostById(postId);
      const categoriesResult = await categoryService.listCategories({ domain: 'post', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'post', limit: 1000, page: 1 });
      const formData = preparePostFormData(post, categoriesResult.data || [], tagsResult.data || []);

      return res.render("admin/_form", {
        pageTitle: `Izmena - ${post.osnovno.naziv}`,
        pageDescription: post.seo?.kratakOpis || "",
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const updateData = { ...req.body };

    let imageName = null;
    if (req.uploadedFile && req.uploadedFile.img) {
      imageName = req.uploadedFile.img;
    } else if (req.file && req.file.filename) {
      imageName = req.file.filename;
    }

    if (imageName) {
      updateData.featureImage = {
        img: imageName,
        imgDesc: req.body.featureImageDesc || updateData.featureImage?.imgDesc || '',
      };
    }

    if (updateData.categories !== undefined) {
      updateData.categories = Array.isArray(updateData.categories)
        ? updateData.categories.filter(id => id && id.trim() !== '')
        : [];
    }
    if (updateData.tags !== undefined) {
      updateData.tags = Array.isArray(updateData.tags)
        ? updateData.tags.filter(id => id && id.trim() !== '')
        : [];
    }

    delete updateData.author;

    await postService.updatePost(postId, updateData);

    logInfo(`[updatePost] Blog post #${postId} uspešno ažuriran`, {
      postId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Blog post je uspešno ažuriran",
      `/admin/blog/detalji/${postId}`
    );
  } catch (error) {
    logError(`[updatePost] Greška pri ažuriranju posta`, error, {
      postId: req.params.postId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
      return flashAndRedirect(
        req, res, "error", error.message,
        `/admin/blog/izmena/${req.params.postId}`
      );
    }
    next(error);
  }
}

export async function contentPage(req, res, next) {
  try {
    const { postId } = req.params;
    const post = await postService.getPostById(postId);

    return res.render("admin/posts/content", {
      pageTitle: `Sadržaj - ${post.osnovno.naziv}`,
      pageDescription: "Upravljanje sadržajem blog posta",
      data: {
        post,
        errors: {},
        formData: {},
      },
    });
  } catch (error) {
    logError(`[contentPage] Greška pri prikazu strane za sadržaj`, error, {
      postId: req.params.postId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updateContent(req, res, next) {
  try {
    const { postId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateContent] Validacione greške za postId=${postId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        `/admin/blog/${postId}/sadrzaj`
      );
    }

    // Prihvati content kao niz blokova
    let content = Array.isArray(req.body.content) ? req.body.content : [];

    // Parsiraj items i rows za svaki blok
    content = content.map(block => {
      if (block.items && typeof block.items === 'string') {
        block.items = block.items.split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      } else if (!block.items) {
        block.items = [];
      }

      if (block.rows && typeof block.rows === 'string') {
        block.rows = block.rows.split('\n')
          .map(row => row.split('\t')
            .map(cell => cell.trim())
            .filter(cell => cell !== '')
          )
          .filter(row => row.length > 0);
      } else if (!block.rows) {
        block.rows = [];
      }

      if (block.type === 'heading' && !block.level) {
        block.level = 2;
      }

      return block;
    });

    await postService.updatePostContent(postId, content);

    logInfo(`[updateContent] Sadržaj za post #${postId} uspešno ažuriran`, {
      postId,
      adminId: req.session?.user?.id || req.session?.user?._id,
      brojBlokova: content.length,
    });

    return flashAndRedirect(
      req, res, "success",
      "Sadržaj je uspešno ažuriran",
      `/admin/blog/${postId}/sadrzaj`
    );
  } catch (error) {
    logError(`[updateContent] Greška pri ažuriranju sadržaja posta`, error, {
      postId: req.params.postId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/blog/${req.params.postId}/sadrzaj`
    );
  }
}

export async function seoPage(req, res, next) {
  try {
    const { postId } = req.params;
    const post = await postService.getPostById(postId);

    return res.render("admin/posts/seo", {
      pageTitle: `SEO - ${post.osnovno.naziv}`,
      pageDescription: "SEO podešavanja blog posta",
      data: {
        post,
        errors: {},
        formData: {},
      },
    });
  } catch (error) {
    logError(`[seoPage] Greška pri prikazu SEO strane`, error, {
      postId: req.params.postId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updateSeo(req, res, next) {
  try {
    const { postId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateSeo] Validacione greške za postId=${postId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        `/admin/blog/${postId}/seo`
      );
    }

    const seoData = {
      description: req.body.description || '',
      shortDescription: req.body.shortDescription || '',
      keyWords: [],
      faq: Array.isArray(req.body.faq) ? req.body.faq : [],
    };

    if (req.body.keyWords && typeof req.body.keyWords === 'string') {
      seoData.keyWords = req.body.keyWords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    await postService.updatePostSeo(postId, seoData);

    logInfo(`[updateSeo] SEO za post #${postId} uspešno ažuriran`, {
      postId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "SEO podaci su uspešno ažurirani",
      `/admin/blog/${postId}/seo`
    );
  } catch (error) {
    logError(`[updateSeo] Greška pri ažuriranju SEO podataka`, error, {
      postId: req.params.postId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/blog/${req.params.postId}/seo`
    );
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateStatus] Validacione greške za postId=${postId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        `/admin/blog/detalji/${postId}`
      );
    }

    await postService.updatePostStatus(postId, status);

    logInfo(`[updateStatus] Status posta #${postId} promenjen na "${status}"`, {
      postId,
      newStatus: status,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Status je uspešno promenjen",
      `/admin/blog/detalji/${postId}`
    );
  } catch (error) {
    logError(`[updateStatus] Greška pri promeni statusa posta`, error, {
      postId: req.params.postId,
      requestedStatus: req.body.status,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/blog/detalji/${req.params.postId}`
    );
  }
}

export async function deletePost(req, res, next) {
  try {
    const { postId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deletePost] Validacione greške za postId=${postId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(req, res, "error", "Neispravan ID posta", "/admin/blog");
    }

    await postService.deletePost(postId);

    logInfo(`[deletePost] Blog post #${postId} uspešno obrisan`, {
      postId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(req, res, "success", "Blog post je uspešno obrisan", "/admin/blog");
  } catch (error) {
    logError(`[deletePost] Greška pri brisanju posta`, error, {
      postId: req.params.postId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(req, res, "error", error.message, "/admin/blog");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/blog");
    }

    return res.redirect(`/admin/blog/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi postova`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// ============================================================
//  UPLOAD SLIKE ZA SADRŽAJ (editor) — JSON endpoint, no flash
// ============================================================

export async function uploadContentImage(req, res, next) {
  try {
    if (!req.uploadedFile || !req.uploadedFile.img) {
      logWarn(`[uploadContentImage] Slika nije upload-ovana`, {
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return res.status(400).json({
        success: false,
        error: 'Slika nije upload-ovana'
      });
    }

    const imageUrl = `/images/posts/${req.uploadedFile.img}`;

    logInfo(`[uploadContentImage] Slika uspešno upload-ovana: ${imageUrl}`, {
      imageUrl,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    res.json({
      success: true,
      url: imageUrl
    });
  } catch (error) {
    logError(`[uploadContentImage] Greška pri upload-u slike za sadržaj`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listPosts,
  postDetails,
  newPostForm,
  createPost,
  updatePost,
  contentPage,
  updateContent,
  seoPage,
  updateSeo,
  updateStatus,
  deletePost,
  searchRedirect,
  uploadContentImage,
};