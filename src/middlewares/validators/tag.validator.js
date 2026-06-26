import { body, param } from "express-validator";
import { TAG_DOMAINS, TAG_TYPES } from "../../models/tag.model.js";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateTagCreate = [
  body("name")
    .trim()
    .notEmpty().withMessage("Naziv taga je obavezan")
    .isLength({ min: 2, max: 100 }).withMessage("Naziv mora imati između 2 i 100 karaktera"),

  body("domain")
    .trim()
    .notEmpty().withMessage("Domen je obavezan")
    .isIn(TAG_DOMAINS).withMessage(`Domen mora biti: ${TAG_DOMAINS.join(" ili ")}`),

  body("type")
    .trim()
    .notEmpty().withMessage("Tip taga je obavezan")
    .isIn(TAG_TYPES).withMessage(`Tip mora biti jedan od: ${TAG_TYPES.join(", ")}`),

  body("shortDescription")
    .trim()
    .notEmpty().withMessage("Kratak opis je obavezan")
    .isLength({ max: 300 }).withMessage("Kratak opis može imati najviše 300 karaktera"),

  body("longDescription")
    .trim()
    .notEmpty().withMessage("Dugi opis je obavezan"),

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

export const validateTagUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Naziv mora imati između 2 i 100 karaktera"),

  body("domain")
    .optional()
    .trim()
    .isIn(TAG_DOMAINS).withMessage(`Domen mora biti: ${TAG_DOMAINS.join(" ili ")}`),

  body("type")
    .optional()
    .trim()
    .isIn(TAG_TYPES).withMessage(`Tip mora biti jedan od: ${TAG_TYPES.join(", ")}`),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Kratak opis može imati najviše 300 karaktera"),

  body("longDescription")
    .optional()
    .trim(),

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

export const validateTagId = [
  param("tagId")
    .isMongoId().withMessage("Neispravan ID taga"),

  collectValidationErrors,
];

export default {
  validateTagCreate,
  validateTagUpdate,
  validateTagId,
};