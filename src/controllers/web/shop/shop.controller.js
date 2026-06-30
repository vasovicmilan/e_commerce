import * as shopService from "../../../services/shop.service.js";
import {
  prepareShopHomeData,
  prepareListingData,
  prepareSearchData,
  prepareProductData,
  prepareCartData,
  prepareCheckoutData,
  prepareOrderCreatedData,
  prepareOrderConfirmedData,
  prepareOrderCancelledData,
} from "../../../presenters/shop/shop.presenter.js";
import { logError, logWarn, logInfo } from "../../../utils/logger.util.js";   // ← dodato

export async function shopHome(req, res, next) {
  try {
    const data = await shopService.getShopLandingData();
    const viewData = prepareShopHomeData(data);
    return res.render("shop/index", {
      pageTitle: data.seo.pageTitle,
      pageDescription: data.seo.pageDescription,
      data: viewData,
    });
  } catch (error) {
    logError(`[shopHome] Greška pri učitavanju početne strane prodavnice`, error);
    next(error);
  }
}

export async function featuredItems(req, res, next) {
  try {
    const { page = 1 } = req.query;
    const data = await shopService.getFeaturedItems({
      page: parseInt(page, 10) || 1,
    });
    const viewData = prepareListingData({
      ...data,
      basePath: "/prodavnica/istaknuto",
      query: req.query,
    });
    return res.render("shop/listing", {
      pageTitle: data.seo.pageTitle,
      pageDescription: data.seo.pageDescription,
      data: viewData,
    });
  } catch (error) {
    logError(`[featuredItems] Greška pri učitavanju istaknutih artikala`, error, {
      page: req.query.page,
    });
    next(error);
  }
}

export async function actionedItems(req, res, next) {
  try {
    const { page = 1 } = req.query;
    const data = await shopService.getActionedItems({
      page: parseInt(page, 10) || 1,
    });
    const viewData = prepareListingData({
      ...data,
      basePath: "/prodavnica/akcija",
      query: req.query,
    });
    return res.render("shop/listing", {
      pageTitle: data.seo.pageTitle,
      pageDescription: data.seo.pageDescription,
      data: viewData,
    });
  } catch (error) {
    logError(`[actionedItems] Greška pri učitavanju artikala na akciji`, error, {
      page: req.query.page,
    });
    next(error);
  }
}

export async function allItems(req, res, next) {
  try {
    const { page = 1 } = req.query;
    const data = await shopService.getPublishedItems({
      page: parseInt(page, 10) || 1,
    });
    const viewData = prepareListingData({
      ...data,
      basePath: "/prodavnica/svi",
      query: req.query,
    });
    return res.render("shop/listing", {
      pageTitle: data.seo.pageTitle,
      pageDescription: data.seo.pageDescription,
      data: viewData,
    });
  } catch (error) {
    logError(`[allItems] Greška pri učitavanju svih artikala`, error, {
      page: req.query.page,
    });
    next(error);
  }
}

export async function itemDetails(req, res, next) {
  try {
    const { slug } = req.params;
    const data = await shopService.getItemDetails(slug);
    const viewData = prepareProductData(data);
    return res.render("shop/product", {
      pageTitle: data.seo?.pageTitle || data.item?.naziv,
      pageDescription: data.seo?.pageDescription || data.item?.kratakOpis,
      data: viewData,
    });
  } catch (error) {
    logError(`[itemDetails] Greška pri učitavanju detalja artikla`, error, {
      slug: req.params.slug,
    });
    next(error);
  }
}

export async function categoryItems(req, res, next) {
  try {
    const { slug } = req.params;
    const { page = 1 } = req.query;
    const data = await shopService.getItemsByCategory(slug, {
      page: parseInt(page, 10) || 1,
    });
    const viewData = prepareListingData({
      ...data,
      basePath: `/prodavnica/kategorija/${slug}`,
      query: req.query,
    });
    return res.render("shop/listing", {
      pageTitle: data.seo?.pageTitle || data.category?.name,
      pageDescription: data.seo?.pageDescription || "",
      data: viewData,
    });
  } catch (error) {
    logError(`[categoryItems] Greška pri učitavanju artikala po kategoriji`, error, {
      slug: req.params.slug,
      page: req.query.page,
    });
    next(error);
  }
}

export async function tagItems(req, res, next) {
  try {
    const { slug, type } = req.params;
    const { page = 1 } = req.query;
    const data = await shopService.getItemsByTag(slug, type, {
      page: parseInt(page, 10) || 1,
    });
    const viewData = prepareListingData({
      ...data,
      basePath: `/prodavnica/tag/${slug}/${type}`,
      query: req.query,
    });
    return res.render("shop/listing", {
      pageTitle: data.seo?.pageTitle || data.tag?.name,
      pageDescription: data.seo?.pageDescription || "",
      data: viewData,
    });
  } catch (error) {
    logError(`[tagItems] Greška pri učitavanju artikala po tagu`, error, {
      slug: req.params.slug,
      type: req.params.type,
      page: req.query.page,
    });
    next(error);
  }
}

export async function searchItems(req, res, next) {
  try {
    const { q, page = 1 } = req.query;
    if (!q || !q.trim()) {
      logInfo(`[searchItems] Prazan upit za pretragu, preusmeravanje na /prodavnica`, {
        ip: req.ip,
      });
      return res.redirect("/prodavnica");
    }
    const data = await shopService.searchShopItems(q, {
      page: parseInt(page, 10) || 1,
    });
    const viewData = prepareSearchData(data);
    logInfo(`[searchItems] Pretraga prodavnice: "${q}" - pronađeno ${data.total || 0} rezultata`, {
      query: q,
      page: page,
      totalResults: data.total || 0,
      ip: req.ip,
    });
    return res.render("shop/search", {
      pageTitle: `Pretraga: ${q}`,
      pageDescription: `Rezultati pretrage za "${q}".`,
      data: viewData,
    });
  } catch (error) {
    logError(`[searchItems] Greška pri pretrazi prodavnice`, error, {
      query: req.query.q,
      page: req.query.page,
    });
    next(error);
  }
}

export async function cart(req, res, next) {
  try {
    const user = req.session?.user || null;
    const session = req.session;
    const cartData = await shopService.getCart({ user, session });
    const viewData = prepareCartData(cartData);
    return res.render("shop/cart", {
      pageTitle: "Korpa",
      pageDescription: "Pregled stavki u korpi",
      data: viewData,
    });
  } catch (error) {
    logError(`[cart] Greška pri učitavanju korpe`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function checkout(req, res, next) {
  try {
    const user = req.session?.user || null;
    const data = await shopService.getCheckoutData({ user, session: req.session });

    if (!data.cart?.items?.length) {
      return res.redirect("/prodavnica/korpa");
    }
 
    const viewData = prepareCheckoutData(data);
 
    viewData.prefillCoupon  = req.query.coupon || "";
    viewData.affiliateCode  = req.query.ref    || "";
 
    return res.render("shop/checkout", {
      pageTitle:       "Porudžbina",
      pageDescription: "Završite vašu kupovinu",
      data:            viewData,
      // csrfToken:       res.locals.csrfToken,
    });
  } catch (error) {
    next(error);
  }
}
export async function createOrder(req, res, next) {
  try {
    const user = req.session?.user || null;
    const session = req.session;

    if (req.validationErrors) {
      logWarn(`[createOrder] Validacione greške pri kreiranju porudžbine`, {
        validationErrors: req.validationErrors,
        userId: user?.id || 'guest',
        email: req.body.buyerInfo?.email,
      });
      const data = await shopService.getCheckoutData({ user, session });
      const viewData = prepareCheckoutData(data);
      viewData.errors = req.validationErrors;
      viewData.formData = req.body;
      viewData.messages = req.flash();

      return res.render("shop/checkout", {
        pageTitle: data.seo?.pageTitle || "Završetak kupovine",
        pageDescription: data.seo?.pageDescription || "",
        data: viewData,
      });
    }

    const result = await shopService.createCheckoutTemporaryOrder(req.body, {
      user,
      session,
    });

    // POSTAVI BROJ STAVKI U KORPI NA 0 za navigaciju
    res.locals.cartCount = 0;

    const viewData = prepareOrderCreatedData(result);
    viewData.email = req.body.buyerInfo?.email;

    logInfo(`[createOrder] Porudžbina kreirana (temporary)`, {
      orderId: result.id,
      email: req.body.buyerInfo?.email,
      totalPrice: result.totalPrice,
      userId: user?.id || 'guest',
    });

    return res.render("shop/order-created", {
      pageTitle: "Porudžbina kreirana",
      pageDescription: "Proverite email za verifikaciju",
      data: viewData,
    });
  } catch (error) {
    logError(`[createOrder] Greška pri kreiranju porudžbine`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      email: req.body.buyerInfo?.email,
      body: req.body,
    });
    if (error.statusCode === 400) {
      req.flash("error", error.message);
      return res.redirect("/prodavnica/checkout");
    }
    next(error);
  }
}

export async function confirmOrder(req, res, next) {
  try {
    const { token, orderId } = req.query;
 
    if (!token || !orderId) {
      return flashAndRedirect(
        req, res, "error",
        "Neispravan link za potvrdu porudžbine.",
        "/prodavnica"   // ← was "/"
      );
    }
 
    const result   = await shopService.confirmOrderByToken(token, orderId);
    const viewData = prepareOrderConfirmedData(result);
 
    return res.render("shop/order-confirmed", {
      pageTitle:       "Porudžbina potvrđena",
      pageDescription: "Vaša porudžbina je uspešno potvrđena",
      data:            viewData,
    });
  } catch (error) {
    // Operational errors (expired token, already confirmed, not found)
    if (error.isOperational) {
      return flashAndRedirect(
        req, res, "error",
        error.message,
        "/prodavnica"   // ← was "/"
      );
    }
    next(error);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const { token } = req.query;
    const user      = req.session?.user || null;
 
    if (!token) {
      const redirectTo = user ? "/profil/porudzbine" : "/prodavnica";
      return flashAndRedirect(
        req, res, "error",
        "Neispravan link za otkazivanje.",
        redirectTo
      );
    }
 
    await shopService.cancelOrder(token);
 
    const viewData = prepareOrderCancelledData();
    return res.render("shop/order-cancelled", {
      pageTitle:       "Porudžbina otkazana",
      pageDescription: "Vaša porudžbina je otkazana",
      data:            viewData,
    });
  } catch (error) {
    if (error.isOperational) {
      const user       = req.session?.user || null;
      const redirectTo = user ? "/profil/porudzbine" : "/prodavnica";
      return flashAndRedirect(
        req, res, "error",
        error.message,
        redirectTo   // ← was "/"
      );
    }
    next(error);
  }
}

export default {
  shopHome,
  featuredItems,
  actionedItems,
  allItems,
  itemDetails,
  categoryItems,
  tagItems,
  searchItems,
  cart,
  checkout,
  createOrder,
  confirmOrder,
  cancelOrder,
};