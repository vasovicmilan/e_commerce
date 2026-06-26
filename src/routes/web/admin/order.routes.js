import { Router } from "express";
import * as OrderController from "../../../controllers/web/admin/shop/order.controller.js";
import {
  validateOrderStatusUpdate,
  validateOrderId,
} from "../../../middlewares/validators/order.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", OrderController.listOrders);

router.get(
  "/detalji/:orderId",
  validateOrderId,
  OrderController.orderDetails
);

router.get(
  "/pretraga/:search",
  OrderController.listOrders
);

router.put(
  "/:orderId/status",
  validateOrderId,
  validateOrderStatusUpdate,
  OrderController.updateStatus
);

router.put(
  "/:orderId/kontakt",
  validateOrderId,
  OrderController.updateContactInfo
);

router.post(
  "/pretraga",
  validateSearch,
  OrderController.searchRedirect
);

export default router;