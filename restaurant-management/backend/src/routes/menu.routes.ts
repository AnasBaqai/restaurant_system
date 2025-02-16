import { Router } from "express";
import {
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menu.controller";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../models/user.model";

const router = Router();

// Protect all routes after this middleware
router.use(protect);

// Public routes (accessible by all authenticated users)
router.get("/", getAllMenuItems);
router.get("/:id", getMenuItem);

// Admin and Manager only routes
router.use(restrictTo(UserRole.ADMIN, UserRole.MANAGER));
router.post("/", createMenuItem);
router.patch("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

export default router;
