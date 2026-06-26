import { body } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateSearch = [
  body("search")
    .optional({ values: "falsy" })
    .isString().withMessage("Pretraga mora biti tekst")
    .trim()
    .isLength({ max: 100 }).withMessage("Pretraga može imati najviše 100 karaktera")
    .escape(),

  collectValidationErrors,
];

export default {
  validateSearch,
};