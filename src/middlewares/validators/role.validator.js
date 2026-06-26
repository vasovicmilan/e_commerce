import { body, param } from "express-validator";
import { PERMISSIONS } from "../../models/role.model.js";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateRoleCreate = [
  body("name")
    .trim()
    .notEmpty().withMessage("Naziv role je obavezan")
    .isLength({ min: 2, max: 50 }).withMessage("Naziv mora imati između 2 i 50 karaktera"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Opis može imati najviše 200 karaktera"),

  body("permissions")
    .isArray().withMessage("Permisije moraju biti niz"),

  body("permissions.*")
    .isIn(PERMISSIONS).withMessage("Neispravna permisija"),

  body("isDefault")
    .optional()
    .isBoolean().withMessage("isDefault mora biti boolean"),

  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive mora biti boolean"),

  body("priority")
    .optional()
    .isInt({ min: 0 }).withMessage("Prioritet mora biti pozitivan broj"),

  collectValidationErrors,
];

export const validateRoleUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Naziv mora imati između 2 i 50 karaktera"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Opis može imati najviše 200 karaktera"),

  body("permissions")
    .optional()
    .isArray().withMessage("Permisije moraju biti niz"),

  body("permissions.*")
    .optional()
    .isIn(PERMISSIONS).withMessage("Neispravna permisija"),

  body("isDefault")
    .optional()
    .isBoolean().withMessage("isDefault mora biti boolean"),

  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive mora biti boolean"),

  body("priority")
    .optional()
    .isInt({ min: 0 }).withMessage("Prioritet mora biti pozitivan broj"),

  collectValidationErrors,
];

export const validateRoleId = [
  param("roleId")
    .isMongoId().withMessage("Neispravan ID role"),

  collectValidationErrors,
];

export default {
  validateRoleCreate,
  validateRoleUpdate,
  validateRoleId,
};