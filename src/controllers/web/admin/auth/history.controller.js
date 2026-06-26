import * as historyService from "../../../../services/history.service.js";
import {
  prepareHistoryListData,
  prepareHistoryDetailsData,
} from "../../../../presenters/admin/history.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";

export async function listHistory(req, res, next) {
  try {
    const {
      search,
      partnerId,
      type,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
    } = req.query;

    const result = await historyService.listHistory({
      search: search || req.params.search,
      partnerId: partnerId || undefined,
      type: type || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      minAmount: minAmount !== undefined && minAmount !== "" ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount !== undefined && maxAmount !== "" ? parseFloat(maxAmount) : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareHistoryListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Istorija partnera",
      pageDescription: "Pregled svih transakcija i aktivnosti partnera",
      data: viewData,
    });
  } catch (error) {
    logError(`[listHistory] Greška pri učitavanju liste istorije`, error, {
      search: req.query.search,
      partnerId: req.query.partnerId,
      type: req.query.type,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function historyDetails(req, res, next) {
  try {
    const { historyId } = req.params;

    const history = await historyService.getHistoryById(historyId);
    const viewData = prepareHistoryDetailsData(history);

    return res.render("admin/_details", {
      pageTitle: `Istorija - ${history.partner.name}`,
      pageDescription: history.type,
      data: viewData,
    });
  } catch (error) {
    logError(`[historyDetails] Greška pri učitavanju detalja istorije`, error, {
      historyId: req.params.historyId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function deleteHistory(req, res, next) {
  try {
    const { historyId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteHistory] Validacione greške za historyId=${historyId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", "Neispravan ID");
      return res.redirect("/admin/istorija");
    }

    await historyService.deleteHistory(historyId);

    logInfo(`[deleteHistory] Unos istorije #${historyId} uspešno obrisan`, {
      historyId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Unos istorije je uspešno obrisan");
    return res.redirect("/admin/istorija");
  } catch (error) {
    logError(`[deleteHistory] Greška pri brisanju unosa istorije`, error, {
      historyId: req.params.historyId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/admin/istorija");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/istorija");
    }

    return res.redirect(`/admin/istorija/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi istorije`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listHistory,
  historyDetails,
  deleteHistory,
  searchRedirect,
};