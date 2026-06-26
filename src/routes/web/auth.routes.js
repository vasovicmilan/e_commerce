import { Router } from "express";
import * as AuthController from "../../controllers/web/auth/auth.controller.js";
import {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateRequestPasswordReset,
  validateResetPassword,
} from "../../middlewares/validators/auth.validator.js";
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verificationLimiter,
} from "../../middlewares/rate.limiter.middleware.js";

const router = Router();

router.get("/prijava", AuthController.loginForm);
router.get("/registracija", AuthController.registerForm);
router.get("/zaboravljena-lozinka", AuthController.forgotPasswordForm);
router.get("/nova-lozinka", AuthController.resetPasswordForm);

router.post("/registracija", registerLimiter, validateRegister, AuthController.register);
router.post("/prijava", loginLimiter, validateLogin, AuthController.login);
router.get("/odjava", AuthController.logout);

router.get("/verifikacija/:token", verificationLimiter, AuthController.verifyAccount);

router.post("/zaboravljena-lozinka", passwordResetLimiter, validateRequestPasswordReset, AuthController.requestPasswordReset);
router.post("/nova-lozinka", passwordResetLimiter, validateResetPassword, AuthController.resetPassword);

router.post("/google", validateGoogleAuth, AuthController.googleCallback);

export default router;