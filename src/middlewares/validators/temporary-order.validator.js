import { body, param } from "express-validator";
import mongoose from "mongoose";
import { collectValidationErrors } from "./collect.validation.errors.js";

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

export const validateTemporaryOrderCreate = [
  // ---- BUYER INFO ----
  body("buyerInfo.firstName")
    .trim()
    .notEmpty().withMessage("Ime je obavezno")
    .isLength({ min: 2, max: 50 }).withMessage("Ime mora imati između 2 i 50 karaktera"),

  body("buyerInfo.lastName")
    .trim()
    .notEmpty().withMessage("Prezime je obavezno")
    .isLength({ min: 2, max: 50 }).withMessage("Prezime mora imati između 2 i 50 karaktera"),

  body("buyerInfo.email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan format email-a")
    .normalizeEmail({ gmail_remove_dots: false }),

  // ---- TELEFON ----
  body("telephoneId")
    .optional()
    .custom(isMongoId).withMessage("Neispravan ID telefona"),

  body("newTelephone")
    .optional()
    .trim()
    .notEmpty().withMessage("Broj telefona je obavezan")
    .matches(/^[\d+\-\s\/]+$/).withMessage("Neispravan format telefona"),

  body("hasNewTelephone")
    .optional()
    .isBoolean().withMessage("hasNewTelephone mora biti boolean"),

  // ---- ADRESA ----
  body("addressId")
    .optional()
    .custom(isMongoId).withMessage("Neispravan ID adrese"),

  body("newAddress.city")
    .optional()
    .trim()
    .notEmpty().withMessage("Grad je obavezan"),

  body("newAddress.street")
    .optional()
    .trim()
    .notEmpty().withMessage("Ulica je obavezna"),

  body("newAddress.number")
    .optional()
    .trim()
    .notEmpty().withMessage("Broj je obavezan"),

  body("newAddress.postalCode")
    .optional()
    .trim()
    .notEmpty().withMessage("Poštanski broj je obavezan"),

  body("hasNewAddress")
    .optional()
    .isBoolean().withMessage("hasNewAddress mora biti boolean"),

  // ---- USLOVI ----
  body("acceptTerms")
    .notEmpty().withMessage("Morate prihvatiti uslove korišćenja")
    .custom(value => value === 'true' || value === true)
    .withMessage("Morate prihvatiti uslove korišćenja"),

  // ---- OSTALA POLJA ----
  body("note")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Napomena može imati najviše 1000 karaktera"),

  body("createNewAccount")
    .optional()
    .isBoolean().withMessage("createNewAccount mora biti boolean"),

  body("couponCode")
    .optional()
    .trim(),

  body("appliedCoupon")
    .optional()
    .trim(),

  collectValidationErrors,
];

// 🔥 Validacija za korisnika – token OBAVEZAN
export const validateTokenVerification = [
  body("token")
    .trim()
    .notEmpty().withMessage("Token je obavezan"),

  body("orderId")
    .trim()
    .notEmpty().withMessage("ID porudžbine je obavezan")
    .isMongoId().withMessage("Neispravan ID porudžbine"),

  collectValidationErrors,
];

// 🔥 Validacija za admina – token NIJE OBAVEZAN
export const validateAdminConfirm = [
  body("orderId")
    .optional()
    .isMongoId().withMessage("Neispravan ID porudžbine"),

  collectValidationErrors,
];

export const validateTempOrderId = [
  param("orderId")
    .isMongoId().withMessage("Neispravan ID privremene porudžbine"),

  collectValidationErrors,
];

export default {
  validateTemporaryOrderCreate,
  validateTokenVerification,
  validateAdminConfirm,
  validateTempOrderId,
};