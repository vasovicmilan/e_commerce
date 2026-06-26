// TODO: Add functions for admin to be able to change roles of users (2026-06-17)

import * as userService from "../../../../services/user.service.js";
import * as roleService from "../../../../services/role.service.js";

import {
  prepareUserListData,
  prepareUserDetailsData,
  prepareUserFormData,
} from "../../../../presenters/admin/user.presenter.js";
import { badRequest } from "../../../../utils/error.util.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";   // ← dodato

export async function listUsers(req, res, next) {
  try {
    const { search, role, status, provider, isPartner, page = 1, limit = 10 } = req.query;
    const currentUserId = req.session?.user?.id || req.session?.user?._id;

    const result = await userService.listUsers({
      search: search || req.params.search,
      role: role || undefined,
      status: status || undefined,
      provider: provider || undefined,
      isPartner: isPartner === "true" ? true : isPartner === "false" ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      excludeUserId: currentUserId,
    });

    const viewData = prepareUserListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Korisnici",
      pageDescription: "Pregled svih korisnika",
      data: viewData,
    });
  } catch (error) {
    logError(`[listUsers] Greška pri učitavanju liste korisnika`, error, {
      search: req.query.search,
      role: req.query.role,
      status: req.query.status,
      provider: req.query.provider,
      isPartner: req.query.isPartner,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function userDetails(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await userService.getUserById(userId);
    const roles = await roleService.getRolesForSelect();
    const viewData = prepareUserDetailsData(user, roles);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const formData = prepareUserFormData(user);
      return res.render("admin/_form", {
        pageTitle: `Izmena - ${user.osnovno.ime} ${user.osnovno.prezime}`,
        pageDescription: user.osnovno.email,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Korisnik - ${user.osnovno.ime} ${user.osnovno.prezime}`,
      pageDescription: user.osnovno.email,
      data: viewData,
    });
  } catch (error) {
    logError(`[userDetails] Greška pri učitavanju detalja korisnika`, error, {
      userId: req.params.userId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.user?.id || req.session?.user?._id;

    if (req.validationErrors) {
      logWarn(`[updateUser] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      const user = await userService.getUserById(userId);
      const formData = prepareUserFormData(user);

      return res.render("admin/_form", {
        pageTitle: `Izmena - ${user.osnovno.ime} ${user.osnovno.prezime}`,
        pageDescription: user.osnovno.email,
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

    await userService.updateUser(userId, data, currentUserId);

    logInfo(`[updateUser] Korisnik #${userId} uspešno ažuriran`, {
      userId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Korisnik je uspešno ažuriran");
    return res.redirect(`/admin/korisnici/detalji/${userId}`);
  } catch (error) {
    logError(`[updateUser] Greška pri ažuriranju korisnika`, error, {
      userId: req.params.userId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
      req.flash("error", error.message);
      return res.redirect(`/admin/korisnici/izmena/${req.params.userId}`);
    }
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.user?.id || req.session?.user?._id;
    const { status } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateUserStatus] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/korisnici/detalji/${userId}`);
    }

    await userService.updateUserStatus(userId, status, currentUserId);

    logInfo(`[updateUserStatus] Status korisnika #${userId} promenjen na "${status}"`, {
      userId,
      newStatus: status,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Status korisnika je uspešno promenjen");
    return res.redirect(`/admin/korisnici/detalji/${userId}`);
  } catch (error) {
    logError(`[updateUserStatus] Greška pri promeni statusa korisnika`, error, {
      userId: req.params.userId,
      requestedStatus: req.body.status,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
      req.flash("error", error.message);
      return res.redirect(`/admin/korisnici/detalji/${req.params.userId}`);
    }
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.user?.id || req.session?.user?._id;
    const { role } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateUserRole] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/korisnici/detalji/${userId}`);
    }

    await userService.updateUserRole(userId, role, currentUserId);

    logInfo(`[updateUserRole] Rola korisnika #${userId} promenjena na "${role}"`, {
      userId,
      newRole: role,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Rola korisnika je uspešno promenjena");
    return res.redirect(`/admin/korisnici/detalji/${userId}`);
  } catch (error) {
    logError(`[updateUserRole] Greška pri promeni role korisnika`, error, {
      userId: req.params.userId,
      requestedRole: req.body.role,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
      req.flash("error", error.message);
      return res.redirect(`/admin/korisnici/detalji/${req.params.userId}`);
    }
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.user?.id || req.session?.user?._id;

    if (req.validationErrors) {
      logWarn(`[deleteUser] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", "Neispravan ID korisnika");
      return res.redirect("/admin/korisnici");
    }

    await userService.deleteUser(userId, currentUserId);

    logInfo(`[deleteUser] Korisnik #${userId} uspešno obrisan`, {
      userId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Korisnik je uspešno obrisan");
    return res.redirect("/admin/korisnici");
  } catch (error) {
    logError(`[deleteUser] Greška pri brisanju korisnika`, error, {
      userId: req.params.userId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/admin/korisnici");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/korisnici");
    }

    return res.redirect(`/admin/korisnici/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi korisnika`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function verifyUser(req, res, next) {
  try {
    const { userId } = req.params;

    const result = await userService.verifyUserByAdmin(userId);

    logInfo(`[verifyUser] Korisnik #${userId} verifikovan od strane admina`, {
      userId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    if (result.verified) {
      req.flash("success", result.message);
    } else {
      req.flash("info", result.message);
    }

    return res.redirect(`/admin/korisnici/detalji/${userId}`);
  } catch (error) {
    logError(`[verifyUser] Greška pri verifikaciji korisnika`, error, {
      userId: req.params.userId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect(`/admin/korisnici/detalji/${req.params.userId}`);
  }
}

export async function updateUserPartner(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.user?.id || req.session?.user?._id;
    const { isPartner } = req.body;

    if (req.validationErrors) {
      logWarn(`[updateUserPartner] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", Object.values(req.validationErrors).join(", "));
      return res.redirect(`/admin/korisnici/detalji/${userId}`);
    }

    const partnerStatus = isPartner === "true" || isPartner === true || isPartner === "1";

    await userService.updateUserPartner(userId, partnerStatus, currentUserId);

    logInfo(`[updateUserPartner] Partnerstvo za korisnika #${userId} ${partnerStatus ? 'aktiviran' : 'deaktiviran'}o`, {
      userId,
      partnerStatus,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", `Partnerstvo je uspešno ${partnerStatus ? 'aktiviran' : 'deaktiviran'}o`);
    return res.redirect(`/admin/korisnici/detalji/${userId}`);
  } catch (error) {
    logError(`[updateUserPartner] Greška pri ažuriranju partnerstva`, error, {
      userId: req.params.userId,
      isPartner: req.body.isPartner,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
      req.flash("error", error.message);
      return res.redirect(`/admin/korisnici/detalji/${req.params.userId}`);
    }
    next(error);
  }
}

export async function editPartnerForm(req, res, next) {
  try {
    const { userId } = req.params;
    // KORISTIMO SERVICE umesto direktnog repo poziva
    const rawUser = await userService.getUserRawById(userId);

    if (!rawUser.partner?.isPartner) {
      req.flash("error", "Korisnik nije partner");
      return res.redirect(`/admin/korisnici/detalji/${userId}`);
    }

    let logoUrl = rawUser.partner.shop?.logo || '';
    if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('/')) {
      logoUrl = `/images/partners/${logoUrl}`;
    }

    const partnerData = {
      userId: rawUser._id.toString(),
      shopStatus: rawUser.partner.shop?.status || false,
      logo: logoUrl,
      slug: rawUser.partner.slug || '',
      wallet: rawUser.partner.wallet || 0,
      level: rawUser.partner.rank?.level || 0,
      points: rawUser.partner.rank?.points || 0,
      discount: rawUser.partner.rank?.discount || 0,
      maxOffers: rawUser.partner.rank?.maxOffers || 1,
      colorsJson: JSON.stringify(rawUser.partner.shop?.colors || []),
      fontsJson: JSON.stringify(rawUser.partner.shop?.fonts || []),
    };

    return res.render("admin/_partner_form", {
      pageTitle: `Uredi partnerstvo - ${rawUser.firstName} ${rawUser.lastName}`,
      pageDescription: rawUser.email,
      data: {
        ...partnerData,
        formAction: `/admin/korisnici/${userId}/partner/data`,
        cancelUrl: `/admin/korisnici/detalji/${userId}`,
        // csrfToken: req.csrfToken ? req.csrfToken() : '',
      },
    });
  } catch (error) {
    logError(`[editPartnerForm] Greška pri prikazu forme za uređivanje partnera`, error, {
      userId: req.params.userId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function updatePartnerData(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.user?.id || req.session?.user?._id;

    // Parsiranje boja i fontova iz JSON stringa
    let colors = [];
    let fonts = [];
    try {
      if (req.body.colors) colors = JSON.parse(req.body.colors);
      if (req.body.fonts) fonts = JSON.parse(req.body.fonts);
    } catch (e) {
      throw badRequest("Neispravan JSON format za boje ili fontove");
    }

    // Priprema podataka
    const data = {
      "partner.shop.status": req.body.shopStatus === "true" || req.body.shopStatus === true || req.body.shopStatus === "1",
      "partner.rank.level": parseInt(req.body.level, 10) || 0,
      "partner.rank.points": parseInt(req.body.points, 10) || 0,
      "partner.rank.discount": parseInt(req.body.discount, 10) || 0,
      "partner.rank.maxOffers": parseInt(req.body.maxOffers, 10) || 1,
      "partner.shop.colors": colors,
      "partner.shop.fonts": fonts,
    };

    // ===== OBRADA SLUGA =====
    if (req.body.slug && req.body.slug.trim() !== '') {
      const sanitized = req.body.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      if (!sanitized) {
        throw badRequest("Slug sadrži nedozvoljene karaktere");
      }
      // Provera dostupnosti preko service-a
      const availability = await userService.checkSlugAvailability(sanitized, userId);
      if (!availability.available) {
        throw badRequest(availability.message);
      }
      data["partner.slug"] = availability.slug;
    } else {
      throw badRequest("Slug je obavezan za partnera");
    }

    // ===== OBRADA LOGOA =====
    if (req.uploadedFile && req.uploadedFile.img) {
      data["partner.shop.logo"] = `/images/partners/${req.uploadedFile.img}`;
    } else if (req.body.logo && req.body.logo.trim() !== '') {
      data["partner.shop.logo"] = req.body.logo.trim();
    }

    await userService.updatePartnerData(userId, data, currentUserId);

    logInfo(`[updatePartnerData] Partner podaci za korisnika #${userId} uspešno ažurirani`, {
      userId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Partner podaci su uspešno ažurirani");
    return res.redirect(`/admin/korisnici/detalji/${userId}`);
  } catch (error) {
    logError(`[updatePartnerData] Greška pri ažuriranju partner podataka`, error, {
      userId: req.params.userId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404 || error.statusCode === 409) {
      req.flash("error", error.message);
      return res.redirect(`/admin/korisnici/${userId}/partner/edit`);
    }
    next(error);
  }
}

export default {
  listUsers,
  userDetails,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  searchRedirect,
  verifyUser,
  updateUserPartner,
  editPartnerForm,
  updatePartnerData,
};