import * as itemService from "../../../../services/item.service.js";
import * as categoryService from "../../../../services/category.service.js";
import * as tagService from "../../../../services/tag.service.js";
import {
  prepareItemListData,
  prepareItemDetailsData,
  prepareItemFormData,
} from "../../../../presenters/admin/item.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";   // ← dodato

// ============================================================
//  POMOĆNA FUNKCIJA ZA PARSIRANJE MERA
// ============================================================

function parseMeasurements(body) {
  const measurements = {};

  const measurementFields = ['unit', 'bust', 'chest', 'sleeve', 'length', 'waist', 'hips', 'inseam', 'rise', 'thigh', 'note'];

  for (const field of measurementFields) {
    const key = `measurements_${field}`;
    if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
      if (['unit', 'note'].includes(field)) {
        measurements[field] = body[key].trim();
      } else {
        const num = parseFloat(body[key]);
        if (!isNaN(num) && num >= 0) {
          measurements[field] = num;
        }
      }
    }
  }

  if (Object.keys(measurements).length === 0) {
    return {};
  }

  if (!measurements.unit) {
    measurements.unit = 'cm';
  }

  return measurements;
}

// ============================================================
//  ADMIN - LIST
// ============================================================

export async function listItems(req, res, next) {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const result = await itemService.listItems({
      search: search || req.params.search,
      status: status || undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareItemListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Artikli",
      pageDescription: "Pregled svih artikala",
      data: viewData,
    });
  } catch (error) {
    logError(`[listItems] Greška pri učitavanju liste artikala`, error, {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// ============================================================
//  ADMIN - DETAILS / EDIT
// ============================================================

export async function itemDetails(req, res, next) {
  try {
    const { itemId } = req.params;
    const item = await itemService.getItemById(itemId);
    const viewData = prepareItemDetailsData(item);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const categoriesResult = await categoryService.listCategories({ domain: 'item', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'item', limit: 1000, page: 1 });

      const formData = prepareItemFormData(
        item,
        categoriesResult.data || [],
        tagsResult.data || []
      );

      return res.render("admin/_form", {
        pageTitle: `Izmena - ${item.osnovno.naziv}`,
        pageDescription: item.seo?.kratakOpis || item.osnovno.naziv,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Artikal - ${item.osnovno.naziv}`,
      pageDescription: item.seo?.kratakOpis || item.osnovno.naziv,
      data: viewData,
    });
  } catch (error) {
    logError(`[itemDetails] Greška pri učitavanju detalja artikla`, error, {
      itemId: req.params.itemId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// ============================================================
//  ADMIN - CREATE FORM
// ============================================================

export async function newItemForm(req, res, next) {
  try {
    const categoriesResult = await categoryService.listCategories({ domain: 'item', limit: 1000, page: 1 });
    const tagsResult = await tagService.listTags({ domain: 'item', limit: 1000, page: 1 });

    const formData = prepareItemFormData(
      null,
      categoriesResult.data || [],
      tagsResult.data || []
    );

    return res.render("admin/_form", {
      pageTitle: "Novi artikal",
      pageDescription: "Kreiraj novi artikal - Faza 1: Osnovni podaci",
      data: { ...formData, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[newItemForm] Greška pri prikazu forme za novi artikal`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// ============================================================
//  ADMIN - CREATE
// ============================================================

export async function createItem(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[createItem] Validacione greške pri kreiranju artikla`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
        body: req.body,
      });
      const categoriesResult = await categoryService.listCategories({ domain: 'item', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'item', limit: 1000, page: 1 });
      const formData = prepareItemFormData(null, categoriesResult.data || [], tagsResult.data || []);

      return res.render("admin/_form", {
        pageTitle: "Novi artikal",
        pageDescription: "Kreiraj novi artikal - Faza 1",
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const data = { ...req.body };

    // FeatureImage
    if (req.uploadedFiles?.featureImage) {
      const imgData = req.uploadedFiles.featureImage;
      data.featureImage = {
        img: imgData.img,
        imgDesc: req.body.featureImageDesc || '',
      };
    } else {
      logWarn(`[createItem] Nedostaje featureImage`, {
        userId: req.session?.user?.id || req.session?.user?._id,
        body: req.body,
      });
    }

    // Video
    if (req.uploadedFiles?.video) {
      const videoData = req.uploadedFiles.video;
      data.video = {
        vid: videoData.vid,
        vidDesc: req.body.videoDesc || '',
      };
    } else if (data.video && typeof data.video === 'string') {
      data.video = { vid: data.video, vidDesc: req.body.videoDesc || '' };
    }

    // Kategorije i tagovi – filter praznih vrednosti
    data.categories = Array.isArray(req.body.categories) ? req.body.categories.filter(id => id && id.trim() !== '') : [];
    data.tags = Array.isArray(req.body.tags) ? req.body.tags.filter(id => id && id.trim() !== '') : [];

    const item = await itemService.createItem(data);

    logInfo(`[createItem] Artikal kreiran: "${item.osnovno.naziv}" (ID: ${item.id})`, {
      itemId: item.id,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Artikal je uspešno kreiran.");
    return res.redirect(`/admin/artikli/detalji/${item.id}`);
  } catch (error) {
    logError(`[createItem] Greška pri kreiranju artikla`, error, {
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 409) {
      req.flash("error", error.message);
      const categoriesResult = await categoryService.listCategories({ domain: 'item', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'item', limit: 1000, page: 1 });
      const formData = prepareItemFormData(null, categoriesResult.data || [], tagsResult.data || []);

      return res.render("admin/_form", {
        pageTitle: "Novi artikal",
        pageDescription: "Kreiraj novi artikal - Faza 1",
        data: { ...formData, errors: { general: error.message }, formData: req.body },
      });
    }
    next(error);
  }
}

// ============================================================
//  ADMIN - UPDATE
// ============================================================

export async function updateItem(req, res, next) {
  try {
    const { itemId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateItem] Validacione greške za itemId=${itemId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      const item = await itemService.getItemById(itemId);
      const categoriesResult = await categoryService.listCategories({ domain: 'item', limit: 1000, page: 1 });
      const tagsResult = await tagService.listTags({ domain: 'item', limit: 1000, page: 1 });
      const formData = prepareItemFormData(item, categoriesResult.data || [], tagsResult.data || []);

      return res.render("admin/_form", {
        pageTitle: `Izmena - ${item.osnovno.naziv}`,
        pageDescription: item.seo?.kratakOpis || "",
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const updateData = { ...req.body };

    // FeatureImage
    if (req.uploadedFiles?.featureImage) {
      const imgData = req.uploadedFiles.featureImage;
      updateData.featureImage = {
        img: imgData.img,
        imgDesc: req.body.featureImageDesc || '',
      };
    }

    // Video
    if (req.uploadedFiles?.video) {
      const videoData = req.uploadedFiles.video;
      updateData.video = {
        vid: videoData.vid,
        vidDesc: req.body.videoDesc || '',
      };
    } else if (updateData.video && typeof updateData.video === 'string') {
      updateData.video = { vid: updateData.video, vidDesc: req.body.videoDesc || '' };
    }

    // Kategorije i tagovi
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

    await itemService.updateItem(itemId, updateData);

    logInfo(`[updateItem] Artikal #${itemId} uspešno ažuriran`, {
      itemId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Artikal je uspešno ažuriran");
    return res.redirect(`/admin/artikli/detalji/${itemId}`);
  } catch (error) {
    logError(`[updateItem] Greška pri ažuriranju artikla`, error, {
      itemId: req.params.itemId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
      req.flash("error", error.message);
      return res.redirect(`/admin/artikli/izmena/${req.params.itemId}`);
    }
    next(error);
  }
}

// ============================================================
//  ADMIN - VARIJACIJE (PAGE)
// ============================================================

export async function variationsPage(req, res, next) {
  try {
    const { itemId } = req.params;
    const item = await itemService.getItemById(itemId);

    return res.render("admin/items/variations", {
      pageTitle: `Varijacije - ${item.osnovno.naziv}`,
      pageDescription: "Upravljanje varijacijama artikla",
      data: { item, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[variationsPage] Greška pri prikazu strane za varijacije`, error, {
      itemId: req.params.itemId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// ============================================================
//  ADMIN - ADD VARIATION (sa merama)
// ============================================================

export async function addVariation(req, res, next) {
  try {
    const { itemId } = req.params;

    // === PARSIRANJE MERA ===
    const measurements = parseMeasurements(req.body);
    req.body.measurements = measurements;

    // Ako je upload-ovana slika, dodaj je u body
    if (req.uploadedFile) {
      req.body.image = {
        img: req.uploadedFile.img,
        imgDesc: req.body.variationImageDesc || '',
      };
    }

    if (req.validationErrors) {
      logWarn(`[addVariation] Validacione greške za itemId=${itemId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/artikli/${itemId}/varijacije`);
    }

    await itemService.addVariation(itemId, req.body);

    logInfo(`[addVariation] Varijacija dodata za artikal #${itemId}`, {
      itemId,
      adminId: req.session?.user?.id || req.session?.user?._id,
      size: req.body.size,
      color: req.body.color,
    });

    req.flash("success", "Varijacija je uspešno dodata");
    return res.redirect(`/admin/artikli/${itemId}/varijacije`);
  } catch (error) {
    logError(`[addVariation] Greška pri dodavanju varijacije`, error, {
      itemId: req.params.itemId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 409) {
      req.flash("error", error.message);
      return res.redirect(`/admin/artikli/${req.params.itemId}/varijacije`);
    }
    next(error);
  }
}

// ============================================================
//  ADMIN - UPDATE VARIATION (sa merama)
// ============================================================

export async function updateVariation(req, res, next) {
  try {
    const { itemId, variationId } = req.params;

    // === PARSIRANJE MERA ===
    const measurements = parseMeasurements(req.body);
    req.body.measurements = measurements;

    if (req.uploadedFile) {
      req.body.image = {
        img: req.uploadedFile.img,
        imgDesc: req.body.variationImageDesc || '',
      };
    }

    if (req.validationErrors) {
      logWarn(`[updateVariation] Validacione greške za itemId=${itemId}, variationId=${variationId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/artikli/${itemId}/varijacije`);
    }

    await itemService.updateVariation(itemId, variationId, req.body);

    logInfo(`[updateVariation] Varijacija #${variationId} ažurirana za artikal #${itemId}`, {
      itemId,
      variationId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Varijacija je uspešno ažurirana");
    return res.redirect(`/admin/artikli/${itemId}/varijacije`);
  } catch (error) {
    logError(`[updateVariation] Greška pri ažuriranju varijacije`, error, {
      itemId: req.params.itemId,
      variationId: req.params.variationId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect(`/admin/artikli/${req.params.itemId}/varijacije`);
  }
}

// ============================================================
//  ADMIN - REMOVE VARIATION
// ============================================================

export async function removeVariation(req, res, next) {
  try {
    const { itemId, variationId } = req.params;

    await itemService.removeVariation(itemId, variationId);

    logInfo(`[removeVariation] Varijacija #${variationId} obrisana za artikal #${itemId}`, {
      itemId,
      variationId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Varijacija je uspešno obrisana");
    return res.redirect(`/admin/artikli/${itemId}/varijacije`);
  } catch (error) {
    logError(`[removeVariation] Greška pri brisanju varijacije`, error, {
      itemId: req.params.itemId,
      variationId: req.params.variationId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect(`/admin/artikli/${req.params.itemId}/varijacije`);
  }
}

// ============================================================
//  ADMIN - SEO
// ============================================================

export async function seoPage(req, res, next) {
  try {
    const { itemId } = req.params;
    const item = await itemService.getItemById(itemId);

    return res.render("admin/items/seo", {
      pageTitle: `SEO - ${item.osnovno.naziv}`,
      pageDescription: "SEO podešavanja artikla",
      data: { item, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[seoPage] Greška pri prikazu SEO strane`, error, {
      itemId: req.params.itemId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updateSeo(req, res, next) {
  try {
    const { itemId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateSeo] Validacione greške za itemId=${itemId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      const errorMessages = Object.values(req.validationErrors).flat().join(", ");
      req.flash("error", errorMessages);
      return res.redirect(`/admin/artikli/${itemId}/seo`);
    }

    // 🔥 Samo prosledi req.body – sve ostalo rade validator i repozitorijum
    await itemService.updateItemSeo(itemId, req.body);

    logInfo(`[updateSeo] SEO za artikal #${itemId} uspešno ažuriran`, {
      itemId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "SEO podaci su uspešno ažurirani");
    return res.redirect(`/admin/artikli/detalji/${itemId}`);
  } catch (error) {
    logError(`[updateSeo] Greška pri ažuriranju SEO podataka`, error, {
      itemId: req.params.itemId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message || "Došlo je do greške prilikom ažuriranja SEO podataka.");
    return res.redirect(`/admin/artikli/${req.params.itemId}/seo`);
  }
}

// ============================================================
//  ADMIN - STATUS
// ============================================================

export async function updateStatus(req, res, next) {
  try {
    const { itemId } = req.params;
    const { status } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateStatus] Validacione greške za itemId=${itemId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/artikli/detalji/${itemId}`);
    }

    await itemService.updateItemStatus(itemId, status);

    logInfo(`[updateStatus] Status artikla #${itemId} promenjen na "${status}"`, {
      itemId,
      newStatus: status,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Status je uspešno promenjen");
    return res.redirect(`/admin/artikli/detalji/${itemId}`);
  } catch (error) {
    logError(`[updateStatus] Greška pri promeni statusa artikla`, error, {
      itemId: req.params.itemId,
      requestedStatus: req.body.status,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect(`/admin/artikli/detalji/${req.params.itemId}`);
  }
}

// ============================================================
//  ADMIN - DELETE
// ============================================================

export async function deleteItem(req, res, next) {
  try {
    const { itemId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteItem] Validacione greške za itemId=${itemId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", "Neispravan ID artikla");
      return res.redirect("/admin/artikli");
    }

    await itemService.deleteItem(itemId);

    logInfo(`[deleteItem] Artikal #${itemId} uspešno obrisan`, {
      itemId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Artikal je uspešno obrisan");
    return res.redirect("/admin/artikli");
  } catch (error) {
    logError(`[deleteItem] Greška pri brisanju artikla`, error, {
      itemId: req.params.itemId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/admin/artikli");
  }
}

// ============================================================
//  ADMIN - SEARCH
// ============================================================

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/artikli");
    }

    return res.redirect(`/admin/artikli/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi artikala`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// ============================================================
//  DEFAULT EXPORT
// ============================================================

export default {
  listItems,
  itemDetails,
  newItemForm,
  createItem,
  updateItem,
  variationsPage,
  addVariation,
  updateVariation,
  removeVariation,
  seoPage,
  updateSeo,
  updateStatus,
  deleteItem,
  searchRedirect,
};