import { Router } from "express";
import * as BlogController from "../../controllers/web/blog/blog.controller.js";
import { searchLimiter } from "../../middlewares/rate.limiter.middleware.js";

const router = Router();

router.get("/", BlogController.blogHome);
router.get("/pretraga", searchLimiter, BlogController.blogSearch);
router.get("/:slug", BlogController.blogPost);
router.get("/kategorija/:slug", BlogController.blogCategory);
router.get("/tag/:slug/:type", BlogController.blogTag);

export default router;