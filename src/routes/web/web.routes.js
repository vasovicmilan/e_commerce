import { Router } from "express";
import { webAuthMiddleware } from "../../middlewares/auth.middleware.js";
import * as IndexController from "../../controllers/web/index.controller.js";
import {
  contactLimiter,
  newsletterLimiter,
  testimonialLimiter,
} from "../../middlewares/rate.limiter.middleware.js";
import { validateContactCreate } from "../../middlewares/validators/contact.validator.js";
import { validateNewsletterSubscribe } from "../../middlewares/validators/newsletter.validator.js";
import { validateTestimonialSubmit } from "../../middlewares/validators/testimonial.validator.js";
import { validateHoneypot } from "../../middlewares/validators/spam.validator.js";

import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import shopRoutes from "./shop.routes.js";
import blogRoutes from "./blog.routes.js";
import userRoutes from "./user.routes.js";

import { seedRoles } from "../../database/seeds/roles.seed.js";

const router = Router();

router.get("/", IndexController.homePage);

// Statičke stranice
router.get("/o-nama", IndexController.aboutPage);
router.get("/politika-privatnosti", IndexController.privacyPage);
router.get("/uslovi-koriscenja", IndexController.termsPage);
router.get("/partnerstva", IndexController.partnershipPage);
router.get("/kontakt", IndexController.contactPage);
router.get("/faq", IndexController.faqPage);

router.post(
  "/kontakt",
  contactLimiter,
  validateHoneypot,
  validateContactCreate,
  IndexController.submitContact
);

router.post(
  "/newsletter/prijava",
  newsletterLimiter,
  validateHoneypot,
  validateNewsletterSubscribe,
  IndexController.submitNewsletter
);

router.post(
  "/testimonials/posalji",
  testimonialLimiter,
  validateHoneypot,
  validateTestimonialSubmit,
  IndexController.submitTestimonial
);

router.get("/newsletter/odjava", IndexController.unsubscribeNewsletter);

router.use("/prodavnica", shopRoutes);
router.use("/blog", blogRoutes);

router.use("/auth", authRoutes);


router.use("/admin", webAuthMiddleware, adminRoutes);
router.use("/profil", webAuthMiddleware, userRoutes);


// router.get("/seed/roles", async (req, res) => {
//   try {
//     await seedRoles();
//     res.json({ success: true, message: "Roles seeded successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

export default router;