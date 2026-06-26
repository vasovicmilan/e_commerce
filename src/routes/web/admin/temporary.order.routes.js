import { Router } from "express";
import * as TempOrderController from "../../../controllers/web/admin/shop/temporary-order.controller.js";
import {
  validateAdminConfirm,   // 🔥 koristimo za admina
  validateTempOrderId,
} from "../../../middlewares/validators/temporary-order.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", TempOrderController.listTemporaryOrders);

router.get(
  "/detalji/:orderId",
  validateTempOrderId,
  TempOrderController.temporaryOrderDetails
);

router.get(
  "/pretraga/:search",
  TempOrderController.listTemporaryOrders
);

router.post(
  "/:orderId/potvrdi",
  validateTempOrderId,
  validateAdminConfirm,
  TempOrderController.confirmOrder
);

router.post(
  "/pretraga",
  validateSearch,
  TempOrderController.searchRedirect
);

export default router;