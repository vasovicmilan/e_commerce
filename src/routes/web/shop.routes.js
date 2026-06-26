import { Router } from "express";
import { optionalWebAuth } from "../../middlewares/auth.middleware.js";
import * as ShopController from "../../controllers/web/shop/shop.controller.js";
import {
  cartLimiter,
  checkoutLimiter,
  searchLimiter,
} from "../../middlewares/rate.limiter.middleware.js";
import { validateTemporaryOrderCreate } from "../../middlewares/validators/temporary-order.validator.js";
import { validateCouponApply } from "../../middlewares/validators/coupon.validator.js";
import { validateHoneypot } from "../../middlewares/validators/spam.validator.js";

const router = Router();

router.use(optionalWebAuth);

router.get("/", ShopController.shopHome);
router.get("/istaknuto", ShopController.featuredItems);
router.get("/akcija", ShopController.actionedItems);
router.get("/svi", ShopController.allItems);
router.get("/pretraga", searchLimiter, ShopController.searchItems);
router.get("/artikal/:slug", ShopController.itemDetails);
router.get("/kategorija/:slug", ShopController.categoryItems);
router.get("/tag/:slug/:type", ShopController.tagItems);

router.get("/korpa", ShopController.cart);

router.get("/checkout", ShopController.checkout);
router.post(
  "/checkout",
  checkoutLimiter,
  validateHoneypot,
  validateTemporaryOrderCreate,
  ShopController.createOrder
);

router.get("/porudzbina/potvrdi", ShopController.confirmOrder);
router.get("/porudzbina/otkazi", ShopController.cancelOrder);

export default router;