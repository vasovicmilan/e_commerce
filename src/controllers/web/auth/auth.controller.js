import * as authService from "../../../services/auth.service.js";
import {
  prepareLoginFormData,
  prepareLoginFormDataWithErrors,
  prepareRegisterFormData,
  prepareRegisterFormDataWithErrors,
  prepareForgotPasswordFormData,
  prepareResetPasswordFormData,
} from "../../../presenters/auth/auth.presenter.js";
import { logError, logWarn, logInfo } from "../../../utils/logger.util.js";
import { flashAndRedirect } from "../../../utils/flash.util.js";

export function loginForm(req, res) {
  const formData = prepareLoginFormData();
  return res.render("auth/_auth-form", {
    pageTitle: "Prijava",
    pageDescription: "Prijavite se na svoj nalog",
    data: formData,
  });
}

export function registerForm(req, res) {
  const formData = prepareRegisterFormData();
  return res.render("auth/_auth-form", {
    pageTitle: "Registracija",
    pageDescription: "Kreirajte novi nalog",
    data: formData,
  });
}

export function forgotPasswordForm(req, res) {
  const formData = prepareForgotPasswordFormData();
  return res.render("auth/_auth-form", {
    pageTitle: "Zaboravljena lozinka",
    pageDescription: "Resetujte svoju lozinku",
    data: formData,
  });
}

export function resetPasswordForm(req, res) {
  const { token } = req.query;
  const formData = prepareResetPasswordFormData(token || "");
  return res.render("auth/_auth-form", {
    pageTitle: "Nova lozinka",
    pageDescription: "Postavite novu lozinku",
    data: formData,
  });
}

export async function register(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[register] Validacione greške pri registraciji`, {
        validationErrors: req.validationErrors,
        email: req.body.email,
        ip: req.ip,
      });
      const formData = prepareRegisterFormDataWithErrors(req.validationErrors, req.body);
      return res.render("auth/_auth-form", {
        pageTitle: "Registracija",
        pageDescription: "Kreirajte novi nalog",
        data: formData,
      });
    }

    const guestCart = req.session.cart || [];
    const result = await authService.register(req.body, guestCart);

    // Očisti guest korpu
    req.session.cart = [];

    if (result.isFirstUser) {
      req.session.isLoggedIn = true;
      req.session.user = {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName || "",
        role: result.roleId,
        token: result.token || null,
      };
      req.session.cartCount = result.cartCount || 0;

      logInfo(`[register] Prvi korisnik registrovan: ${result.email} (ID: ${result.id})`, {
        userId: result.id,
        email: result.email,
        isFirstUser: true,
        ip: req.ip,
      });

      return flashAndRedirect(
        req, res, "success",
        `Dobrodošli, ${result.firstName}! Vaš administratorski nalog je kreiran.`,
        "/admin/dashboard"
      );
    }

    if (result.provider === "google" && !result.password) {
      req.session.isLoggedIn = true;
      req.session.user = {
        id: result.id || result._id?.toString(),
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName || "",
        role: result.roleId || result.role,
        token: result.token || null,
      };
      req.session.cartCount = result.cartCount || 0;

      logInfo(`[register] Google korisnik registrovan: ${result.email} (ID: ${result.id})`, {
        userId: result.id,
        email: result.email,
        provider: "google",
        ip: req.ip,
      });

      return flashAndRedirect(req, res, "success", `Dobrodošli, ${result.firstName}!`, "/");
    }

    logInfo(`[register] Novi korisnik registrovan: ${result.email} (ID: ${result.id})`, {
      userId: result.id,
      email: result.email,
      isFirstUser: false,
      ip: req.ip,
    });

    return flashAndRedirect(
      req, res, "success",
      "Registracija uspešna! Proverite email za verifikaciju naloga.",
      "/auth/prijava"
    );
  } catch (error) {
    logError(`[register] Greška pri registraciji`, error, {
      email: req.body?.email,
      ip: req.ip,
    });
    if (error.statusCode === 400 || error.statusCode === 409) {
      const formData = prepareRegisterFormDataWithErrors({ general: error.message }, req.body);
      return res.render("auth/_auth-form", {
        pageTitle: "Registracija",
        pageDescription: "Kreirajte novi nalog",
        data: formData,
      });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[login] Validacione greške pri prijavi`, {
        validationErrors: req.validationErrors,
        email: req.body.email,
        ip: req.ip,
      });
      const formData = prepareLoginFormDataWithErrors(req.validationErrors, req.body);
      return res.render("auth/_auth-form", {
        pageTitle: "Prijava",
        pageDescription: "Prijavite se na svoj nalog",
        data: formData,
      });
    }

    const guestCart = req.session.cart || [];
    const user = await authService.login(req.body.email, req.body.password, guestCart);

    // Očisti guest korpu
    req.session.cart = [];

    req.session.isLoggedIn = true;
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.roleId,
      roleName: user.roleName,
      isPartner: user.isPartner || false,
      token: user.token,
    };
    req.session.cartCount = user.cartCount || 0;

    logInfo(`[login] Korisnik prijavljen: ${user.email} (ID: ${user._id})`, {
      userId: user._id,
      email: user.email,
      role: user.roleName,
      ip: req.ip,
    });

    const redirectTo = user.roleName === "Administrator" ? "/admin/dashboard" : "/";

    return flashAndRedirect(req, res, "success", `Dobrodošli, ${user.firstName}!`, redirectTo);
  } catch (error) {
    logError(`[login] Greška pri prijavi`, error, {
      email: req.body?.email,
      ip: req.ip,
    });
    if (error.statusCode === 401 || error.statusCode === 400) {
      const formData = prepareLoginFormDataWithErrors({ general: error.message }, req.body);
      return res.render("auth/_auth-form", {
        pageTitle: "Prijava",
        pageDescription: "Prijavite se na svoj nalog",
        data: formData,
      });
    }
    next(error);
  }
}

export async function logout(req, res) {
  const userId = req.session?.user?.id;
  const email = req.session?.user?.email;

  req.session.destroy((err) => {
    if (err) {
      logError(`[logout] Greška pri uništavanju sesije`, err, {
        userId,
        email,
        ip: req.ip,
      });
    } else {
      logInfo(`[logout] Korisnik odjavljen`, {
        userId,
        email,
        ip: req.ip,
      });
    }
    res.clearCookie("connect.sid");
    res.clearCookie("sid_tophelanke");
    res.clearCookie("tophelanke.sid");
    return res.redirect("/");
  });
}

export async function verifyAccount(req, res, next) {
  try {
    const { token } = req.params;
    await authService.verifyAccount(token);

    logInfo(`[verifyAccount] Nalog verifikovan sa tokenom`, {
      token: token.substring(0, 8) + '...',
      ip: req.ip,
    });

    return flashAndRedirect(
      req, res, "success",
      "Nalog je uspešno verifikovan! Sada se možete prijaviti.",
      "/auth/prijava"
    );
  } catch (error) {
    logError(`[verifyAccount] Greška pri verifikaciji naloga`, error, {
      token: req.params?.token?.substring(0, 8) + '...',
      ip: req.ip,
    });
    return flashAndRedirect(req, res, "error", error.message, "/auth/prijava");
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[requestPasswordReset] Validacione greške`, {
        validationErrors: req.validationErrors,
        email: req.body.email,
        ip: req.ip,
      });
      const formData = prepareForgotPasswordFormData();
      formData.errors = req.validationErrors;
      formData.formData = req.body;
      return res.render("auth/_auth-form", {
        pageTitle: "Zaboravljena lozinka",
        pageDescription: "Resetujte svoju lozinku",
        data: formData,
      });
    }

    await authService.requestPasswordReset(req.body.email);

    logInfo(`[requestPasswordReset] Zahtev za reset lozinke poslat za email: ${req.body.email}`, {
      email: req.body.email,
      ip: req.ip,
    });

    return flashAndRedirect(
      req, res, "success",
      "Ako email postoji, poslat je link za reset lozinke.",
      "/auth/prijava"
    );
  } catch (error) {
    logError(`[requestPasswordReset] Greška pri zahtevu za reset lozinke`, error, {
      email: req.body?.email,
      ip: req.ip,
    });
    return flashAndRedirect(req, res, "error", error.message, "/auth/zaboravljena-lozinka");
  }
}

export async function resetPassword(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[resetPassword] Validacione greške`, {
        validationErrors: req.validationErrors,
        token: req.body.token?.substring(0, 8) + '...',
        ip: req.ip,
      });
      const formData = prepareResetPasswordFormData(req.body.token || "");
      formData.errors = req.validationErrors;
      formData.formData = req.body;
      return res.render("auth/_auth-form", {
        pageTitle: "Nova lozinka",
        pageDescription: "Postavite novu lozinku",
        data: formData,
      });
    }

    await authService.resetPassword(req.body.token, req.body.password, req.body.passwordConfirm);

    logInfo(`[resetPassword] Lozinka uspešno resetovana`, {
      token: req.body.token?.substring(0, 8) + '...',
      ip: req.ip,
    });

    return flashAndRedirect(
      req, res, "success",
      "Lozinka je uspešno promenjena! Sada se možete prijaviti.",
      "/auth/prijava"
    );
  } catch (error) {
    logError(`[resetPassword] Greška pri resetovanju lozinke`, error, {
      token: req.body?.token?.substring(0, 8) + '...',
      ip: req.ip,
    });
    if (error.statusCode === 400) {
      const formData = prepareResetPasswordFormData(req.body.token || "");
      formData.errors = { general: error.message };
      formData.formData = req.body;
      return res.render("auth/_auth-form", {
        pageTitle: "Nova lozinka",
        pageDescription: "Postavite novu lozinku",
        data: formData,
      });
    }
    next(error);
  }
}

export async function googleAuthRedirect(req, res) {
  const GOOGLE_AUTH_URL = process.env.GOOGLE_AUTH_URL || "https://accounts.google.com/o/oauth2/v2/auth";
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = `${process.env.BASE_URL || "http://localhost:3002"}/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  logInfo(`[googleAuthRedirect] Preusmeravanje na Google OAuth`, {
    ip: req.ip,
  });

  return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

export async function googleCallback(req, res, next) {
  try {
    const { code } = req.query;

    if (!code) {
      logWarn(`[googleCallback] Nedostaje autorizacioni kod`, {
        ip: req.ip,
      });
      return flashAndRedirect(req, res, "error", "Google autentifikacija nije uspela.", "/auth/prijava");
    }

    const guestCart = req.session.cart || [];
    const result = await authService.googleAuth({ code }, guestCart);

    req.session.cart = [];

    req.session.isLoggedIn = true;
    req.session.user = {
      id: result.user._id.toString(),
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.roleId || result.user.role,
      roleName: result.user.roleName || "Customer",
      isPartner: result.user.isPartner || false,
      token: result.user.token,
    };
    req.session.cartCount = result.user.cartCount || 0;

    logInfo(`[googleCallback] Uspešna Google autentifikacija: ${result.user.email} (ID: ${result.user._id})`, {
      userId: result.user._id,
      email: result.user.email,
      ip: req.ip,
    });

    return flashAndRedirect(req, res, "success", `Dobrodošli, ${result.user.firstName}!`, "/");
  } catch (error) {
    logError(`[googleCallback] Greška pri Google autentifikaciji`, error, {
      code: req.query?.code?.substring(0, 8) + '...',
      ip: req.ip,
    });
    return flashAndRedirect(
      req, res, "error",
      "Google autentifikacija nije uspela: " + error.message,
      "/auth/prijava"
    );
  }
}

export default {
  loginForm,
  registerForm,
  forgotPasswordForm,
  resetPasswordForm,
  register,
  login,
  logout,
  verifyAccount,
  requestPasswordReset,
  resetPassword,
  googleAuthRedirect,
  googleCallback,
};