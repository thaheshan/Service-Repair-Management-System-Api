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

const router = Router();

// Verification (must be before /:id routes)
router.get("/verify-email", verifyEmail);
router.post("/send-verification", sendVerification);

// CRUD
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;