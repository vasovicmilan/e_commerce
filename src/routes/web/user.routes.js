import { Router } from "express";
import * as UserController from "../../controllers/web/auth/user.controller.js";
import {
  validateChangePassword,
  validateDeactivateAccount,
} from "../../middlewares/validators/auth.validator.js";

const router = Router();

router.get("/moj-profil", UserController.myProfile);
router.post("/moj-profil", UserController.updateProfile);

router.post("/moj-profil/telefon", UserController.addTelephone);
router.delete("/moj-profil/telefon/:telephoneId", UserController.removeTelephone);

router.post("/moj-profil/adresa", UserController.addAddress);
router.delete("/moj-profil/adresa/:addressId", UserController.removeAddress);

router.get("/porudzbine", UserController.myOrders);
router.get("/porudzbine/:orderId", UserController.orderDetails);
router.post("/porudzbine/:orderId/otkazi", UserController.cancelOrder);

router.get("/moja-prodavnica", UserController.myShop);

router.get("/podesavanja", UserController.settings);
router.post("/podesavanja/lozinka", validateChangePassword, UserController.changePassword);
router.post("/podesavanja/deaktiviraj", validateDeactivateAccount, UserController.deactivateAccount);

export default router;