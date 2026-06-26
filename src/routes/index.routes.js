import { Router } from "express";
import { apiLimiter } from "../middlewares/rate.limiter.middleware.js";
import webRoutes from "./web/web.routes.js";
import apiRoutes from "./api/api.routes.js";

const router = Router();

router.use("/api", apiLimiter, apiRoutes);

router.use("/", webRoutes);

export default router;