import * as userService from "../../../services/user.service.js";
import * as orderService from "../../../services/order.service.js";
import * as authService from "../../../services/auth.service.js";
import {
  prepareProfileData,
  prepareProfileDataWithErrors,
  prepareOrdersData,
  prepareOrderDetailsData,
  prepareShopData,
  prepareSettingsData,
  prepareSettingsDataWithErrors,
} from "../../../presenters/user/user.presenter.js";
import { logError, logWarn, logInfo } from "../../../utils/logger.util.js";

// ============================================================
//  GLAVNI PROFIL – svi tabovi
// ============================================================

export async function profile(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { tab = 'profile' } = req.query;
    const user = await userService.getMyProfile(userId);

    const viewData = prepareProfileData(user);
    viewData.activeTab = tab;

    if (tab === 'orders') {
      const { page = 1 } = req.query;
      const result = await orderService.getClientOrders(userId, {
        page: parseInt(page, 10) || 1,
      });
      viewData.ordersData = prepareOrdersData(result);
    } else if (tab === 'settings') {
      viewData.settingsData = prepareSettingsData(user);
    } else if (tab === 'wishlist') {
      const { page = 1 } = req.query;
      const result = await userService.getUserWishlist(userId, {
        page: parseInt(page, 10) || 1,
      });
      viewData.wishlistData = {
        items: result.data || [],
        pagination: {
          currentPage: result.page || 1,
          totalPages: result.totalPages || 1,
          total: result.total || 0,
        },
      };
    } else if (tab === 'shop') {
      const shop = await userService.getMyShop(userId);
      viewData.shopData = prepareShopData(shop);
    }

    const titles = {
      profile: 'Moj profil',
      orders: 'Moje porudžbine',
      wishlist: 'Lista želja',
      shop: 'Moja prodavnica',
      settings: 'Podešavanja naloga',
    };
    const pageTitle = titles[tab] || 'Moj profil';

    return res.render("user/profile", {
      pageTitle,
      pageDescription: "Upravljanje vašim profilom",
      data: viewData,
    });
  } catch (error) {
    logError(`[profile] Greška pri učitavanju profila`, error, { userId: req.session?.user?.id });
    next(error);
  }
}

// ============================================================
//  AKCIJE (POST / PUT / DELETE)
// ============================================================

export async function updateProfile(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;

    if (req.validationErrors) {
      logWarn(`[updateProfile] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId,
      });
      const user = await userService.getMyProfile(userId);
      const viewData = prepareProfileDataWithErrors(user, req.validationErrors, req.body);
      viewData.csrfToken = req.csrfToken ? req.csrfToken() : '';
      viewData.activeTab = 'profile';

      return res.render("user/profile", {
        pageTitle: "Moj profil",
        pageDescription: "Upravljanje vašim profilom",
        data: viewData,
      });
    }

    await userService.updateUser(userId, req.body, userId);

    logInfo(`[updateProfile] Profil korisnika #${userId} uspešno ažuriran`, { userId });

    req.flash("success", "Profil je uspešno ažuriran");
    return res.redirect("/profil/moj-profil?tab=profile");
  } catch (error) {
    logError(`[updateProfile] Greška pri ažuriranju profila`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      body: req.body,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil?tab=profile");
  }
}

export async function addTelephone(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { telephone } = req.body;

    if (!telephone) {
      logWarn(`[addTelephone] Telefon nije prosleđen za userId=${userId}`, { userId });
      req.flash("error", "Telefon je obavezan");
      return res.redirect("/profil/moj-profil?tab=profile");
    }

    await userService.addTelephoneToUser(userId, telephone);

    logInfo(`[addTelephone] Telefon dodat korisniku #${userId}`, {
      userId,
      telephone: telephone.substring(0, 4) + '***',
    });

    req.flash("success", "Telefon je uspešno dodat");
    return res.redirect("/profil/moj-profil?tab=profile");
  } catch (error) {
    logError(`[addTelephone] Greška pri dodavanju telefona`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil?tab=profile");
  }
}

export async function removeTelephone(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { telephoneId } = req.params;

    await userService.removeTelephoneFromUser(userId, telephoneId);

    logInfo(`[removeTelephone] Telefon uklonjen za korisnika #${userId}`, {
      userId,
      telephoneId,
    });

    req.flash("success", "Telefon je uspešno uklonjen");
    return res.redirect("/profil/moj-profil?tab=profile");
  } catch (error) {
    logError(`[removeTelephone] Greška pri uklanjanju telefona`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      telephoneId: req.params.telephoneId,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil?tab=profile");
  }
}

export async function addAddress(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { city, street, number, postalCode } = req.body;

    if (!city || !street || !number || !postalCode) {
      logWarn(`[addAddress] Nedostaju polja adrese za userId=${userId}`, {
        userId,
        body: req.body,
      });
      req.flash("error", "Sva polja adrese su obavezna");
      return res.redirect("/profil/moj-profil?tab=profile");
    }

    await userService.addAddressToUser(userId, { city, street, number, postalCode });

    logInfo(`[addAddress] Adresa dodata korisniku #${userId}`, {
      userId,
      city,
      postalCode,
    });

    req.flash("success", "Adresa je uspešno dodata");
    return res.redirect("/profil/moj-profil?tab=profile");
  } catch (error) {
    logError(`[addAddress] Greška pri dodavanju adrese`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      body: req.body,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil?tab=profile");
  }
}

export async function removeAddress(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { addressId } = req.params;

    await userService.removeAddressFromUser(userId, addressId);

    logInfo(`[removeAddress] Adresa uklonjena za korisnika #${userId}`, {
      userId,
      addressId,
    });

    req.flash("success", "Adresa je uspešno uklonjena");
    return res.redirect("/profil/moj-profil?tab=profile");
  } catch (error) {
    logError(`[removeAddress] Greška pri uklanjanju adrese`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      addressId: req.params.addressId,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil?tab=profile");
  }
}

// ============================================================
//  PORUDŽBINE – detalji i otkazivanje
// ============================================================

export async function orderDetails(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { orderId } = req.params;

    const order = await orderService.getClientOrderById(orderId, userId);
    const viewData = prepareOrderDetailsData(order);

    return res.render("user/order-details", {
      pageTitle: `Porudžbina #${orderId.slice(-6)}`,
      pageDescription: "Detalji vaše porudžbine",
      data: viewData,
    });
  } catch (error) {
    logError(`[orderDetails] Greška pri učitavanju detalja porudžbine`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      orderId: req.params.orderId,
    });
    next(error);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { orderId } = req.params;

    await orderService.cancelOrderByClient(orderId, userId);

    logInfo(`[cancelOrder] Porudžbina #${orderId} otkazana od strane korisnika #${userId}`, {
      userId,
      orderId,
    });

    req.flash("success", "Porudžbina je uspešno otkazana");
    return res.redirect("/profil/porudzbine?tab=orders");
  } catch (error) {
    logError(`[cancelOrder] Greška pri otkazivanju porudžbine`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      orderId: req.params.orderId,
    });
    req.flash("error", error.message);
    return res.redirect(`/profil/porudzbine/${req.params.orderId}`);
  }
}

// ============================================================
//  PODEŠAVANJA – lozinka i deaktivacija
// ============================================================

export async function settings(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const user = await userService.getMyProfile(userId);
    const viewData = prepareSettingsData(user);
    viewData.csrfToken = req.csrfToken ? req.csrfToken() : '';
    viewData.activeTab = 'settings';

    return res.render("user/profile", {
      pageTitle: "Podešavanja naloga",
      pageDescription: "Promena lozinke i podešavanja naloga",
      data: viewData,
    });
  } catch (error) {
    logError(`[settings] Greška pri učitavanju podešavanja`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const user = await userService.getMyProfile(userId);

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (req.validationErrors) {
      logWarn(`[changePassword] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId,
      });
      const viewData = prepareSettingsDataWithErrors(user, req.validationErrors, req.body);
      viewData.csrfToken = req.csrfToken ? req.csrfToken() : '';
      viewData.activeTab = 'settings';

      return res.render("user/profile", {
        pageTitle: "Podešavanja naloga",
        pageDescription: "Promena lozinke i podešavanja naloga",
        data: viewData,
      });
    }

    await authService.changePassword(userId, oldPassword, newPassword, confirmPassword);

    logInfo(`[changePassword] Lozinka uspešno promenjena za korisnika #${userId}`, { userId });

    req.flash("success", "Lozinka je uspešno promenjena");
    return res.redirect("/profil/podesavanja?tab=settings");
  } catch (error) {
    logError(`[changePassword] Greška pri promeni lozinke`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });

    try {
      const userId = req.session?.user?.id || req.session?.user?._id;
      const user = await userService.getMyProfile(userId);
      const viewData = prepareSettingsDataWithErrors(user, { general: error.message }, req.body);
      viewData.csrfToken = req.csrfToken ? req.csrfToken() : '';
      viewData.activeTab = 'settings';

      return res.render("user/profile", {
        pageTitle: "Podešavanja naloga",
        pageDescription: "Promena lozinke i podešavanja naloga",
        data: viewData,
      });
    } catch (renderError) {
      logError(`[changePassword] Greška pri renderovanju strane sa greškom`, renderError, {
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", error.message);
      return res.redirect("/profil/podesavanja?tab=settings");
    }
  }
}

export async function deactivateAccount(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const user = await userService.getMyProfile(userId);
    const { password } = req.body;

    if (!password) {
      logWarn(`[deactivateAccount] Lozinka nije prosleđena za deaktivaciju userId=${userId}`, { userId });
      req.flash("error", "Lozinka je obavezna za deaktivaciju");
      return res.redirect("/profil/podesavanja?tab=settings");
    }

    await authService.deactivateAccount(userId, password);

    logInfo(`[deactivateAccount] Nalog #${userId} deaktiviran`, { userId });

    req.session.destroy((err) => {
      if (err) {
        logError(`[deactivateAccount] Greška pri uništavanju sesije nakon deaktivacije`, err, { userId });
      }
    });
    res.clearCookie("sid_tophelanke");
    res.clearCookie("tophelanke.sid");

    return res.redirect("/");
  } catch (error) {
    logError(`[deactivateAccount] Greška pri deaktivaciji naloga`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });

    try {
      const userId = req.session?.user?.id || req.session?.user?._id;
      const user = await userService.getMyProfile(userId);
      const viewData = prepareSettingsDataWithErrors(user, { general: error.message }, req.body);
      viewData.csrfToken = req.csrfToken ? req.csrfToken() : '';
      viewData.activeTab = 'settings';

      return res.render("user/profile", {
        pageTitle: "Podešavanja naloga",
        pageDescription: "Promena lozinke i podešavanja naloga",
        data: viewData,
      });
    } catch (renderError) {
      logError(`[deactivateAccount] Greška pri renderovanju strane sa greškom`, renderError, {
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", error.message);
      return res.redirect("/profil/podesavanja?tab=settings");
    }
  }
}

// ============================================================
//  LISTA ŽELJA – uklanjanje
// ============================================================

export async function removeFromWishlist(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { itemId } = req.params;

    await userService.removeFromWishlist(userId, itemId);

    logInfo(`[removeFromWishlist] Artikal #${itemId} uklonjen iz liste želja korisnika #${userId}`, {
      userId,
      itemId,
    });

    req.flash("success", "Artikal je uklonjen iz liste želja.");
    return res.redirect("/profil/zelje?tab=wishlist");
  } catch (error) {
    logError(`[removeFromWishlist] Greška pri uklanjanju iz liste želja`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      itemId: req.params.itemId,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/zelje?tab=wishlist");
  }
}

// ============================================================
//  DEFAULT EXPORT
// ============================================================

export default {
  profile,
  updateProfile,
  addTelephone,
  removeTelephone,
  addAddress,
  removeAddress,
  orderDetails,
  cancelOrder,
  settings,
  changePassword,
  deactivateAccount,
  removeFromWishlist,
};