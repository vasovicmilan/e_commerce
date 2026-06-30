import * as testimonialService from "../../../services/testimonial.service.js";
import {
  prepareTestimonialListData,
  prepareTestimonialDetailsData,
} from "../../../presenters/admin/testimonial.presenter.js";
import { logError, logWarn, logInfo } from "../../../utils/logger.util.js";
import { flashAndRedirect } from "../../../utils/flash.util.js";

export async function listTestimonials(req, res, next) {
  try {
    const { search, rating, isApproved, isFeatured, page = 1, limit = 10 } = req.query;

    const result = await testimonialService.listTestimonials({
      search: search || req.params.search,
      rating: rating ? parseInt(rating, 10) : undefined,
      isApproved: isApproved === "true" ? true : isApproved === "false" ? false : undefined,
      isFeatured: isFeatured === "true" ? true : isFeatured === "false" ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareTestimonialListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Testimonials",
      pageDescription: "Pregled svih utisaka kupaca",
      data: viewData,
    });
  } catch (error) {
    logError(`[listTestimonials] Greška pri učitavanju liste testimoniala`, error, {
      search: req.query.search,
      rating: req.query.rating,
      isApproved: req.query.isApproved,
      isFeatured: req.query.isFeatured,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function testimonialDetails(req, res, next) {
  try {
    const { testimonialId } = req.params;
    const testimonial = await testimonialService.getTestimonialById(testimonialId);
    const viewData = prepareTestimonialDetailsData(testimonial);

    return res.render("admin/_details", {
      pageTitle: `Testimonial - ${testimonial.osnovno.ime}`,
      pageDescription: testimonial.osnovno.naslov || testimonial.osnovno.komentar?.substring(0, 100),
      data: viewData,
    });
  } catch (error) {
    logError(`[testimonialDetails] Greška pri učitavanju detalja testimoniala`, error, {
      testimonialId: req.params.testimonialId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// NOTE: testimonial.validator.js's validateTestimonialApprove requires
// `approvedBy` in the request body, but this controller pulls it from the
// session and never checks req.validationErrors. This is a pre-existing
// inconsistency (the validator is effectively dead code for this route) and
// is outside the scope of the flash refactor — flagged separately, not fixed
// here to avoid silently changing authorization semantics.
export async function approveTestimonial(req, res, next) {
  try {
    const { testimonialId } = req.params;
    const approvedBy = req.session?.user?.id || req.session?.user?._id;

    await testimonialService.approveTestimonial(testimonialId, approvedBy);

    logInfo(`[approveTestimonial] Testimonial #${testimonialId} odobren od strane admina ${approvedBy}`, {
      testimonialId,
      approvedBy,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Testimonial je uspešno odobren",
      `/admin/testimoniali/detalji/${testimonialId}`
    );
  } catch (error) {
    logError(`[approveTestimonial] Greška pri odobravanju testimoniala`, error, {
      testimonialId: req.params.testimonialId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/testimoniali/detalji/${req.params.testimonialId}`
    );
  }
}

export async function toggleFeatured(req, res, next) {
  try {
    const { testimonialId } = req.params;
    const { isFeatured } = req.body;

    if (req.validationErrors) {
      logWarn(`[toggleFeatured] Validacione greške za testimonialId=${testimonialId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        `/admin/testimoniali/detalji/${testimonialId}`
      );
    }

    const featuredStatus = isFeatured === "true" || isFeatured === true || isFeatured === "1";
    await testimonialService.toggleFeatured(testimonialId, featuredStatus);

    logInfo(`[toggleFeatured] Testimonial #${testimonialId} status istaknutog promenjen na ${featuredStatus}`, {
      testimonialId,
      isFeatured: featuredStatus,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Status istaknutog je promenjen",
      `/admin/testimoniali/detalji/${testimonialId}`
    );
  } catch (error) {
    logError(`[toggleFeatured] Greška pri promeni statusa istaknutog`, error, {
      testimonialId: req.params.testimonialId,
      isFeatured: req.body.isFeatured,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/testimoniali/detalji/${req.params.testimonialId}`
    );
  }
}

export async function updateTestimonial(req, res, next) {
  try {
    const { testimonialId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateTestimonial] Validacione greške za testimonialId=${testimonialId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        `/admin/testimoniali/detalji/${testimonialId}`
      );
    }

    await testimonialService.updateTestimonial(testimonialId, req.body);

    logInfo(`[updateTestimonial] Testimonial #${testimonialId} uspešno ažuriran`, {
      testimonialId,
      adminId: req.session?.user?.id || req.session?.user?._id,
      updatedFields: Object.keys(req.body),
    });

    return flashAndRedirect(
      req, res, "success",
      "Testimonial je ažuriran",
      `/admin/testimoniali/detalji/${testimonialId}`
    );
  } catch (error) {
    logError(`[updateTestimonial] Greška pri ažuriranju testimoniala`, error, {
      testimonialId: req.params.testimonialId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/testimoniali/detalji/${req.params.testimonialId}`
    );
  }
}

export async function deleteTestimonial(req, res, next) {
  try {
    const { testimonialId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteTestimonial] Validacione greške za testimonialId=${testimonialId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(req, res, "error", "Neispravan ID", "/admin/testimoniali");
    }

    await testimonialService.deleteTestimonial(testimonialId);

    logInfo(`[deleteTestimonial] Testimonial #${testimonialId} uspešno obrisan`, {
      testimonialId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(req, res, "success", "Testimonial je obrisan", "/admin/testimoniali");
  } catch (error) {
    logError(`[deleteTestimonial] Greška pri brisanju testimoniala`, error, {
      testimonialId: req.params.testimonialId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(req, res, "error", error.message, "/admin/testimoniali");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;
    if (!search || !search.trim()) return res.redirect("/admin/testimoniali");
    return res.redirect(`/admin/testimoniali/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi testimoniala`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listTestimonials,
  testimonialDetails,
  approveTestimonial,
  toggleFeatured,
  updateTestimonial,
  deleteTestimonial,
  searchRedirect,
};