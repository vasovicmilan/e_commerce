import { Router } from "express";
import { optionalApiAuth } from "../../../middlewares/auth.middleware.js";
import * as ApiShopController from "../../../controllers/api/v1/shop/shop.controller.js";
import { cartLimiter } from "../../../middlewares/rate.limiter.middleware.js";
import {
  validateAddToCart,
  validateRemoveFromCart,
  validateClearCart,
  validateApplyCoupon,
  validateRemoveCoupon,
  validateToggleWishlist,
  validateAddRating,
  validateRemoveRating,
} from "../../../middlewares/validators/cart.validator.js";

const router = Router();

router.use(optionalApiAuth);
router.use(cartLimiter);

// KORPA
router.post("/cart/add", validateAddToCart, ApiShopController.addToCart);
router.post("/cart/remove", validateRemoveFromCart, ApiShopController.removeFromCart);
router.post("/cart/clear", validateClearCart, ApiShopController.clearCart);
router.get("/cart/count", ApiShopController.getCartCount);

// KUPONI
router.post("/cart/coupon", validateApplyCoupon, ApiShopController.applyCoupon);
router.delete("/cart/coupon", validateRemoveCoupon, ApiShopController.removeCoupon);

// LISTA ŽELJA
router.post("/wishlist/toggle", validateToggleWishlist, ApiShopController.toggleWishlist);

// OCENE
router.post("/ratings", validateAddRating, ApiShopController.addRating);
router.delete("/ratings", validateRemoveRating, ApiShopController.removeRating);

export default router;