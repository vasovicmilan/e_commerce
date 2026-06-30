import { body, param } from "express-validator";
import mongoose from "mongoose";
import { collectValidationErrors } from "./collect.validation.errors.js";

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

export const validateTemporaryOrderCreate = [
  // ── Buyer info ────────────────────────────────────────────────────────────
  body("buyerInfo.firstName")
    .trim()
    .notEmpty().withMessage("Ime je obavezno")
    .bail()
    .isLength({ min: 2, max: 50 }).withMessage("Ime mora imati između 2 i 50 karaktera"),
 
  body("buyerInfo.lastName")
    .trim()
    .notEmpty().withMessage("Prezime je obavezno")
    .bail()
    .isLength({ min: 2, max: 50 }).withMessage("Prezime mora imati između 2 i 50 karaktera"),
 
  body("buyerInfo.email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .bail()
    .isEmail().withMessage("Neispravan format email adrese")
    .normalizeEmail(),
 
  // ── Telephone ─────────────────────────────────────────────────────────────
  body("telephoneId")
    .optional()
    .custom(isMongoId).withMessage("Neispravan ID telefona"),
 
  body("newTelephone")
    .optional()
    .trim()
    .notEmpty().withMessage("Broj telefona ne može biti prazan")
    .bail()
    .matches(/^[\d+\-\s\/]+$/).withMessage("Neispravan format broja telefona"),
 
  body("hasNewTelephone")
    .optional()
    .isBoolean().withMessage("Neispravan format polja hasNewTelephone"),
 
  // ── Address ───────────────────────────────────────────────────────────────
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
    .isBoolean().withMessage("Neispravan format polja hasNewAddress"),
 
  // ── Terms acceptance ──────────────────────────────────────────────────────
  // FIX H4: .bail() added so .custom() does not run when .notEmpty() fails.
  // This prevents the double-error message on an empty field.
  body("acceptTerms")
    .notEmpty().withMessage("Morate prihvatiti uslove korišćenja")
    .bail()                                                      // ← FIX H4
    .custom((value) => value === "true" || value === true)
    .withMessage("Morate prihvatiti uslove korišćenja"),
 
  // ── Optional fields ───────────────────────────────────────────────────────
  body("note")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Napomena ne sme biti duža od 1000 karaktera"),
 
  body("createNewAccount")
    .optional()
    .isBoolean().withMessage("Neispravan format polja createNewAccount"),
 
  body("couponCode")
    .optional()
    .trim(),
 
  body("appliedCoupon")
    .optional()
    .trim(),
 
  // ── Collect errors ────────────────────────────────────────────────────────
  collectValidationErrors,
];

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