import { Router } from "express";
import {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  processPayment,
  getOrdersByTable,
  getOrdersByWaiter,
} from "../controllers/order.controller";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../models/user.model";

const router = Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible by all authenticated users
router.get("/", getAllOrders);
router.get("/table/:tableNumber", getOrdersByTable);
router.get("/waiter/:waiterId", getOrdersByWaiter);
router.get("/:id", getOrder);

// Routes for waiters and admin
router.use(restrictTo(UserRole.WAITER, UserRole.ADMIN));
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment", processPayment);

export default router;
