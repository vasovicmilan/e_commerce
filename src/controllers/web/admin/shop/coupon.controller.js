import * as couponService from "../../../../services/coupon.service.js";
import { getPartners } from "../../../../services/user.service.js";
import {
  prepareCouponListData,
  prepareCouponDetailsData,
  prepareCouponFormData,
} from "../../../../presenters/admin/coupon.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";   // ← dodato

async function loadPartners() {
  return getPartners({ limit: 200 });
}

export async function listCoupons(req, res, next) {
  try {
    const { search, isActive, discountType, isValid, page = 1, limit = 10 } = req.query;

    const result = await couponService.listCoupons({
      search: search || req.params.search,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      discountType: discountType || undefined,
      isValid: isValid === "true" ? true : isValid === "false" ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareCouponListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Kuponi",
      pageDescription: "Pregled svih kupona",
      data: viewData,
    });
  } catch (error) {
    logError(`[listCoupons] Greška pri učitavanju liste kupona`, error, {
      search: req.query.search,
      isActive: req.query.isActive,
      discountType: req.query.discountType,
      isValid: req.query.isValid,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function couponDetails(req, res, next) {
  try {
    const { couponId } = req.params;

    const coupon = await couponService.getCouponById(couponId);
    const viewData = prepareCouponDetailsData(coupon);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const partners = await loadPartners();
      const formData = prepareCouponFormData(coupon, partners);
      return res.render("admin/_form", {
        pageTitle: `Izmena - ${coupon.osnovno.kod}`,
        pageDescription: `Popust: ${coupon.osnovno.popust}`,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Kupon - ${coupon.osnovno.kod}`,
      pageDescription: `Popust: ${coupon.osnovno.popust}`,
      data: viewData,
    });
  } catch (error) {
    logError(`[couponDetails] Greška pri učitavanju detalja kupona`, error, {
      couponId: req.params.couponId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function newCouponForm(req, res, next) {
  try {
    const partners = await loadPartners();
    const formData = prepareCouponFormData(null, partners);

    return res.render("admin/_form", {
      pageTitle: "Novi kupon",
      pageDescription: "Kreiraj novi kupon za popust",
      data: { ...formData, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[newCouponForm] Greška pri prikazu forme za novi kupon`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const result = await couponService.createCoupon(req.body);

    logInfo(`[createCoupon] Kupon "${result.osnovno?.kod || result.id}" uspešno kreiran`, {
      couponId: result.id,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Kupon je uspešno kreiran");
    res.redirect(`/admin/kuponi/detalji/${result.id}`);
  } catch (error) {
    logError(`[createCoupon] Greška pri kreiranju kupona`, error, {
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });

    if (error.name === 'ValidationError' || error.statusCode === 409) {
      req.flash("error", error.message);
      const partners = await loadPartners();
      const formData = prepareCouponFormData(null, partners);
      formData.errors = error.errors || { general: error.message };
      formData.formData = req.body;
      res.status(400).render("admin/_form", {
        pageTitle: "Novi kupon",
        pageDescription: "Kreiraj novi kupon za popust",
        data: formData,
      });
    } else {
      next(error);
    }
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const { couponId } = req.params;
    const result = await couponService.updateCoupon(couponId, req.body);

    logInfo(`[updateCoupon] Kupon #${couponId} uspešno ažuriran`, {
      couponId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Kupon je uspešno ažuriran");
    res.redirect(`/admin/kuponi/detalji/${result.id}`);
  } catch (error) {
    logError(`[updateCoupon] Greška pri ažuriranju kupona`, error, {
      couponId: req.params.couponId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });

    if (error.name === 'ValidationError' || error.statusCode === 404 || error.statusCode === 409) {
      req.flash("error", error.message);
      const partners = await loadPartners();
      const coupon = await couponService.getCouponForEdit(couponId);
      const formData = prepareCouponFormData(coupon, partners);
      formData.errors = error.errors || { general: error.message };
      formData.formData = req.body;
      res.status(400).render("admin/_form", {
        pageTitle: `Izmena - ${coupon.osnovno.kod}`,
        pageDescription: `Popust: ${coupon.osnovno.popust}`,
        data: formData,
      });
    } else {
      next(error);
    }
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const { couponId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteCoupon] Validacione greške za couponId=${couponId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", "Neispravan ID kupona");
      return res.redirect("/admin/kuponi");
    }

    await couponService.deleteCoupon(couponId);

    logInfo(`[deleteCoupon] Kupon #${couponId} uspešno obrisan`, {
      couponId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Kupon je uspešno obrisan");
    return res.redirect("/admin/kuponi");
  } catch (error) {
    logError(`[deleteCoupon] Greška pri brisanju kupona`, error, {
      couponId: req.params.couponId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/admin/kuponi");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/kuponi");
    }

    return res.redirect(`/admin/kuponi/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi kupona`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listCoupons,
  couponDetails,
  newCouponForm,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  searchRedirect,
};