import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateTestimonialSubmit = [
  body("rating")
    .isInt({ min: 1, max: 5 }).withMessage("Ocena mora biti između 1 i 5"),

  body("comment")
    .trim()
    .notEmpty().withMessage("Komentar je obavezan")
    .isLength({ min: 10, max: 1000 }).withMessage("Komentar mora imati između 10 i 1000 karaktera"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Naslov može imati najviše 200 karaktera"),

  body("displayName")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Ime može imati najviše 50 karaktera"),

  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  collectValidationErrors,
];

export const validateTestimonialApprove = [
  body("approvedBy")
    .trim()
    .notEmpty().withMessage("ID administratora je obavezan")
    .isMongoId().withMessage("Neispravan ID administratora"),

  collectValidationErrors,
];

export const validateTestimonialFeatured = [
  body("isFeatured")
    .isBoolean().withMessage("isFeatured mora biti boolean"),

  collectValidationErrors,
];

export const validateTestimonialUpdate = [
  body("displayName")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Ime može imati najviše 50 karaktera"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Naslov može imati najviše 200 karaktera"),

  body("comment")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage("Komentar mora imati između 10 i 1000 karaktera"),

  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive mora biti boolean"),

  collectValidationErrors,
];

export const validateTestimonialId = [
  param("testimonialId")
    .isMongoId().withMessage("Neispravan ID testimonial-a"),

  collectValidationErrors,
];

export default {
  validateTestimonialSubmit,
  validateTestimonialApprove,
  validateTestimonialFeatured,
  validateTestimonialUpdate,
  validateTestimonialId,
};