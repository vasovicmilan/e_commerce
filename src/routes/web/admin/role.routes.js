import { Router } from "express";
import * as RoleController from "../../../controllers/web/admin/auth/role.controller.js";
import {
  validateRoleCreate,
  validateRoleUpdate,
  validateRoleId,
} from "../../../middlewares/validators/role.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", RoleController.listRoles);

router.get(
  "/detalji/:roleId",
  validateRoleId,
  RoleController.roleDetails
);

router.get(
  "/izmena/:roleId",
  validateRoleId,
  RoleController.roleDetails
);

router.get(
  "/novo",
  RoleController.newRoleForm
);

router.get(
  "/pretraga/:search",
  RoleController.listRoles
);

router.post(
  "/",
  validateRoleCreate,
  RoleController.createRole
);

router.post(
  "/pretraga",
  validateSearch,
  RoleController.searchRedirect
);

router.put(
  "/:roleId",
  validateRoleId,
  validateRoleUpdate,
  RoleController.updateRole
);

router.delete(
  "/:roleId",
  validateRoleId,
  RoleController.deleteRole
);

export default router;