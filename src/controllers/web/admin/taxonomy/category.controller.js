import * as categoryService from "../../../../services/category.service.js";
import {
  prepareCategoryListData,
  prepareCategoryDetailsData,
  prepareCategoryFormData,
} from "../../../../presenters/admin/category.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";   // ← dodato

// ============================================================
//  POMOĆNA FUNKCIJA ZA SANITIZACIJU
// ============================================================

function sanitizeCategoryData(data) {
  const sanitized = { ...data };

  if (sanitized.parent === 'null' || sanitized.parent === '' || sanitized.parent === undefined) {
    sanitized.parent = null;
  }

  if (Array.isArray(sanitized.isIndexable)) {
    sanitized.isIndexable = sanitized.isIndexable.includes('1');
  } else if (sanitized.isIndexable !== undefined) {
    sanitized.isIndexable = Boolean(sanitized.isIndexable);
  }

  if (sanitized.meta && Array.isArray(sanitized.meta.isActive)) {
    sanitized.meta.isActive = sanitized.meta.isActive.includes('1');
  } else if (sanitized.meta && sanitized.meta.isActive !== undefined) {
    sanitized.meta.isActive = Boolean(sanitized.meta.isActive);
  }

  if (sanitized.meta && sanitized.meta.priority !== undefined) {
    sanitized.meta.priority = parseInt(sanitized.meta.priority, 10) || 0;
  }

  return sanitized;
}

// ============================================================
//  KONTROLERI
// ============================================================

export async function listCategories(req, res, next) {
  try {
    const { search, domain, parent, isActive, page = 1, limit = 10 } = req.query;

    const result = await categoryService.listCategories({
      search: search || req.params.search,
      domain: domain || undefined,
      parent: parent || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareCategoryListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Kategorije",
      pageDescription: "Pregled svih kategorija",
      data: viewData,
    });
  } catch (error) {
    logError(`[listCategories] Greška pri učitavanju liste kategorija`, error, {
      search: req.query.search,
      domain: req.query.domain,
      parent: req.query.parent,
      isActive: req.query.isActive,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function categoryDetails(req, res, next) {
  try {
    const { categoryId } = req.params;

    const category = await categoryService.getCategoryById(categoryId);
    const viewData = prepareCategoryDetailsData(category);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const formData = prepareCategoryFormData(category);
      return res.render("admin/_form", {
        pageTitle: `Izmena - ${category.osnovno.naziv}`,
        pageDescription: category.osnovno.kratakOpis || category.osnovno.naziv,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Kategorija - ${category.osnovno.naziv}`,
      pageDescription: category.osnovno.kratakOpis || category.osnovno.naziv,
      data: viewData,
    });
  } catch (error) {
    logError(`[categoryDetails] Greška pri učitavanju detalja kategorije`, error, {
      categoryId: req.params.categoryId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function newCategoryForm(req, res, next) {
  try {
    const formData = prepareCategoryFormData();
    return res.render("admin/_form", {
      pageTitle: "Nova kategorija",
      pageDescription: "Kreiraj novu kategoriju",
      data: { ...formData, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[newCategoryForm] Greška pri prikazu forme za novu kategoriju`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[createCategory] Validacione greške pri kreiranju kategorije`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
        body: req.body,
      });
      const formData = prepareCategoryFormData();
      return res.render("admin/_form", {
        pageTitle: "Nova kategorija",
        pageDescription: "Kreiraj novu kategoriju",
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const data = { ...req.body };

    // ISPRAVKA: koristi featureImage, ne categoryImage
    if (req.uploadedFile) {
      data.featureImage = {
        img: req.uploadedFile.img,
        imgDesc: req.body.categoryImageDesc || req.uploadedFile.imgDesc || "",
      };
    }

    const sanitizedData = sanitizeCategoryData(data);
    const category = await categoryService.createCategory(sanitizedData);

    logInfo(`[createCategory] Kategorija kreirana: "${category.osnovno.naziv}" (ID: ${category.id})`, {
      categoryId: category.id,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Kategorija je uspešno kreirana");
    return res.redirect(`/admin/kategorije/detalji/${category.id}`);
  } catch (error) {
    logError(`[createCategory] Greška pri kreiranju kategorije`, error, {
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 409) {
      req.flash("error", error.message);
      const formData = prepareCategoryFormData();
      return res.render("admin/_form", {
        pageTitle: "Nova kategorija",
        pageDescription: "Kreiraj novu kategoriju",
        data: { ...formData, errors: { general: error.message }, formData: req.body },
      });
    }
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  const { categoryId } = req.params;
 
  // Validation errors → re-render with form data preserved
  if (req.validationErrors) {
    try {
      const category = await categoryService.getCategoryById(categoryId);
      const formData = prepareCategoryFormData(category);
      return res.render("admin/categories/edit", {
        pageTitle: "Izmena kategorije",
        data: {
          ...formData,
          errors:   req.validationErrors,
          formData: req.body,          // ← preserve user's input
        },
      });
    } catch (innerError) {
      return next(innerError);
    }
  }
 
  try {
    await categoryService.updateCategory(categoryId, req.body, req.file);
    req.flash("success", "Kategorija je uspešno izmenjena");
    return res.redirect(`/admin/kategorije/izmena/${categoryId}`);
  } catch (error) {
    if (
      error.statusCode === 400 ||
      error.statusCode === 404 ||
      error.statusCode === 409
    ) {
      // Business error → flash + redirect (user already left the form context)
      req.flash("error", error.message);
      return res.redirect(`/admin/kategorije/izmena/${categoryId}`);
    }
    next(error);
  }
}
export async function deleteCategory(req, res, next) {
  try {
    const { categoryId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteCategory] Validacione greške za categoryId=${categoryId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", "Neispravan ID kategorije");
      return res.redirect("/admin/kategorije");
    }

    await categoryService.deleteCategory(categoryId);

    logInfo(`[deleteCategory] Kategorija #${categoryId} uspešno obrisana`, {
      categoryId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Kategorija je uspešno obrisana");
    return res.redirect("/admin/kategorije");
  } catch (error) {
    logError(`[deleteCategory] Greška pri brisanju kategorije`, error, {
      categoryId: req.params.categoryId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/admin/kategorije");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/kategorije");
    }

    return res.redirect(`/admin/kategorije/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi kategorija`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listCategories,
  categoryDetails,
  newCategoryForm,
  createCategory,
  updateCategory,
  deleteCategory,
  searchRedirect,
};