import * as contactService from "../../../services/contact.service.js";
import {
  prepareContactListData,
  prepareContactDetailsData,
} from "../../../presenters/admin/contact.presenter.js";
import { logError, logWarn, logInfo } from "../../../utils/logger.util.js";   // ← dodato

export async function listContacts(req, res, next) {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const result = await contactService.listContacts({
      search: search || req.params.search,
      status: status || undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareContactListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Poruke",
      pageDescription: "Pregled svih kontakt poruka",
      data: viewData,
    });
  } catch (error) {
    logError(`[listContacts] Greška pri učitavanju liste poruka`, error, {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function contactDetails(req, res, next) {
  try {
    const { contactId } = req.params;

    const contact = await contactService.getContactById(contactId);

    if (contact.osnovno.statusRaw === "new") {
      await contactService.updateContactStatus(contactId, "read");
      logInfo(`[contactDetails] Poruka #${contactId} automatski označena kao pročitana`, {
        contactId,
        adminId: req.session?.user?.id || req.session?.user?._id,
      });
      contact.osnovno.status = "Pročitan";
      contact.osnovno.statusRaw = "read";
    }

    const viewData = prepareContactDetailsData(contact);

    return res.render("admin/_details", {
      pageTitle: `Poruka - ${contact.osnovno.naslov}`,
      pageDescription: `Od: ${contact.osnovno.ime} - ${contact.osnovno.email}`,
      data: viewData,
    });
  } catch (error) {
    logError(`[contactDetails] Greška pri učitavanju detalja poruke`, error, {
      contactId: req.params.contactId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { contactId } = req.params;
    const { status } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateStatus] Validacione greške za contactId=${contactId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/kontakt/detalji/${contactId}`);
    }

    await contactService.updateContactStatus(contactId, status);

    logInfo(`[updateStatus] Status poruke #${contactId} promenjen na "${status}"`, {
      contactId,
      newStatus: status,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Status poruke je uspešno promenjen");
    return res.redirect(`/admin/kontakt/detalji/${contactId}`);
  } catch (error) {
    logError(`[updateStatus] Greška pri promeni statusa poruke`, error, {
      contactId: req.params.contactId,
      requestedStatus: req.body.status,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect(`/admin/kontakt/detalji/${req.params.contactId}`);
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/kontakt");
    }

    return res.redirect(`/admin/kontakt/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi poruka`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listContacts,
  contactDetails,
  updateStatus,
  searchRedirect,
};