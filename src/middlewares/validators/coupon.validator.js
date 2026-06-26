import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

const isNullOrUndefined = (value) => value === null || value === undefined || value === "";

const validateAllowedUsers = (value) => {
  if (!value) return true;
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
  return value.every((id) => isObjectId(id));
};

export const validateCouponCreate = [
  body("code")
    .trim()
    .notEmpty().withMessage("Kod kupona je obavezan")
    .isLength({ min: 3, max: 30 }).withMessage("Kod mora imati između 3 i 30 karaktera")
    .matches(/^[A-Za-z0-9_-]+$/).withMessage("Kod može sadržati samo slova, brojeve, crtice i donje crte"),

  body("discountType")
    .optional()
    .isIn(["percentage", "fixed"]).withMessage("Tip popusta mora biti: percentage ili fixed"),

  body("discountValue")
    .isFloat({ min: 0 }).withMessage("Vrednost popusta mora biti 0 ili veća")
    .custom((value, { req }) => {
      if (req.body.discountType === "percentage" && value > 100) {
        throw new Error("Procentualni popust ne može biti veći od 100%");
      }
      return true;
    }),

  body("usageLimit")
    .optional()
    .custom((value) => {
      if (isNullOrUndefined(value)) return true;
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        throw new Error("Limit korišćenja mora biti broj veći od 0 ili null (neograničeno)");
      }
      return true;
    }),

  // 🔥 Dozvoli prazno (null) za neograničeno po korisniku
  body("usagePerUser")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        throw new Error("Broj korišćenja po korisniku mora biti broj veći od 0 ili prazno (neograničeno)");
      }
      return true;
    }),

  body("allowedUsers")
    .optional()
    .custom(validateAllowedUsers).withMessage("allowedUsers mora biti niz validnih MongoDB ID-eva"),

  body("minCartAmount")
    .optional()
    .isFloat({ min: 0 }).withMessage("Minimalni iznos korpe mora biti 0 ili veći"),

  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive mora biti boolean"),

  body("validFrom")
    .optional()
    .isISO8601().withMessage("Neispravan datum početka"),

  body("validUntil")
    .optional({ values: "null" })
    .isISO8601().withMessage("Neispravan datum isteka"),

  collectValidationErrors,
];

export const validateCouponUpdate = [
  body("code")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage("Kod mora imati između 3 i 30 karaktera")
    .matches(/^[A-Za-z0-9_-]+$/).withMessage("Kod može sadržati samo slova, brojeve, crtice i donje crte"),

  body("discountType")
    .optional()
    .isIn(["percentage", "fixed"]).withMessage("Tip popusta mora biti: percentage ili fixed"),

  body("discountValue")
    .optional()
    .isFloat({ min: 0 }).withMessage("Vrednost popusta mora biti 0 ili veća")
    .custom((value, { req }) => {
      const type = req.body.discountType;
      if (type === "percentage" && value > 100) {
        throw new Error("Procentualni popust ne može biti veći od 100%");
      }
      return true;
    }),

  body("usageLimit")
    .optional()
    .custom((value) => {
      if (isNullOrUndefined(value)) return true;
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        throw new Error("Limit korišćenja mora biti broj veći od 0 ili null (neograničeno)");
      }
      return true;
    }),

  // 🔥 Dozvoli prazno (null) za neograničeno po korisniku
  body("usagePerUser")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num) || num < 1) {
        throw new Error("Broj korišćenja po korisniku mora biti broj veći od 0 ili prazno (neograničeno)");
      }
      return true;
    }),

  body("allowedUsers")
    .optional()
    .custom(validateAllowedUsers).withMessage("allowedUsers mora biti niz validnih MongoDB ID-eva"),

  body("minCartAmount")
    .optional()
    .isFloat({ min: 0 }).withMessage("Minimalni iznos korpe mora biti 0 ili veći"),

  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive mora biti boolean"),

  body("validFrom")
    .optional()
    .isISO8601().withMessage("Neispravan datum početka"),

  body("validUntil")
    .optional({ values: "null" })
    .isISO8601().withMessage("Neispravan datum isteka"),

  collectValidationErrors,
];

export const validateCouponApply = [
  body("code")
    .trim()
    .notEmpty().withMessage("Kod kupona je obavezan")
    .isLength({ min: 3, max: 30 }).withMessage("Neispravan kod kupona"),

  body("cartTotal")
    .isFloat({ min: 0 }).withMessage("Iznos korpe mora biti 0 ili veći"),

  collectValidationErrors,
];

export const validateCouponRemove = [
  body("code")
    .trim()
    .notEmpty().withMessage("Kod kupona je obavezan"),

  collectValidationErrors,
];

export const validateCouponId = [
  param("couponId")
    .isMongoId().withMessage("Neispravan ID kupona"),

  collectValidationErrors,
];

export default {
  validateCouponCreate,
  validateCouponUpdate,
  validateCouponApply,
  validateCouponRemove,
  validateCouponId,
};