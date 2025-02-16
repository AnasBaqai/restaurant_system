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

// Routes for managers and admin
router.use(restrictTo(UserRole.MANAGER, UserRole.ADMIN));
router.patch("/:id/status", updateTableStatus);
router.patch("/:id/waiter", assignWaiter);
router.post("/", createTable);
router.delete("/:id", deleteTable);

export default router;
