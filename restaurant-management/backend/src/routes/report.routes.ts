import { Router } from "express";
import {
  getDailySalesReport,
  getWaiterPerformanceReport,
  getInventoryReport,
  getMonthlyRevenueReport,
} from "../controllers/report.controller";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../models/user.model";

const router = Router();

// Protect all routes after this middleware
router.use(protect);

// Restrict to admin and manager only
router.use(restrictTo(UserRole.ADMIN, UserRole.MANAGER));

router.get("/daily-sales", getDailySalesReport);
router.get("/waiter-performance", getWaiterPerformanceReport);
router.get("/inventory", getInventoryReport);
router.get("/monthly-revenue", getMonthlyRevenueReport);

export default router;
