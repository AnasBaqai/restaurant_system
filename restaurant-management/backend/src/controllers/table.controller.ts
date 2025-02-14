import { Request, Response, NextFunction } from "express";
import { Table, TableStatus } from "../models/table.model";
import { AppError } from "../middleware/errorHandler";

// Create a new table
export const createTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newTable = await Table.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        table: newTable,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all tables
export const getAllTables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tables = await Table.find()
      .populate("currentWaiter", "name role")
      .sort("tableNumber");

    // Map through tables to set currentWaiter based on assignment
    const processedTables = tables.map((table) => {
      const tableObj = table.toObject();
      if (!tableObj.currentWaiter) {
        tableObj.currentWaiter = {
          _id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        };
      }
      return tableObj;
    });

    res.status(200).json({
      status: "success",
      results: tables.length,
      data: {
        tables: processedTables,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get table by ID
export const getTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const table = await Table.findById(req.params.id).populate(
      "currentWaiter",
      "name role"
    );

    if (!table) {
      return next(new AppError("No table found with that ID", 404));
    }

    const tableObj = table.toObject();
    if (!tableObj.currentWaiter) {
      tableObj.currentWaiter = {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
      };
    }

    res.status(200).json({
      status: "success",
      data: {
        table: tableObj,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update table status
export const updateTableStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Update table status request:", {
      tableId: req.params.id,
      newStatus: req.body.status,
      userId: req.user?._id,
      userRole: req.user?.role,
    });

    const { status } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      console.log("Table not found:", {
        tableId: req.params.id,
        requestedStatus: status,
      });
      return next(new AppError("No table found with that ID", 404));
    }

    // If table is being cleaned, update lastCleaned timestamp
    if (status === TableStatus.CLEANING) {
      table.lastCleaned = new Date();
      console.log("Table marked for cleaning:", {
        tableId: table._id,
        lastCleaned: table.lastCleaned,
      });
    }

    // If table is available, clear current waiter and order
    if (status === TableStatus.AVAILABLE) {
      table.currentWaiter = undefined;
      table.currentOrder = undefined;
      console.log("Table marked as available, cleared assignments:", {
        tableId: table._id,
      });
    }

    const previousStatus = table.status;
    table.status = status;
    await table.save();

    console.log("Table status updated successfully:", {
      tableId: table._id,
      previousStatus,
      newStatus: status,
      lastCleaned: table.lastCleaned,
      currentWaiter: table.currentWaiter,
      currentOrder: table.currentOrder,
    });

    res.status(200).json({
      status: "success",
      data: {
        table,
      },
    });
  } catch (error) {
    console.error("Error updating table status:", {
      tableId: req.params.id,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};

// Get available tables
export const getAvailableTables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tables = await Table.find({ status: TableStatus.AVAILABLE }).sort(
      "tableNumber"
    );

    res.status(200).json({
      status: "success",
      results: tables.length,
      data: {
        tables,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Assign waiter to table
export const assignWaiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Assigning waiter to table:", {
      tableId: req.params.id,
      waiterId: req.body.waiterId,
    });

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { currentWaiter: req.body.waiterId },
      {
        new: true,
        runValidators: true,
      }
    ).populate("currentWaiter", "name role");

    if (!table) {
      return next(new AppError("No table found with that ID", 404));
    }

    console.log("Waiter assigned successfully:", {
      tableId: table._id,
      waiterId: table.currentWaiter,
    });

    res.status(200).json({
      status: "success",
      data: {
        table,
      },
    });
  } catch (error) {
    console.error("Error assigning waiter:", {
      tableId: req.params.id,
      error: error instanceof Error ? error.message : error,
    });
    next(error);
  }
};

// Delete table
export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);

    if (!table) {
      return next(new AppError("No table found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
