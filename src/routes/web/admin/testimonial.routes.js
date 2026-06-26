import { Router } from "express";
import * as TestimonialController from "../../../controllers/web/admin/testimonial.controller.js";
import {
  validateTestimonialApprove,
  validateTestimonialFeatured,
  validateTestimonialUpdate,
  validateTestimonialId,
} from "../../../middlewares/validators/testimonial.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", TestimonialController.listTestimonials);

router.get(
  "/detalji/:testimonialId",
  validateTestimonialId,
  TestimonialController.testimonialDetails
);

router.get(
  "/pretraga/:search",
  TestimonialController.listTestimonials
);

router.post(
  "/pretraga",
  validateSearch,
  TestimonialController.searchRedirect
);

router.put(
  "/:testimonialId/odobri",
  validateTestimonialId,
  validateTestimonialApprove,
  TestimonialController.approveTestimonial
);

router.put(
  "/:testimonialId/istakni",
  validateTestimonialId,
  validateTestimonialFeatured,
  TestimonialController.toggleFeatured
);

router.put(
  "/:testimonialId",
  validateTestimonialId,
  validateTestimonialUpdate,
  TestimonialController.updateTestimonial
);

router.delete(
  "/:testimonialId",
  validateTestimonialId,
  TestimonialController.deleteTestimonial
);

export default router;