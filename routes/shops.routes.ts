import { createShop, deleteShop, getShopById, getShops, updateShop } from "@/controllers/shop.controller";
import { Router } from "express";

const router = Router();

router.get("/", getShops);
router.get("/:id", getShopById);
router.post("/", createShop);
router.patch("/:id", updateShop);
router.delete("/:id", deleteShop);

export default router;