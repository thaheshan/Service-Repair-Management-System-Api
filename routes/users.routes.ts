import { createUser, deleteUser, getUserById, getUsers, updateUser } from "@/controllers/user.controller";
import { Router } from "express";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;