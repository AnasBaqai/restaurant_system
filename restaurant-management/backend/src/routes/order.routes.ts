import { Router } from "express";
import {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  processPayment,
  getOrdersByTable,
  getOrdersByWaiter,
  generateOrderReceipt,
  updateOrderTable,
  updateOrder,
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
router.get("/:id/receipt", generateOrderReceipt);

// Routes for waiters and admin
router.use(restrictTo(UserRole.WAITER, UserRole.ADMIN));
router.post("/", createOrder);
router.patch("/:id", updateOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment", processPayment);
router.patch("/:id/table", updateOrderTable);

export default router;
