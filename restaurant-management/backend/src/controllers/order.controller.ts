import { Request, Response, NextFunction } from "express";
import { Order, OrderStatus } from "../models/order.model";
import { MenuItem } from "../models/menu.model";
import { Table, TableStatus } from "../models/table.model";
import { AppError } from "../middleware/errorHandler";
import { generateReceipt } from "../utils/receipt";

// Create a new order
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Create Order Request:", {
      body: req.body,
      user: { id: req.user._id, role: req.user.role },
    });

    const { table, items } = req.body;

    if (!table || !items || !Array.isArray(items) || items.length === 0) {
      console.log("Validation Error:", { table, items });
      return next(
        new AppError("Please provide table and at least one item", 400)
      );
    }

    // Validate table exists and is available
    const tableDoc = await Table.findOne({ tableNumber: table });
    if (!tableDoc) {
      return next(new AppError(`Table ${table} not found`, 404));
    }

    if (tableDoc.status !== TableStatus.AVAILABLE) {
      return next(new AppError(`Table ${table} is not available`, 400));
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        console.log("Menu Item Not Found:", { itemId: item.menuItem });
        return next(new AppError("Menu item not found", 404));
      }

      // Calculate item subtotal including customizations
      let itemSubtotal = menuItem.price * item.quantity;
      if (item.customizations) {
        for (const customization of item.customizations) {
          itemSubtotal += customization.price;
        }
      }
      item.subtotal = itemSubtotal;
      subtotal += itemSubtotal;
    }

    // Apply tax and service charge
    const tax = subtotal * 0.1; // 10% tax
    const serviceCharge = subtotal * 0.05; // 5% service charge
    const total = subtotal + tax + serviceCharge;

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Get the latest order from today
    const latestOrder = await Order.findOne({
      orderNumber: new RegExp(`^${year}${month}${day}`),
    }).sort({ orderNumber: -1 });

    let sequenceNumber = 1;
    if (latestOrder) {
      const currentSequence = parseInt(latestOrder.orderNumber.slice(-3));
      sequenceNumber = currentSequence + 1;
    }

    const orderNumber = `${year}${month}${day}${sequenceNumber
      .toString()
      .padStart(3, "0")}`;

    console.log("Order Calculations:", {
      subtotal,
      tax,
      serviceCharge,
      total,
      orderNumber,
    });

    // Create order
    const order = await Order.create({
      orderNumber,
      table,
      waiter: req.body.waiter || req.user._id,
      items,
      subtotal,
      tax,
      serviceCharge,
      total,
      notes: req.body.notes,
    });

    // Find table by table number and update its status
    await Table.findByIdAndUpdate(tableDoc._id, {
      status: TableStatus.OCCUPIED,
      currentWaiter: req.body.waiter || req.user._id,
      currentOrder: order.orderNumber,
    });

    // Populate the waiter field before sending response
    const populatedOrder = await Order.findById(order._id).populate(
      "waiter",
      "name role"
    );

    console.log("Order Created Successfully:", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: table,
    });

    res.status(201).json({
      status: "success",
      data: {
        order: populatedOrder,
      },
    });
  } catch (error) {
    console.error("Order Creation Error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};

// Get all orders
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find()
      .populate("waiter", "name")
      .populate("items.menuItem", "name price");

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get order by ID
export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("waiter", "name")
      .populate("items.menuItem", "name price");

    if (!order) {
      return next(new AppError("No order found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("waiter", "name")
      .populate("items.menuItem", "name price");

    if (!order) {
      return next(new AppError("No order found with that ID", 404));
    }

    // If order is completed, check if payment is processed
    if (status === OrderStatus.COMPLETED && !order.paymentStatus) {
      return next(new AppError("Cannot complete order before payment", 400));
    }

    order.status = status;
    await order.save();

    // If order is completed, update table status
    if (status === OrderStatus.COMPLETED) {
      await Table.findOneAndUpdate(
        { tableNumber: order.table },
        {
          status: TableStatus.CLEANING,
          currentOrder: null,
          currentWaiter: null,
        }
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Process payment
export const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError("No order found with that ID", 404));
    }

    if (order.paymentStatus) {
      return next(new AppError("Order has already been paid", 400));
    }

    order.paymentMethod = paymentMethod;
    order.paymentStatus = true;
    order.status = OrderStatus.COMPLETED;

    await order.save();

    // Update table status
    await Table.findOneAndUpdate(
      { tableNumber: order.table },
      {
        status: TableStatus.CLEANING,
        currentOrder: null,
        currentWaiter: null,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get orders by waiter
export const getWaiterOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find({ waiter: req.user._id })
      .populate("items.menuItem", "name price")
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get orders by table
export const getOrdersByTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber);

    if (isNaN(tableNumber)) {
      return next(new AppError("Invalid table number", 400));
    }

    const orders = await Order.find({ table: tableNumber })
      .populate("waiter", "name")
      .populate("items.menuItem", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get orders by waiter
export const getOrdersByWaiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find({ waiter: req.params.waiterId })
      .populate("items.menuItem", "name price")
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Generate receipt for an order
export const generateOrderReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Generating receipt for order:", { orderId: req.params.id });

    const order = await Order.findById(req.params.id)
      .populate("items.menuItem", "name")
      .populate("waiter", "name")
      .lean();

    if (!order) {
      console.log("Order not found:", { orderId: req.params.id });
      return next(new AppError("No order found with that ID", 404));
    }

    console.log("Found order data:", {
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      waiter: order.waiter,
      total: order.total,
    });

    try {
      const receipt = generateReceipt(order as any);
      console.log("Receipt generated successfully");

      res.status(200).json({
        status: "success",
        data: {
          receipt,
        },
      });
    } catch (receiptError) {
      console.error("Receipt generation failed:", {
        error:
          receiptError instanceof Error ? receiptError.message : receiptError,
        orderData: order,
      });
      return next(new AppError("Failed to generate receipt", 500));
    }
  } catch (error) {
    console.error("Error in generateOrderReceipt:", {
      error: error instanceof Error ? error.message : error,
      orderId: req.params.id,
    });
    next(error);
  }
};
