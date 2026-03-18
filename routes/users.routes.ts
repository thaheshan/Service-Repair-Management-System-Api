import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "@/controllers/user.controller";
import {
  sendVerification,
  verifyEmail,
} from "@/controllers/shop.controller";
import { Router } from "express";
import { authorizeRoles } from "@/middlewares/auth.middleware";

const router = Router();

// CRUD
router.get("/", authorizeRoles("ADMIN"), getUsers);
router.get("/:id", authorizeRoles("ADMIN"), getUserById);
router.post("/", authorizeRoles("ADMIN"), createUser);
router.patch("/:id", authorizeRoles("ADMIN"), updateUser);
router.delete("/:id", authorizeRoles("ADMIN"), deleteUser);

// Verification (must be before /:id routes)
router.get("/verify-email", verifyEmail);
router.post("/send-verification", sendVerification);


export default router;