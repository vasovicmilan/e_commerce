import { Router } from "express";
import * as TagController from "../../../controllers/web/admin/taxonomy/tag.controller.js";
import {
  validateTagCreate,
  validateTagUpdate,
  validateTagId,
} from "../../../middlewares/validators/tag.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", TagController.listTags);

router.get(
  "/detalji/:tagId",
  validateTagId,
  TagController.tagDetails
);

router.get(
  "/izmena/:tagId",
  validateTagId,
  TagController.tagDetails
);

router.get(
  "/novo",
  TagController.newTagForm
);

router.get(
  "/pretraga/:search",
  TagController.listTags
);

router.post(
  "/",
  validateTagCreate,
  TagController.createTag
);

router.post(
  "/pretraga",
  validateSearch,
  TagController.searchRedirect
);

router.put(
  "/:tagId",
  validateTagId,
  validateTagUpdate,
  TagController.updateTag
);

router.delete(
  "/:tagId",
  validateTagId,
  TagController.deleteTag
);

export default router;