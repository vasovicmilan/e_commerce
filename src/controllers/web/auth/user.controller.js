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

export async function myProfile(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const user = await userService.getMyProfile(userId);

    console.log("USER: " + JSON.stringify(user));
    const viewData = prepareProfileData(user);
    console.log("PRESENTER: " + JSON.stringify(viewData));
    viewData.messages = req.flash();

    return res.render("user/profile", {
      pageTitle: "Moj profil",
      pageDescription: "Pregled i upravljanje vašim profilom",
      data: viewData,
    });
  } catch (error) {
    logError(`[myProfile] Greška pri učitavanju profila`, error, { userId: req.session?.user?.id });
    next(error);
  }
}

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

      return res.render("user/profile", {
        pageTitle: "Moj profil",
        pageDescription: "Pregled i upravljanje vašim profilom",
        data: viewData,
      });
    }

    await userService.updateUser(userId, req.body, userId);

    logInfo(`[updateProfile] Profil korisnika #${userId} uspešno ažuriran`, {
      userId,
    });

    req.flash("success", "Profil je uspešno ažuriran");
    return res.redirect("/profil/moj-profil");
  } catch (error) {
    logError(`[updateProfile] Greška pri ažuriranju profila`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      body: req.body,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil");
  }
}

export async function addTelephone(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { telephone } = req.body;

    if (!telephone) {
      logWarn(`[addTelephone] Telefon nije prosleđen za userId=${userId}`, { userId });
      req.flash("error", "Telefon je obavezan");
      return res.redirect("/profil/moj-profil");
    }

    await userService.addTelephoneToUser(userId, telephone);

    logInfo(`[addTelephone] Telefon dodat korisniku #${userId}`, {
      userId,
      telephone: telephone.substring(0, 4) + '***', // bez potpunog broja zbog sigurnosti
    });

    req.flash("success", "Telefon je uspešno dodat");
    return res.redirect("/profil/moj-profil");
  } catch (error) {
    logError(`[addTelephone] Greška pri dodavanju telefona`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil");
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
    return res.redirect("/profil/moj-profil");
  } catch (error) {
    logError(`[removeTelephone] Greška pri uklanjanju telefona`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      telephoneId: req.params.telephoneId,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil");
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
      return res.redirect("/profil/moj-profil");
    }

    await userService.addAddressToUser(userId, { city, street, number, postalCode });

    logInfo(`[addAddress] Adresa dodata korisniku #${userId}`, {
      userId,
      city,
      postalCode,
    });

    req.flash("success", "Adresa je uspešno dodata");
    return res.redirect("/profil/moj-profil");
  } catch (error) {
    logError(`[addAddress] Greška pri dodavanju adrese`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      body: req.body,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil");
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
    return res.redirect("/profil/moj-profil");
  } catch (error) {
    logError(`[removeAddress] Greška pri uklanjanju adrese`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      addressId: req.params.addressId,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/moj-profil");
  }
}

export async function myOrders(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { page = 1 } = req.query;

    const result = await orderService.getClientOrders(userId, {
      page: parseInt(page, 10) || 1,
    });

    const viewData = prepareOrdersData(result);

    return res.render("user/orders", {
      pageTitle: "Moje porudžbine",
      pageDescription: "Pregled svih vaših porudžbina",
      data: viewData,
    });
  } catch (error) {
    logError(`[myOrders] Greška pri učitavanju porudžbina korisnika`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      page: req.query.page,
    });
    next(error);
  }
}

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
    return res.redirect("/profil/porudzbine");
  } catch (error) {
    logError(`[cancelOrder] Greška pri otkazivanju porudžbine`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
      orderId: req.params.orderId,
    });
    req.flash("error", error.message);
    return res.redirect(`/profil/porudzbine/${req.params.orderId}`);
  }
}

export async function myShop(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const shop = await userService.getMyShop(userId);
    const viewData = prepareShopData(shop);

    return res.render("user/shop", {
      pageTitle: "Moja prodavnica",
      pageDescription: "Upravljanje partnerskom prodavnicom",
      data: viewData,
    });
  } catch (error) {
    logError(`[myShop] Greška pri učitavanju partnerske prodavnice`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function settings(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const user = await userService.getMyProfile(userId);
    const viewData = prepareSettingsData(user);

    return res.render("user/settings", {
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
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (req.validationErrors) {
      logWarn(`[changePassword] Validacione greške za userId=${userId}`, {
        validationErrors: req.validationErrors,
        userId,
      });
      const user = await userService.getMyProfile(userId);
      const viewData = prepareSettingsDataWithErrors(user, req.validationErrors, req.body);

      return res.render("user/settings", {
        pageTitle: "Podešavanja naloga",
        pageDescription: "Promena lozinke i podešavanja naloga",
        data: viewData,
      });
    }

    await authService.changePassword(userId, oldPassword, newPassword, confirmPassword);

    logInfo(`[changePassword] Lozinka uspešno promenjena za korisnika #${userId}`, {
      userId,
    });

    req.flash("success", "Lozinka je uspešno promenjena");
    return res.redirect("/profil/podesavanja");
  } catch (error) {
    logError(`[changePassword] Greška pri promeni lozinke`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/podesavanja");
  }
}

export async function deactivateAccount(req, res, next) {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    const { password } = req.body;

    if (!password) {
      logWarn(`[deactivateAccount] Lozinka nije prosleđena za deaktivaciju userId=${userId}`, { userId });
      req.flash("error", "Lozinka je obavezna za deaktivaciju");
      return res.redirect("/profil/podesavanja");
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

    req.flash("success", "Nalog je deaktiviran");
    return res.redirect("/");
  } catch (error) {
    logError(`[deactivateAccount] Greška pri deaktivaciji naloga`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/profil/podesavanja");
  }
}

export default {
  myProfile,
  updateProfile,
  addTelephone,
  removeTelephone,
  addAddress,
  removeAddress,
  myOrders,
  orderDetails,
  cancelOrder,
  myShop,
  settings,
  changePassword,
  deactivateAccount,
};