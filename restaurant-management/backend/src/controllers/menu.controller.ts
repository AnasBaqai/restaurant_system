import { Request, Response, NextFunction } from "express";
import { MenuItem } from "../models/menu.model";
import { AppError } from "../middleware/errorHandler";

// Create a new menu item
export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newMenuItem = await MenuItem.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        menuItem: newMenuItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all menu items
export const getAllMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete query[el]);

    const menuItems = await MenuItem.find(query);

    res.status(200).json({
      status: "success",
      results: menuItems.length,
      data: {
        menuItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get menu item by ID
export const getMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return next(new AppError("No menu item found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        menuItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update menu item
export const updateMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return next(new AppError("No menu item found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        menuItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete menu item
export const deleteMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return next(new AppError("No menu item found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Get menu items by category
export const getMenuItemsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItems = await MenuItem.find({ category: req.params.category });

    res.status(200).json({
      status: "success",
      results: menuItems.length,
      data: {
        menuItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search menu items
export const searchMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query } = req.query;
    const menuItems = await MenuItem.find({
      $text: { $search: query as string },
    });

    res.status(200).json({
      status: "success",
      results: menuItems.length,
      data: {
        menuItems,
      },
    });
  } catch (error) {
    next(error);
  }
};
