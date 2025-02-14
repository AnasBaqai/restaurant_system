import { Request, Response, NextFunction } from "express";
import { Order, OrderStatus } from "../models/order.model";
import { User, UserRole } from "../models/user.model";
import { MenuItem, IMenuItem } from "../models/menu.model";
import { Types } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { Model } from "mongoose";

// Get daily sales report
export const getDailySalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const date = new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: OrderStatus.COMPLETED,
    }).populate("items.menuItem", "name category price");

    const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = orders.length;

    // Calculate sales by category
    const salesByCategory = new Map();
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        const category = item.menuItem.category;
        const itemTotal = item.subtotal;
        if (salesByCategory.has(category)) {
          salesByCategory.set(
            category,
            salesByCategory.get(category) + itemTotal
          );
        } else {
          salesByCategory.set(category, itemTotal);
        }
      });
    });

    res.status(200).json({
      status: "success",
      data: {
        date: startOfDay,
        totalSales,
        totalOrders,
        salesByCategory: Object.fromEntries(salesByCategory),
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get waiter performance report
export const getWaiterPerformanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const waiters = await User.find({ role: UserRole.WAITER });
    const waiterStats = [];

    for (const waiter of waiters) {
      const orders = await Order.find({
        waiter: waiter._id,
        createdAt: { $gte: start, $lte: end },
        status: OrderStatus.COMPLETED,
      });

      const totalOrders = orders.length;
      const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      waiterStats.push({
        waiter: {
          id: waiter._id,
          name: waiter.name,
        },
        totalOrders,
        totalSales,
        averageOrderValue,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        startDate: start,
        endDate: end,
        waiterStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory report
export const getInventoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: OrderStatus.COMPLETED,
    }).populate("items.menuItem");

    const menuItems = await MenuItem.find().exec();
    const inventoryStats = new Map<
      string,
      {
        name: string;
        category: string;
        totalQuantitySold: number;
        totalRevenue: number;
      }
    >();

    for (const item of menuItems) {
      const doc = item as unknown as IMenuItem;
      inventoryStats.set(item.id, {
        name: doc.name,
        category: doc.category,
        totalQuantitySold: 0,
        totalRevenue: 0,
      });
    }

    // Calculate inventory stats
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        const itemId = item.menuItem._id.toString();
        const stats = inventoryStats.get(itemId);
        if (stats) {
          stats.totalQuantitySold += item.quantity;
          stats.totalRevenue += item.subtotal;
        }
      });
    });

    res.status(200).json({
      status: "success",
      data: {
        startDate: start,
        endDate: end,
        inventoryStats: Array.from(inventoryStats.values()),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly revenue report
export const getMonthlyRevenueReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill in missing months with zero values
    const completeMonthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyRevenue.find((item) => item._id === i + 1);
      return (
        monthData || {
          _id: i + 1,
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        }
      );
    });

    res.status(200).json({
      status: "success",
      data: {
        year,
        monthlyRevenue: completeMonthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};
