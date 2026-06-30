import * as orderService from "../../../../services/order.service.js";
import { getAllowedStatuses } from "../../../../models/order-status-transitions.js";
import { prepareOrderListData, prepareOrderDetailsData } from "../../../../presenters/admin/order.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";
import { flashAndRedirect } from "../../../../utils/flash.util.js";

export async function listOrders(req, res, next) {
  try {
    const { search, status, city, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    const result = await orderService.listOrders({
      search: search || req.params.search,
      status: status || undefined,
      city: city || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareOrderListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Porudžbine",
      pageDescription: "Pregled svih porudžbina",
      data: viewData,
    });
  } catch (error) {
    logError(`[listOrders] Greška pri učitavanju liste porudžbina`, error, {
      search: req.query.search,
      status: req.query.status,
      city: req.query.city,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function orderDetails(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await orderService.getOrderById(orderId);
    const allowedStatuses = getAllowedStatuses(order.status.trenutniRaw);
    const viewData = prepareOrderDetailsData(order, allowedStatuses);

    return res.render("admin/_details", {
      pageTitle: `Porudžbina #${order.id.slice(-6)}`,
      pageDescription: `${order.kupac.ime} ${order.kupac.prezime} - ${order.finansije.ukupno} RSD`,
      data: viewData,
    });
  } catch (error) {
    logError(`[orderDetails] Greška pri učitavanju detalja porudžbine`, error, {
      orderId: req.params.orderId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateStatus] Validacione greške za orderId=${orderId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        `/admin/porudzbine/detalji/${orderId}`
      );
    }

    await orderService.updateOrderStatusByAdmin(orderId, status);

    logInfo(`[updateStatus] Status porudžbine #${orderId} uspešno promenjen na "${status}"`, {
      orderId,
      newStatus: status,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Status porudžbine je uspešno promenjen",
      `/admin/porudzbine/detalji/${orderId}`
    );
  } catch (error) {
    logError(`[updateStatus] Greška pri promeni statusa porudžbine`, error, {
      orderId: req.params.orderId,
      requestedStatus: req.body.status,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/porudzbine/detalji/${req.params.orderId}`
    );
  }
}

export async function updateContactInfo(req, res, next) {
  try {
    const { orderId } = req.params;
    const { telephone, address } = req.body;

    await orderService.updateOrderContactInfo(orderId, { telephone, address });

    logInfo(`[updateContactInfo] Kontakt info za porudžbinu #${orderId} uspešno ažuriran`, {
      orderId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Kontakt informacije su uspešno ažurirane",
      `/admin/porudzbine/detalji/${orderId}`
    );
  } catch (error) {
    logError(`[updateContactInfo] Greška pri ažuriranju kontakt info`, error, {
      orderId: req.params.orderId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(
      req, res, "error", error.message,
      `/admin/porudzbine/detalji/${req.params.orderId}`
    );
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/porudzbine");
    }

    return res.redirect(`/admin/porudzbine/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi porudžbina`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listOrders,
  orderDetails,
  updateStatus,
  updateContactInfo,
  searchRedirect,
};