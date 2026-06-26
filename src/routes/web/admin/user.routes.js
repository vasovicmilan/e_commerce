import { Router } from "express";
import * as UserController from "../../../controllers/web/admin/auth/user.controller.js";
import {
  validateUserUpdate,
  validateUserStatus,
  validateUserRole,
  validateUserId,
  validateUserPartner,
} from "../../../middlewares/validators/user.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";
import { csrfAfterMulter } from "../../../config/csrf.config.js";
import { processUpload } from "../../../config/multer.config.js";

const router = Router();

// ==================== GET ====================
router.get("/", UserController.listUsers);
router.get("/detalji/:userId", validateUserId, UserController.userDetails);
router.get("/izmena/:userId", validateUserId, UserController.userDetails);
router.get("/pretraga/:search", UserController.listUsers);
router.get("/:userId/partner/edit", validateUserId, UserController.editPartnerForm);

// ==================== POST ====================
router.post("/pretraga", validateSearch, UserController.searchRedirect);

// ==================== PUT - SPECIFIČNE RUTE PRVO ====================
router.put(
  "/:userId/partner/data",
  validateUserId,
  ...processUpload("partnerLogo", "partners"),
  csrfAfterMulter,
  UserController.updatePartnerData
);

router.put(
  "/:userId/partner",
  validateUserId,
  validateUserPartner,
  UserController.updateUserPartner
);

router.put(
  "/:userId/status",
  validateUserId,
  validateUserStatus,
  UserController.updateUserStatus
);

router.put(
  "/:userId/rola",
  validateUserId,
  validateUserRole,
  UserController.updateUserRole
);

router.put(
  "/:userId/verifikuj",
  validateUserId,
  UserController.verifyUser
);

// ==================== PUT - OPŠTA RUTA ZA KRAJ ====================
router.put(
  "/:userId",
  validateUserId,
  validateUserUpdate,
  UserController.updateUser
);

// ==================== DELETE ====================
router.delete("/:userId", validateUserId, UserController.deleteUser);

export default router;