import {
  addCustomer,
  searchCustomer,
  listCustomers,
  getCustomer,
  editCustomer,
  removeCustomer,
} from "@/controllers/customer.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

// Search must be before /:customerId
router.get("/search", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), searchCustomer);
router.get("/", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), listCustomers);
router.post("/", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), addCustomer);
router.get("/:customerId", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getCustomer);
router.put("/:customerId", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), editCustomer);
router.delete("/:customerId", authorizeRoles("ADMIN"), removeCustomer);

export default router;