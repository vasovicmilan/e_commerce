import { Router } from "express";
import * as CustomerController from "../../../controllers/web/admin/auth/customer.controller.js";
import {
  validateCustomerUpdate,
  validateCustomerId,
} from "../../../middlewares/validators/customer.validator.js";
import { validateSearch } from "../../../middlewares/validators/search.validator.js";

const router = Router();

router.get("/", CustomerController.listCustomers);

router.get(
  "/detalji/:customerId",
  validateCustomerId,
  CustomerController.customerDetails
);

router.get(
  "/izmena/:customerId",
  validateCustomerId,
  CustomerController.customerDetails
);

router.get(
  "/pretraga/:search",
  CustomerController.listCustomers
);

router.post(
  "/pretraga",
  validateSearch,
  CustomerController.searchRedirect
);

router.put(
  "/:customerId",
  validateCustomerId,
  validateCustomerUpdate,
  CustomerController.updateCustomer
);

router.delete(
  "/:customerId",
  validateCustomerId,
  CustomerController.deleteCustomer
);

export default router;