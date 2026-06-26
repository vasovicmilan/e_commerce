import { Router } from "express";
import * as HistoryController from "../../../controllers/web/admin/auth/history.controller.js";
import {
  validateHistoryId,
} from "../../../middlewares/validators/history.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", HistoryController.listHistory);

router.get(
  "/detalji/:historyId",
  validateHistoryId,
  HistoryController.historyDetails
);

router.get(
  "/pretraga/:search",
  HistoryController.listHistory
);

router.post(
  "/pretraga",
  validateSearch,
  HistoryController.searchRedirect
);

router.delete(
  "/:historyId",
  validateHistoryId,
  HistoryController.deleteHistory
);

export default router;