import { createUser, deleteUser, getUserById, getUsers, updateUser } from "@/controllers/user.controller";
import { Router } from "express";
import { authorizeRoles } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", authorizeRoles("ADMIN"), getUsers);
router.get("/:id", authorizeRoles("ADMIN"), getUserById);
router.post("/", authorizeRoles("ADMIN"), createUser);
router.patch("/:id", authorizeRoles("ADMIN"), updateUser);
router.delete("/:id", authorizeRoles("ADMIN"), deleteUser);

export default router;