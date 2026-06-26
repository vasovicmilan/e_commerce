import * as tempOrderService from "../../../../services/temporary.order.service.js";
import * as orderService from "../../../../services/order.service.js";
import {
  prepareTempOrderListData,
  prepareTempOrderDetailsData,
} from "../../../../presenters/admin/temporary-order.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";   // ← dodato logInfo

export async function listTemporaryOrders(req, res, next) {
  try {
    const { search, buyerModel, page = 1, limit = 10 } = req.query;

    const result = await tempOrderService.listTemporaryOrders({
      search: search || req.params.search,
      buyerModel: buyerModel || undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareTempOrderListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Privremene porudžbine",
      pageDescription: "Pregled svih privremenih porudžbina",
      data: viewData,
    });
  } catch (error) {
    logError(`[listTemporaryOrders] Greška pri učitavanju liste`, error, {
      search: req.query.search,
      buyerModel: req.query.buyerModel,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function temporaryOrderDetails(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await tempOrderService.getTemporaryOrderById(orderId);
    const viewData = prepareTempOrderDetailsData(order);
    viewData.csrfToken = req.csrfToken ? req.csrfToken() : null;

    return res.render("admin/_details", {
      pageTitle: `Privremena porudžbina #${order.id.slice(-6)}`,
      pageDescription: `${order.kupac.ime} ${order.kupac.prezime} - ${order.finansije.ukupno} RSD`,
      data: viewData,
    });
  } catch (error) {
    logError(`[temporaryOrderDetails] Greška pri učitavanju detalja`, error, {
      orderId: req.params.orderId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function confirmOrder(req, res, next) {
  try {
    const { orderId } = req.params;

    if (req.validationErrors) {
      logWarn(`[confirmOrder] Validacione greške za orderId=${orderId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/privremene-porudzbine/detalji/${orderId}`);
    }

    // Admin potvrđuje bez unosa tokena - token se dohvata u orderService.confirmOrderByAdmin
    const result = await orderService.confirmOrderByAdmin(null, orderId);

    // ✅ Dodato logInfo za uspešnu potvrdu
    logInfo(`[confirmOrder] Privremena porudžbina #${orderId} uspešno potvrđena, kreirana porudžbina #${result.id}`, {
      temporaryOrderId: orderId,
      orderId: result.id,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Porudžbina je uspešno potvrđena");
    return res.redirect(`/admin/porudzbine/detalji/${result.id}`);
  } catch (error) {
    logError(`[confirmOrder] Greška pri potvrđivanju porudžbine`, error, {
      orderId: req.params.orderId,
      userId: req.session?.user?.id || req.session?.user?._id,
      body: req.body,
    });
    req.flash("error", error.message);
    return res.redirect(`/admin/privremene-porudzbine/detalji/${req.params.orderId}`);
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/privremene-porudzbine");
    }

    return res.redirect(`/admin/privremene-porudzbine/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listTemporaryOrders,
  temporaryOrderDetails,
  confirmOrder,
  searchRedirect,
};