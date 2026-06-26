import { Router } from "express";
import * as NewsletterController from "../../../controllers/web/admin/newsletter.controller.js";
import {
  validateNewsletterStatus,
  validateNewsletterId,
} from "../../../middlewares/validators/newsletter.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", NewsletterController.listNewsletters);

router.get(
  "/detalji/:newsletterId",
  validateNewsletterId,
  NewsletterController.newsletterDetails
);

router.get(
  "/pretraga/:search",
  NewsletterController.listNewsletters
);

router.post(
  "/pretraga",
  validateSearch,
  NewsletterController.searchRedirect
);

router.put(
  "/:newsletterId/status",
  validateNewsletterId,
  validateNewsletterStatus,
  NewsletterController.updateStatus
);

router.delete(
  "/:newsletterId",
  validateNewsletterId,
  NewsletterController.deleteNewsletter
);

export default router;