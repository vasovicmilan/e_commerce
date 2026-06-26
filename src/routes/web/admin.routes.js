import { Router } from "express";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { adminSeoMiddleware } from "../../middlewares/admin-seo.middleware.js";
import { adminLimiter } from "../../middlewares/rate.limiter.middleware.js";
import { dashboard } from "../../controllers/web/admin/index.controller.js";
import categoryRoutes from "./admin/category.routes.js";
import tagRoutes from "./admin/tag.routes.js";
import itemRoutes from "./admin/item.routes.js";
import postRoutes from "./admin/post.routes.js";
import userRoutes from "./admin/user.routes.js";
import customerRoutes from "./admin/customer.routes.js";
import orderRoutes from "./admin/order.routes.js";
import tempOrderRoutes from "./admin/temporary.order.routes.js";
import couponRoutes from "./admin/coupon.routes.js";
import contactRoutes from "./admin/contact.routes.js";
import newsletterRoutes from "./admin/newsletter.routes.js";
import testimonialRoutes from "./admin/testimonial.routes.js";
import historyRoutes from "./admin/history.routes.js";
import roleRoutes from "./admin/role.routes.js";

const router = Router();

router.use(adminMiddleware);
router.use(adminSeoMiddleware);
router.use(adminLimiter);

router.get("/dashboard", dashboard);

router.use("/kategorije", categoryRoutes);
router.use("/tagovi", tagRoutes);
router.use("/artikli", itemRoutes);
router.use("/blog", postRoutes);
router.use("/korisnici", userRoutes);
router.use("/kupci", customerRoutes);
router.use("/porudzbine", orderRoutes);
router.use("/privremene-porudzbine", tempOrderRoutes);
router.use("/kuponi", couponRoutes);
router.use("/kontakt", contactRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/testimoniali", testimonialRoutes);
router.use("/istorija", historyRoutes)
router.use("/uloge", roleRoutes);

export default router;