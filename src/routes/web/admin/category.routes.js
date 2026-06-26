import { Router } from "express";
import * as CategoryController from "../../../controllers/web/admin/taxonomy/category.controller.js";
import {
  validateCategoryCreate,
  validateCategoryUpdate,
  validateCategoryId,
} from "../../../middlewares/validators/category.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";
import { csrfAfterMulter } from "../../../config/csrf.config.js";
import { processUpload } from "../../../config/multer.config.js";

const router = Router();

router.get("/", CategoryController.listCategories);
router.get("/detalji/:categoryId", validateCategoryId, CategoryController.categoryDetails);
router.get("/dodavanje", CategoryController.newCategoryForm);
router.get("/izmena/:categoryId", validateCategoryId, CategoryController.categoryDetails);
router.get("/pretraga/:search", CategoryController.listCategories);

router.post(
  "/",
  ...processUpload("categoryImage", "categories"),
  csrfAfterMulter,
  validateCategoryCreate,
  CategoryController.createCategory
);

router.post("/pretraga", validateSearch, CategoryController.searchRedirect);

router.put(
  "/:categoryId",
  validateCategoryId,
  ...processUpload("categoryImage", "categories"),
  csrfAfterMulter,
  validateCategoryUpdate,
  CategoryController.updateCategory
);

router.delete("/:categoryId", validateCategoryId, CategoryController.deleteCategory);

export default router;