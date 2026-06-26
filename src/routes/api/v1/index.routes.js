import { Router } from "express";
import shopRoutes from "./shop.routes.js";

const router = Router();

router.use("/shop", shopRoutes);

export default router;