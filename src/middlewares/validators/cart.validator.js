import { body } from "express-validator";
import mongoose from "mongoose";
import { collectValidationErrors } from "./collect.validation.errors.js";

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

// ============================================================
//  KORPA
// ============================================================

export const validateAddToCart = [
  body("itemId")
    .notEmpty().withMessage("ID artikla je obavezan")
    .custom(isMongoId).withMessage("Neispravan ID artikla"),

  body("variationId")
    .notEmpty().withMessage("ID varijacije je obavezan")
    .custom(isMongoId).withMessage("Neispravan ID varijacije"),

  body("quantity")
    .optional()
    .isInt({ min: 1 }).withMessage("Količina mora biti najmanje 1"),

  body("affiliateCode")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Affiliate kod je predugačak"),

  collectValidationErrors,
];

export const validateRemoveFromCart = [
  body("itemId")
    .notEmpty().withMessage("ID artikla je obavezan")
    .custom(isMongoId).withMessage("Neispravan ID artikla"),

  body("variationId")
    .notEmpty().withMessage("ID varijacije je obavezan")
    .custom(isMongoId).withMessage("Neispravan ID varijacije"),

  body("quantity")
    .optional()
    .isInt({ min: 1 }).withMessage("Količina mora biti najmanje 1"),

  collectValidationErrors,
];

export const validateClearCart = [
  collectValidationErrors,
];

// ============================================================
//  KUPONI
// ============================================================

export const validateApplyCoupon = [
  body("code")
    .notEmpty().withMessage("Kod kupona je obavezan")
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage("Kod kupona mora imati između 1 i 50 karaktera"),

  collectValidationErrors,
];

export const validateRemoveCoupon = [
  collectValidationErrors,
];

// ============================================================
//  LISTA ŽELJA
// ============================================================

export const validateToggleWishlist = [
  body("itemId")
    .notEmpty().withMessage("ID artikla je obavezan")
    .custom(isMongoId).withMessage("Neispravan ID artikla"),

  collectValidationErrors,
];

// ============================================================
//  OCENE (RATING)
// ============================================================

export const validateAddRating = [
  body("itemId")
    .notEmpty().withMessage("ID artikla je obavezan")
    .custom(isMongoId).withMessage("Neispravan ID artikla"),

  body("stars")
    .notEmpty().withMessage("Ocena je obavezna")
    .isInt({ min: 1, max: 5 }).withMessage("Ocena mora biti između 1 i 5"),

  body("review")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Komentar može imati najviše 500 karaktera"),

  collectValidationErrors,
];

export const validateRemoveRating = [
  body("itemId")
    .notEmpty().withMessage("ID artikla je obavezan")
    .custom(isMongoId).withMessage("Neispravan ID artikla"),

  collectValidationErrors,
];

export default {
  validateAddToCart,
  validateRemoveFromCart,
  validateClearCart,
  validateApplyCoupon,
  validateRemoveCoupon,
  validateToggleWishlist,
  validateAddRating,
  validateRemoveRating,
};