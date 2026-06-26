import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validatePostCreate = [
  body("title")
    .trim()
    .notEmpty().withMessage("Naziv posta je obavezan")
    .isLength({ min: 2, max: 200 }).withMessage("Naziv mora imati između 2 i 200 karaktera"),

  body("categories")
    .optional()
    .isArray().withMessage("Kategorije moraju biti niz")
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value.filter(item => item && item.trim() !== '');
      }
      return value;
    }),

  body("categories.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID kategorije"),

  body("tags")
    .optional()
    .isArray().withMessage("Tagovi moraju biti niz")
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value.filter(item => item && item.trim() !== '');
      }
      return value;
    }),

  body("tags.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID taga"),

  collectValidationErrors,
];

export const validatePostUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage("Naziv mora imati između 2 i 200 karaktera"),

  body("author")
    .optional()
    .trim()
    .isMongoId().withMessage("Neispravan ID autora"),

  body("featureImage.img")
    .optional()
    .trim(),

  body("featureImage.imgDesc")
    .optional()
    .trim(),

  body("categories")
    .optional()
    .isArray().withMessage("Kategorije moraju biti niz"),

  body("categories.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID kategorije"),

  body("tags")
    .optional()
    .isArray().withMessage("Tagovi moraju biti niz"),

  body("tags.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID taga"),

  collectValidationErrors,
];

export const validatePostContent = [
  body("content")
    .isArray().withMessage("Sadržaj mora biti niz blokova")
    .notEmpty().withMessage("Sadržaj ne može biti prazan"),

  body("content.*.type")
    .trim()
    .notEmpty().withMessage("Tip bloka je obavezan")
    .isIn(["heading", "paragraph", "list", "table", "image", "quote"])
    .withMessage("Neispravan tip bloka"),

  body("content.*.text")
    .optional()
    .trim(),

  body("content.*.level")
    .optional()
    .isInt({ min: 1, max: 6 }).withMessage("Nivo headinga mora biti između 1 i 6"),

  // items i rows sada prihvatamo kao string – u kontroleru ćemo ih pretvoriti u nizove
  body("content.*.items")
    .optional()
    .isString().withMessage("Items mora biti tekst")
    .trim(),

  body("content.*.rows")
    .optional()
    .isString().withMessage("Rows mora biti tekst")
    .trim(),

  body("content.*.src")
    .optional()
    .trim(),

  body("content.*.alt")
    .optional()
    .trim(),

  collectValidationErrors,
];

export const validatePostSeo = [
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Opis može imati najviše 2000 karaktera"),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Kratak opis može imati najviše 300 karaktera"),

  body("keyWords")
    .optional()
    .isArray().withMessage("Ključne reči moraju biti niz"),

  body("faq")
    .optional()
    .isArray().withMessage("FAQ mora biti niz"),

  body("faq.*.question")
    .optional()
    .trim()
    .notEmpty().withMessage("Pitanje je obavezno"),

  body("faq.*.answer")
    .optional()
    .trim()
    .notEmpty().withMessage("Odgovor je obavezan"),

  collectValidationErrors,
];

export const validatePostStatus = [
  body("status")
    .trim()
    .notEmpty().withMessage("Status je obavezan")
    .isIn(["not-published", "published", "featured"])
    .withMessage("Status mora biti: not-published, published ili featured"),

  collectValidationErrors,
];

export const validatePostId = [
  param("postId")
    .isMongoId().withMessage("Neispravan ID posta"),

  collectValidationErrors,
];

export default {
  validatePostCreate,
  validatePostUpdate,
  validatePostContent,
  validatePostSeo,
  validatePostStatus,
  validatePostId,
};