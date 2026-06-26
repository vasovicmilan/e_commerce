import * as adminService from "../../../services/admin.service.js";
import {
  prepareAdminDashboardData,
  prepareAdminDashboardSeo,
} from "../../../presenters/admin/admin.presenter.js";
import { logError, logInfo } from "../../../utils/logger.util.js";   // ← dodato

export async function dashboard(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    const data = prepareAdminDashboardData(stats);
    const seo = prepareAdminDashboardSeo();

    logInfo(`[dashboard] Admin dashboard uspešno učitana`, {
      userId: req.session?.user?.id || req.session?.user?._id,
      role: req.session?.user?.role || 'unknown',
    });

    return res.render("admin/dashboard", {
      pageTitle: seo.pageTitle,
      pageDescription: seo.pageDescription,
      data,
      seo,
    });
  } catch (error) {
    logError(`[dashboard] Greška pri učitavanju admin dashboard-a`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  dashboard,
};