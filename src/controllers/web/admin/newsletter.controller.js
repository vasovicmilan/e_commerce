import * as newsletterService from "../../../services/newsletter.service.js";
import {
  prepareNewsletterListData,
  prepareNewsletterDetailsData,
} from "../../../presenters/admin/newsletter.presenter.js";
import { logError, logWarn, logInfo } from "../../../utils/logger.util.js";   // ← dodato

export async function listNewsletters(req, res, next) {
  try {
    const { search, isActive, page = 1, limit = 10 } = req.query;

    const result = await newsletterService.listNewsletters({
      search: search || req.params.search,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareNewsletterListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Newsletter",
      pageDescription: "Pregled svih newsletter prijava",
      data: viewData,
    });
  } catch (error) {
    logError(`[listNewsletters] Greška pri učitavanju liste newsletter-a`, error, {
      search: req.query.search,
      isActive: req.query.isActive,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function newsletterDetails(req, res, next) {
  try {
    const { newsletterId } = req.params;
    const newsletter = await newsletterService.getNewsletterById(newsletterId);
    const viewData = prepareNewsletterDetailsData(newsletter);

    return res.render("admin/_details", {
      pageTitle: `Newsletter - ${newsletter.osnovno.email}`,
      pageDescription: newsletter.osnovno.ime || "Bez imena",
      data: viewData,
    });
  } catch (error) {
    logError(`[newsletterDetails] Greška pri učitavanju detalja newsletter-a`, error, {
      newsletterId: req.params.newsletterId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { newsletterId } = req.params;
    const { isActive } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateStatus] Validacione greške za newsletterId=${newsletterId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/newsletter/detalji/${newsletterId}`);
    }

    const active = isActive === "true" || isActive === true;
    await newsletterService.updateNewsletterStatus(newsletterId, active);

    logInfo(`[updateStatus] Status newsletter-a #${newsletterId} promenjen na ${active ? 'aktivan' : 'neaktivan'}`, {
      newsletterId,
      isActive: active,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Status je uspešno promenjen");
    return res.redirect(`/admin/newsletter/detalji/${newsletterId}`);
  } catch (error) {
    logError(`[updateStatus] Greška pri promeni statusa newsletter-a`, error, {
      newsletterId: req.params.newsletterId,
      isActive: req.body.isActive,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect(`/admin/newsletter/detalji/${req.params.newsletterId}`);
  }
}

export async function deleteNewsletter(req, res, next) {
  try {
    const { newsletterId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteNewsletter] Validacione greške za newsletterId=${newsletterId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", "Neispravan ID newsletter-a");
      return res.redirect("/admin/newsletter");
    }

    await newsletterService.deleteNewsletter(newsletterId);

    logInfo(`[deleteNewsletter] Newsletter #${newsletterId} uspešno obrisan`, {
      newsletterId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Newsletter prijava je obrisana");
    return res.redirect("/admin/newsletter");
  } catch (error) {
    logError(`[deleteNewsletter] Greška pri brisanju newsletter-a`, error, {
      newsletterId: req.params.newsletterId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/admin/newsletter");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;
    if (!search || !search.trim()) return res.redirect("/admin/newsletter");
    return res.redirect(`/admin/newsletter/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi newsletter-a`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listNewsletters,
  newsletterDetails,
  updateStatus,
  deleteNewsletter,
  searchRedirect,
};