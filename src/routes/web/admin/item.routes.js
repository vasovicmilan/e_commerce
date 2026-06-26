import { Router } from "express";
import * as ItemController from "../../../controllers/web/admin/shop/item.controller.js";
import {
  validateItemCreate,
  validateItemUpdate,
  validateVariationAdd,
  validateVariationUpdate,
  validateItemSeo,
  validateItemStatus,
  validateItemId,
  validateVariationId,
} from "../../../middlewares/validators/item.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";
import { csrfAfterMulter } from "../../../config/csrf.config.js";
import { processUpload, processMultipleUploads } from "../../../config/multer.config.js";

const router = Router();

router.get("/", ItemController.listItems);

router.get("/novo", ItemController.newItemForm);

router.get(
  "/detalji/:itemId",
  validateItemId,
  ItemController.itemDetails
);

router.get(
  "/izmena/:itemId",
  validateItemId,
  ItemController.itemDetails
);

router.get(
  "/pretraga/:search",
  ItemController.listItems
);

router.get(
  "/:itemId/varijacije",
  validateItemId,
  ItemController.variationsPage
);

router.get(
  "/:itemId/seo",
  validateItemId,
  ItemController.seoPage
);

router.post(
  "/",
  ...processMultipleUploads([
    { name: "featureImage", maxCount: 1, type: "items" },
    { name: "video", maxCount: 1, type: "items" }, // DODATO
  ]),
  csrfAfterMulter,
  validateItemCreate,
  ItemController.createItem
);

router.post(
  "/pretraga",
  validateSearch,
  ItemController.searchRedirect
);

router.post(
  "/:itemId/varijacije",
  validateItemId,
  ...processUpload("variationImage", "items"),
  csrfAfterMulter,
  validateVariationAdd,
  ItemController.addVariation
);

router.put(
  "/:itemId/varijacije/:variationId",
  validateVariationId,
  ...processUpload("variationImage", "items"),
  csrfAfterMulter,
  validateVariationUpdate,
  ItemController.updateVariation
);

router.delete(
  "/:itemId/varijacije/:variationId",
  validateVariationId,
  ItemController.removeVariation
);

router.put(
  "/:itemId/seo",
  validateItemId,
  validateItemSeo,
  ItemController.updateSeo
);

router.put(
  "/:itemId",
  validateItemId,
  ...processMultipleUploads([
    { name: "featureImage", maxCount: 1, type: "items" },
    { name: "video", maxCount: 1, type: "items" },
  ]),
  csrfAfterMulter,
  validateItemUpdate,
  ItemController.updateItem
);

router.put(
  "/:itemId/status",
  validateItemId,
  validateItemStatus,
  ItemController.updateStatus
);

router.delete(
  "/:itemId",
  validateItemId,
  ItemController.deleteItem
);

export default router;