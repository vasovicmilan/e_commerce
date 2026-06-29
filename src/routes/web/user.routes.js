import { Router } from "express";
import * as UserController from "../../controllers/web/auth/user.controller.js";
import {
  validateChangePassword,
  validateDeactivateAccount,
} from "../../middlewares/validators/auth.validator.js";

const router = Router();

// ----- Glavne rute profila (svi vode na isti kontroler sa tab parametrom) -----
router.get("/", UserController.profile);
router.get("/moj-profil", UserController.profile);
router.get("/porudzbine", UserController.profile);
router.get("/zelje", UserController.profile);
router.get("/moja-prodavnica", UserController.profile);
router.get("/podesavanja", UserController.profile);

// ----- Akcije -----
router.post("/moj-profil", UserController.updateProfile);

router.post("/moj-profil/telefon", UserController.addTelephone);
router.delete("/moj-profil/telefon/:telephoneId", UserController.removeTelephone);

router.post("/moj-profil/adresa", UserController.addAddress);
router.delete("/moj-profil/adresa/:addressId", UserController.removeAddress);

router.post("/zelje/ukloni/:itemId", UserController.removeFromWishlist);

router.get("/porudzbine/:orderId", UserController.orderDetails);
router.post("/porudzbine/:orderId/otkazi", UserController.cancelOrder);

router.post("/podesavanja/lozinka", validateChangePassword, UserController.changePassword);
router.post("/podesavanja/deaktiviraj", validateDeactivateAccount, UserController.deactivateAccount);

export default router;