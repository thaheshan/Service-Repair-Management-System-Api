import { createRepair, deleteRepair, getRepairById, getRepairs, updateRepair } from "@/controllers/repair.controller";
import { Router } from "express";

const router = Router();

router.get("/", getRepairs);
router.get("/:id", getRepairById);
router.post("/", createRepair);
router.patch("/:id", updateRepair);
router.delete("/:id", deleteRepair);

export default router;