import { Router } from "express";
import * as CouponController from "../../../controllers/web/admin/shop/coupon.controller.js";
import {
  validateCouponCreate,
  validateCouponUpdate,
  validateCouponId,
} from "../../../middlewares/validators/coupon.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", CouponController.listCoupons);

router.get(
  "/detalji/:couponId",
  validateCouponId,
  CouponController.couponDetails
);

router.get(
  "/izmena/:couponId",
  validateCouponId,
  CouponController.couponDetails
);

router.get(
  "/novo",
  CouponController.newCouponForm
);

router.get(
  "/pretraga/:search",
  CouponController.listCoupons
);

router.post(
  "/",
  validateCouponCreate,
  CouponController.createCoupon
);

router.post(
  "/pretraga",
  validateSearch,
  CouponController.searchRedirect
);

router.put(
  "/:couponId",
  validateCouponId,
  validateCouponUpdate,
  CouponController.updateCoupon
);

router.delete(
  "/:couponId",
  validateCouponId,
  CouponController.deleteCoupon
);

export default router;