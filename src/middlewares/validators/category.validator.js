import { body, param } from "express-validator";
import { CATEGORY_DOMAINS } from "../../models/category.model.js";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateCategoryCreate = [
  body("name")
    .trim()
    .notEmpty().withMessage("Naziv kategorije je obavezan")
    .isLength({ min: 2, max: 100 }).withMessage("Naziv mora imati između 2 i 100 karaktera"),

  body("domain")
    .trim()
    .notEmpty().withMessage("Domen je obavezan")
    .isIn(CATEGORY_DOMAINS).withMessage(`Domen mora biti: ${CATEGORY_DOMAINS.join(" ili ")}`),

  body("shortDescription")
    .trim()
    .notEmpty().withMessage("Kratak opis je obavezan")
    .isLength({ max: 300 }).withMessage("Kratak opis može imati najviše 300 karaktera"),

  body("longDescription")
    .trim()
    .notEmpty().withMessage("Dugi opis je obavezan"),

  body("parent")
    .optional({ values: "falsy" })
    .isMongoId().withMessage("Neispravan ID roditeljske kategorije"),

  body("featureImageDesc")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Opis slike može imati najviše 200 karaktera"),

  body("isIndexable")
    .optional()
    .isIn(["0", "1", "true", "false", true, false]).withMessage("Neispravna vrednost za indeksiranje"),

  body("meta[isActive]")
    .optional()
    .isIn(["0", "1", "true", "false", true, false]).withMessage("Neispravna vrednost za aktivnost"),

  body("meta[priority]")
    .optional()
    .isInt({ min: 0, max: 999 }).withMessage("Prioritet mora biti broj između 0 i 999"),

  collectValidationErrors,
];

export const validateCategoryUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Naziv mora imati između 2 i 100 karaktera"),

  body("domain")
    .optional()
    .trim()
    .isIn(CATEGORY_DOMAINS).withMessage(`Domen mora biti: ${CATEGORY_DOMAINS.join(" ili ")}`),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Kratak opis može imati najviše 300 karaktera"),

  body("longDescription")
    .optional()
    .trim(),

  body("parent")
    .optional({ values: "falsy" })
    .isMongoId().withMessage("Neispravan ID roditeljske kategorije"),

  body("featureImageDesc")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Opis slike može imati najviše 200 karaktera"),

  body("isIndexable")
    .optional()
    .isIn(["0", "1", "true", "false", true, false]).withMessage("Neispravna vrednost za indeksiranje"),

  body("meta[isActive]")
    .optional()
    .isIn(["0", "1", "true", "false", true, false]).withMessage("Neispravna vrednost za aktivnost"),

  body("meta[priority]")
    .optional()
    .isInt({ min: 0, max: 999 }).withMessage("Prioritet mora biti broj između 0 i 999"),

  collectValidationErrors,
];

export const validateCategoryId = [
  param("categoryId")
    .isMongoId().withMessage("Neispravan ID kategorije"),

  collectValidationErrors,
];

export default {
  validateCategoryCreate,
  validateCategoryUpdate,
  validateCategoryId,
};