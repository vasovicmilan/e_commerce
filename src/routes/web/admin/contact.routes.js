import { Router } from "express";
import * as ContactController from "../../../controllers/web/admin/contact.controller.js";
import {
  validateContactStatus,
  validateContactId,
} from "../../../middlewares/validators/contact.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", ContactController.listContacts);

router.get(
  "/detalji/:contactId",
  validateContactId,
  ContactController.contactDetails
);

router.get(
  "/pretraga/:search",
  ContactController.listContacts
);

router.post(
  "/pretraga",
  validateSearch,
  ContactController.searchRedirect
);

router.put(
  "/:contactId/status",
  validateContactId,
  validateContactStatus,
  ContactController.updateStatus
);

export default router;