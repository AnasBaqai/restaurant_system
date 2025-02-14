import { Router } from "express";
import {
  getAllTables,
  getTable,
  createTable,
  updateTableStatus,
  assignWaiter,
  deleteTable,
  getAvailableTables,
} from "../controllers/table.controller";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../models/user.model";

const router = Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible by all authenticated users
router.get("/", getAllTables);
router.get("/available", getAvailableTables);
router.get("/:id", getTable);

// Routes for waiters and admin
router.use(restrictTo(UserRole.WAITER, UserRole.ADMIN));
router.patch("/:id/status", updateTableStatus);
router.patch("/:id/waiter", assignWaiter);

// Admin only routes
router.use(restrictTo(UserRole.ADMIN));
router.post("/", createTable);
router.delete("/:id", deleteTable);

export default router;
