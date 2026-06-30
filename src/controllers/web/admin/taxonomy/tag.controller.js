import * as tagService from "../../../../services/tag.service.js";
import {
  prepareTagListData,
  prepareTagDetailsData,
  prepareTagFormData,
} from "../../../../presenters/admin/tag.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";
import { flashAndRedirect } from "../../../../utils/flash.util.js";

// ============================================================
//  POMOĆNA FUNKCIJA ZA SANITIZACIJU
// ============================================================

function sanitizeTagData(data) {
  const sanitized = { ...data };

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

export async function listTags(req, res, next) {
  try {
    const { search, domain, type, isActive, page = 1, limit = 10 } = req.query;

    const result = await tagService.listTags({
      search: search || req.params.search,
      domain: domain || undefined,
      type: type || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareTagListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Tagovi",
      pageDescription: "Pregled svih tagova",
      data: viewData,
    });
  } catch (error) {
    logError(`[listTags] Greška pri učitavanju liste tagova`, error, {
      search: req.query.search,
      domain: req.query.domain,
      type: req.query.type,
      isActive: req.query.isActive,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function tagDetails(req, res, next) {
  try {
    const { tagId } = req.params;

    const tag = await tagService.getTagById(tagId);
    const viewData = prepareTagDetailsData(tag);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const formData = prepareTagFormData(tag);
      return res.render("admin/_form", {
        pageTitle: `Izmena - ${tag.osnovno.naziv}`,
        pageDescription: tag.osnovno.kratakOpis || tag.osnovno.naziv,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Tag - ${tag.osnovno.naziv}`,
      pageDescription: tag.osnovno.kratakOpis || tag.osnovno.naziv,
      data: viewData,
    });
  } catch (error) {
    logError(`[tagDetails] Greška pri učitavanju detalja taga`, error, {
      tagId: req.params.tagId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function newTagForm(req, res, next) {
  try {
    const formData = prepareTagFormData();
    return res.render("admin/_form", {
      pageTitle: "Novi tag",
      pageDescription: "Kreiraj novi tag",
      data: { ...formData, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[newTagForm] Greška pri prikazu forme za novi tag`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function createTag(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[createTag] Validacione greške pri kreiranju taga`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
        body: req.body,
      });
      const formData = prepareTagFormData();
      return res.render("admin/_form", {
        pageTitle: "Novi tag",
        pageDescription: "Kreiraj novi tag",
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const data = { ...req.body };
    const sanitizedData = sanitizeTagData(data);

    // SLUG SE GENERIŠE U SERVISU – ne prosleđujemo ga ovde
    const tag = await tagService.createTag(sanitizedData);

    logInfo(`[createTag] Tag kreiran: "${tag.osnovno.naziv}" (ID: ${tag.id})`, {
      tagId: tag.id,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Tag je uspešno kreiran",
      `/admin/tagovi/detalji/${tag.id}`
    );
  } catch (error) {
    logError(`[createTag] Greška pri kreiranju taga`, error, {
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 409) {
      const formData = prepareTagFormData();
      return res.render("admin/_form", {
        pageTitle: "Novi tag",
        pageDescription: "Kreiraj novi tag",
        data: { ...formData, errors: { general: error.message }, formData: req.body },
      });
    }
    next(error);
  }
}

// FIX M5: validation errors now re-render with formData (was flash+redirect, losing input)
export async function updateTag(req, res, next) {
  try {
    const { tagId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateTag] Validacione greške za tagId=${tagId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      const tag = await tagService.getTagById(tagId);
      const formData = prepareTagFormData(tag);
      return res.render("admin/_form", {
        pageTitle: `Izmena - ${tag.osnovno.naziv}`,
        pageDescription: tag.osnovno.kratakOpis || tag.osnovno.naziv,
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const data = { ...req.body };
    const sanitizedData = sanitizeTagData(data);

    // SLUG SE NE MENJA OSNOVNO – servis će ga ažurirati SAMO ako je eksplicitno prosleđen
    await tagService.updateTag(tagId, sanitizedData);

    logInfo(`[updateTag] Tag #${tagId} uspešno ažuriran`, {
      tagId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Tag je uspešno ažuriran",
      `/admin/tagovi/detalji/${tagId}`
    );
  } catch (error) {
    logError(`[updateTag] Greška pri ažuriranju taga`, error, {
      tagId: req.params.tagId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
      return flashAndRedirect(
        req, res, "error", error.message,
        `/admin/tagovi/izmena/${req.params.tagId}`
      );
    }
    next(error);
  }
}

export async function deleteTag(req, res, next) {
  try {
    const { tagId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteTag] Validacione greške za tagId=${tagId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(req, res, "error", "Neispravan ID taga", "/admin/tagovi");
    }

    await tagService.deleteTag(tagId);

    logInfo(`[deleteTag] Tag #${tagId} uspešno obrisan`, {
      tagId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(req, res, "success", "Tag je uspešno obrisan", "/admin/tagovi");
  } catch (error) {
    logError(`[deleteTag] Greška pri brisanju taga`, error, {
      tagId: req.params.tagId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(req, res, "error", error.message, "/admin/tagovi");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/tagovi");
    }

    return res.redirect(`/admin/tagovi/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi tagova`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listTags,
  tagDetails,
  newTagForm,
  createTag,
  updateTag,
  deleteTag,
  searchRedirect,
};