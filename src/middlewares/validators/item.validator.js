import { body, param } from "express-validator";
import { SIZES, ITEM_STATUSES } from "../../models/constants.js";
import { collectValidationErrors } from "./collect.validation.errors.js";

// Pomoćna funkcija za sanitizaciju nizova
function sanitizeArray(value) {
  if (Array.isArray(value)) {
    return value.filter(item => item && item.trim() !== '');
  }
  return value;
}

// Pomoćna funkcija za sanitizaciju FAQ niza
function sanitizeFaq(value) {
  if (Array.isArray(value)) {
    return value
      .filter(item =>
        item &&
        item.question &&
        item.question.trim() !== '' &&
        item.answer &&
        item.answer.trim() !== ''
      )
      .map(item => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
        icon: item.icon ? item.icon.trim() : '',
      }));
  }
  // Ako je objekat (indeksi), pretvori u niz
  if (typeof value === 'object' && value !== null) {
    const entries = Object.values(value);
    return entries
      .filter(item =>
        item &&
        typeof item === 'object' &&
        item.question &&
        item.question.trim() !== '' &&
        item.answer &&
        item.answer.trim() !== ''
      )
      .map(item => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
        icon: item.icon ? item.icon.trim() : '',
      }));
  }
  return [];
}

export const validateItemCreate = [
  body("title")
    .trim()
    .notEmpty().withMessage("Naziv artikla je obavezan")
    .isLength({ min: 2, max: 200 }).withMessage("Naziv mora imati između 2 i 200 karaktera"),

  body("sku")
    .trim()
    .notEmpty().withMessage("SKU je obavezan")
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage("SKU može sadržati samo slova, brojeve, crtice i donje crte"),

  body("categories")
    .optional()
    .isArray().withMessage("Kategorije moraju biti niz")
    .customSanitizer(sanitizeArray),

  body("categories.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID kategorije"),

  body("tags")
    .optional()
    .isArray().withMessage("Tagovi moraju biti niz")
    .customSanitizer(sanitizeArray),

  body("tags.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID taga"),

  body("status")
    .optional()
    .isIn(ITEM_STATUSES).withMessage(`Status mora biti: ${ITEM_STATUSES.join(", ")}`),

  body("video")
    .optional()
    .customSanitizer((value) => {
      if (value && typeof value === 'string') {
        return { vid: value, vidDesc: '' };
      }
      return value;
    }),

  body("video.vid")
    .optional()
    .trim(),

  body("video.vidDesc")
    .optional()
    .trim(),

  body("videoDesc")
    .optional()
    .trim(),

  collectValidationErrors,
];

export const validateItemUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage("Naziv mora imati između 2 i 200 karaktera"),

  body("sku")
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage("SKU može sadržati samo slova, brojeve, crtice i donje crte"),

  body("categories")
    .optional()
    .isArray().withMessage("Kategorije moraju biti niz")
    .customSanitizer(sanitizeArray),

  body("categories.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID kategorije"),

  body("tags")
    .optional()
    .isArray().withMessage("Tagovi moraju biti niz")
    .customSanitizer(sanitizeArray),

  body("tags.*")
    .optional()
    .isMongoId().withMessage("Neispravan ID taga"),

  body("status")
    .optional()
    .isIn(ITEM_STATUSES).withMessage(`Status mora biti: ${ITEM_STATUSES.join(", ")}`),

  body("video")
    .optional()
    .customSanitizer((value) => {
      if (value && typeof value === 'string') {
        return { vid: value, vidDesc: '' };
      }
      return value;
    }),

  body("video.vid")
    .optional()
    .trim(),

  body("video.vidDesc")
    .optional()
    .trim(),

  body("videoDesc")
    .optional()
    .trim(),

  collectValidationErrors,
];

export const validateVariationAdd = [
  body("size")
    .trim()
    .notEmpty().withMessage("Veličina je obavezna")
    .isIn(SIZES).withMessage("Neispravna veličina"),

  body("color")
    .trim()
    .notEmpty().withMessage("Boja je obavezna"),

  body("amount")
    .isInt({ min: 0 }).withMessage("Količina mora biti 0 ili više"),

  body("price")
    .isFloat({ min: 2 }).withMessage("Cena mora biti najmanje 2"),

  body("actionPrice")
    .optional()
    .isFloat({ min: 1 }).withMessage("Akcijska cena mora biti najmanje 1"),

  body("onAction")
    .optional()
    .isBoolean().withMessage("onAction mora biti boolean"),

  body("measurements.unit")
    .optional()
    .isIn(["cm", "in"]).withMessage("Jedinica mora biti cm ili in"),

  collectValidationErrors,
];

export const validateVariationUpdate = [
  body("size")
    .optional()
    .trim()
    .isIn(SIZES).withMessage("Neispravna veličina"),

  body("color")
    .optional()
    .trim(),

  body("amount")
    .optional()
    .isInt({ min: 0 }).withMessage("Količina mora biti 0 ili više"),

  body("price")
    .optional()
    .isFloat({ min: 2 }).withMessage("Cena mora biti najmanje 2"),

  body("actionPrice")
    .optional()
    .isFloat({ min: 1 }).withMessage("Akcijska cena mora biti najmanje 1"),

  body("onAction")
    .optional()
    .isBoolean().withMessage("onAction mora biti boolean"),

  body("measurements.unit")
    .optional()
    .isIn(["cm", "in"]).withMessage("Jedinica mora biti cm ili in"),

  collectValidationErrors,
];

export const validateItemSeo = [
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Opis može imati najviše 2000 karaktera"),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Kratak opis može imati najviše 300 karaktera"),

  // keyWords – prihvata string ili niz, sanitizuje u niz
  body("keyWords")
    .optional()
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return value.split(',').map(k => k.trim()).filter(k => k !== '');
      }
      if (Array.isArray(value)) {
        return value.filter(item => item && item.trim() !== '');
      }
      return [];
    })
    .custom(value => Array.isArray(value))
    .withMessage("Ključne reči moraju biti niz"),

  // FAQ – dozvoli objekat ili niz, sanitizuj
  body("faq")
    .optional()
    .custom(value => {
      if (value === undefined || value === null) return true;
      if (Array.isArray(value)) return true;
      if (typeof value === 'object' && value !== null) return true;
      throw new Error("FAQ mora biti niz ili objekat");
    })
    .customSanitizer(sanitizeFaq),

  body("faq.*.question")
    .optional()
    .trim()
    .notEmpty().withMessage("Pitanje je obavezno"),

  body("faq.*.answer")
    .optional()
    .trim()
    .notEmpty().withMessage("Odgovor je obavezan"),

  body("faq.*.icon")
    .optional()
    .trim(),

  collectValidationErrors,
];

export const validateItemStatus = [
  body("status")
    .trim()
    .notEmpty().withMessage("Status je obavezan")
    .isIn(ITEM_STATUSES).withMessage(`Status mora biti: ${ITEM_STATUSES.join(", ")}`),

  collectValidationErrors,
];

export const validateRelatedItem = [
  body("relatedItemId")
    .trim()
    .notEmpty().withMessage("ID artikla je obavezan")
    .isMongoId().withMessage("Neispravan ID artikla"),

  collectValidationErrors,
];

export const validateItemId = [
  param("itemId")
    .isMongoId().withMessage("Neispravan ID artikla"),

  collectValidationErrors,
];

export const validateVariationId = [
  param("itemId")
    .isMongoId().withMessage("Neispravan ID artikla"),

  param("variationId")
    .isMongoId().withMessage("Neispravan ID varijacije"),

  collectValidationErrors,
];

export default {
  validateItemCreate,
  validateItemUpdate,
  validateVariationAdd,
  validateVariationUpdate,
  validateItemSeo,
  validateItemStatus,
  validateRelatedItem,
  validateItemId,
  validateVariationId,
};