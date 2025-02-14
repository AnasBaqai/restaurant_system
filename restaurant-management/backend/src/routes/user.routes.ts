import { Router } from "express";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getAvailableWaiters,
} from "../controllers/user.controller";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../models/user.model";

const router = Router();

// Protect all routes after this middleware
router.use(protect);

// Route accessible by all authenticated users
router.get("/waiters/available", getAvailableWaiters);

// Restrict to admin only
router.use(restrictTo(UserRole.ADMIN));

router.route("/").get(getAllUsers);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
