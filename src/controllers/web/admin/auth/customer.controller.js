import * as customerService from "../../../../services/customer.service.js";
import {
  prepareCustomerListData,
  prepareCustomerDetailsData,
  prepareCustomerFormData,
} from "../../../../presenters/admin/customer.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";
import { flashAndRedirect } from "../../../../utils/flash.util.js";

export async function listCustomers(req, res, next) {
  try {
    const { search, city, hasOrders, page = 1, limit = 10 } = req.query;

    const result = await customerService.listCustomers({
      search: search || req.params.search,
      city: city || undefined,
      hasOrders: hasOrders === "true" ? true : hasOrders === "false" ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareCustomerListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Kupci",
      pageDescription: "Pregled svih kupaca",
      data: viewData,
    });
  } catch (error) {
    logError(`[listCustomers] Greška pri učitavanju liste kupaca`, error, {
      search: req.query.search,
      city: req.query.city,
      hasOrders: req.query.hasOrders,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function customerDetails(req, res, next) {
  try {
    const { customerId } = req.params;

    const customer = await customerService.getCustomerById(customerId);
    const viewData = prepareCustomerDetailsData(customer);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const formData = prepareCustomerFormData(customer);
      return res.render("admin/_form", {
        pageTitle: `Izmena - ${customer.osnovno.ime} ${customer.osnovno.prezime}`,
        pageDescription: customer.osnovno.email,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Kupac - ${customer.osnovno.ime} ${customer.osnovno.prezime}`,
      pageDescription: customer.osnovno.email,
      data: viewData,
    });
  } catch (error) {
    logError(`[customerDetails] Greška pri učitavanju detalja kupca`, error, {
      customerId: req.params.customerId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

// FIX M5: validation errors re-render with formData; business errors flash+redirect
export async function updateCustomer(req, res, next) {
  try {
    const { customerId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateCustomer] Validacione greške za customerId=${customerId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      const customer = await customerService.getCustomerById(customerId);
      const formData = prepareCustomerFormData(customer);

      return res.render("admin/_form", {
        pageTitle: `Izmena - ${customer.osnovno.ime} ${customer.osnovno.prezime}`,
        pageDescription: customer.osnovno.email,
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const data = {};
    if (req.body.email) data.email = req.body.email;
    if (req.body.firstName) data.firstName = req.body.firstName;
    if (req.body.lastName) data.lastName = req.body.lastName;
    if (req.body.acceptance !== undefined) {
      data.acceptance = req.body.acceptance === "true" || req.body.acceptance === true || req.body.acceptance === "1";
    }

    await customerService.updateCustomer(customerId, data);

    logInfo(`[updateCustomer] Kupac #${customerId} uspešno ažuriran`, {
      customerId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(
      req, res, "success",
      "Kupac je uspešno ažuriran",
      `/admin/kupci/detalji/${customerId}`
    );
  } catch (error) {
    logError(`[updateCustomer] Greška pri ažuriranju kupca`, error, {
      customerId: req.params.customerId,
      userId: req.session?.user?.id || req.session?.user?._id,
      body: req.body,
    });
    if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
      return flashAndRedirect(
        req, res, "error", error.message,
        `/admin/kupci/izmena/${req.params.customerId}`
      );
    }
    next(error);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const { customerId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteCustomer] Validacione greške za customerId=${customerId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      return flashAndRedirect(req, res, "error", "Neispravan ID kupca", "/admin/kupci");
    }

    await customerService.deleteCustomer(customerId);

    logInfo(`[deleteCustomer] Kupac #${customerId} uspešno obrisan`, {
      customerId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    return flashAndRedirect(req, res, "success", "Kupac je uspešno obrisan", "/admin/kupci");
  } catch (error) {
    logError(`[deleteCustomer] Greška pri brisanju kupca`, error, {
      customerId: req.params.customerId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    return flashAndRedirect(req, res, "error", error.message, "/admin/kupci");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/kupci");
    }

    return res.redirect(`/admin/kupci/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi kupaca`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listCustomers,
  customerDetails,
  updateCustomer,
  deleteCustomer,
  searchRedirect,
};