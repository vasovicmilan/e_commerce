import { body } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateRegister = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password")
    .notEmpty().withMessage("Lozinka je obavezna")
    .isLength({ min: 8 }).withMessage("Lozinka mora imati najmanje 8 karaktera"),

  body("passwordConfirm")
    .notEmpty().withMessage("Potvrda lozinke je obavezna")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Lozinke se ne poklapaju");
      }
      return true;
    }),

  body("firstName")
    .trim()
    .notEmpty().withMessage("Ime je obavezno")
    .isLength({ min: 2, max: 50 }).withMessage("Ime mora imati između 2 i 50 karaktera"),

  body("lastName")
    .trim()
    .notEmpty().withMessage("Prezime je obavezno")
    .isLength({ min: 2, max: 50 }).withMessage("Prezime mora imati između 2 i 50 karaktera"),

  collectValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password")
    .notEmpty().withMessage("Lozinka je obavezna"),

  collectValidationErrors,
];

export const validateGoogleAuth = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("googleId")
    .trim()
    .notEmpty().withMessage("Google ID je obavezan"),

  body("firstName")
    .optional()
    .trim(),

  body("lastName")
    .optional()
    .trim(),

  body("avatar")
    .optional()
    .trim(),

  collectValidationErrors,
];

export const validateVerifyAccount = [
  body("token")
    .trim()
    .notEmpty().withMessage("Token je obavezan"),

  collectValidationErrors,
];

export const validateRequestPasswordReset = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  collectValidationErrors,
];

export const validateResetPassword = [
  body("token")
    .trim()
    .notEmpty().withMessage("Token je obavezan"),

  body("password")
    .notEmpty().withMessage("Lozinka je obavezna")
    .isLength({ min: 8 }).withMessage("Lozinka mora imati najmanje 8 karaktera"),

  body("passwordConfirm")
    .notEmpty().withMessage("Potvrda lozinke je obavezna")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Lozinke se ne poklapaju");
      }
      return true;
    }),

  collectValidationErrors,
];

export const validateChangePassword = [
  body("oldPassword")
    .notEmpty().withMessage("Trenutna lozinka je obavezna"),

  body("newPassword")
    .notEmpty().withMessage("Nova lozinka je obavezna")
    .isLength({ min: 8 }).withMessage("Lozinka mora imati najmanje 8 karaktera"),

  body("confirmPassword")
    .notEmpty().withMessage("Potvrda lozinke je obavezna")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Lozinke se ne poklapaju");
      }
      return true;
    }),

  collectValidationErrors,
];

export const validateDeactivateAccount = [
  body("password")
    .notEmpty().withMessage("Lozinka je obavezna"),

  collectValidationErrors,
];

export const validateResendVerification = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  collectValidationErrors,
];

export default {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateVerifyAccount,
  validateRequestPasswordReset,
  validateResetPassword,
  validateChangePassword,
  validateDeactivateAccount,
  validateResendVerification,
};