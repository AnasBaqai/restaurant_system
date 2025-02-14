import { Request, Response, NextFunction } from "express";
import { User, UserRole, IUser } from "../models/user.model";
import { Table } from "../models/table.model";
import { AppError } from "../middleware/errorHandler";
import { HydratedDocument } from "mongoose";

// Get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get available waiters (not assigned to any table)
export const getAvailableWaiters = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all waiters
    const waiters = await User.find({
      role: UserRole.WAITER,
      active: true,
    }).lean();

    // Get all tables with assigned waiters
    const assignedTables = await Table.find({ currentWaiter: { $ne: null } });
    const assignedWaiterIds = assignedTables.map((table) =>
      table.currentWaiter?.toString()
    );

    // Filter out waiters who are already assigned
    const availableWaiters = waiters.filter((waiter) => {
      return !assignedWaiterIds.includes(String(waiter._id));
    });

    console.log("Available waiters found:", {
      totalWaiters: waiters.length,
      assignedWaiters: assignedWaiterIds.length,
      availableWaiters: availableWaiters.length,
    });

    res.status(200).json({
      status: "success",
      data: {
        users: availableWaiters,
      },
    });
  } catch (error) {
    console.error("Error fetching available waiters:", error);
    next(error);
  }
};

// Get user by ID
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
