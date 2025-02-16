import { Request, Response, NextFunction } from "express";
import { Order, OrderStatus, PaymentMethod } from "../models/order.model";
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
      .populate("items.menuItem", "name price")
      .sort({ createdAt: -1 });

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
    const { paymentMethod, cashAmount } = req.body;
    console.log("Processing payment:", {
      orderId: req.params.id,
      paymentMethod,
      cashAmount,
      body: req.body,
    });

    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log("Order not found:", { orderId: req.params.id });
      return next(new AppError("No order found with that ID", 404));
    }

    if (order.paymentStatus) {
      console.log("Order already paid:", {
        orderId: order._id,
        currentPaymentMethod: order.paymentMethod,
      });
      return next(new AppError("Order has already been paid", 400));
    }

    // If payment is by cash, validate cash amount and calculate change
    if (paymentMethod === PaymentMethod.CASH) {
      console.log("Validating cash payment:", {
        orderId: order._id,
        total: order.total,
        providedCashAmount: cashAmount,
      });

      if (!cashAmount) {
        console.log("Cash amount missing for cash payment:", {
          orderId: order._id,
          paymentMethod,
          cashAmount,
        });
        return next(
          new AppError("Cash amount is required for cash payment", 400)
        );
      }

      if (cashAmount < order.total) {
        console.log("Insufficient cash amount:", {
          orderId: order._id,
          total: order.total,
          cashAmount,
          difference: order.total - cashAmount,
        });
        return next(new AppError("Cash amount is less than total amount", 400));
      }

      order.cashAmount = cashAmount;
      order.changeAmount = cashAmount - order.total;

      console.log("Cash payment validated:", {
        orderId: order._id,
        cashAmount: order.cashAmount,
        changeAmount: order.changeAmount,
      });
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

    console.log("Payment processed successfully:", {
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      total: order.total,
      cashAmount: order.cashAmount,
      changeAmount: order.changeAmount,
    });

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error("Error processing payment:", {
      orderId: req.params.id,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
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

// Update order table
export const updateOrderTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Update order table request:", {
      orderId: req.params.id,
      newTable: req.body.table,
      userId: req.user?._id,
      userRole: req.user?.role,
    });

    const { table: newTable } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("waiter", "name")
      .populate("items.menuItem", "name price");

    if (!order) {
      console.log("Order not found:", {
        orderId: req.params.id,
        requestedTable: newTable,
      });
      return next(new AppError("No order found with that ID", 404));
    }

    // Check if order can be edited
    if (order.status === OrderStatus.COMPLETED || order.paymentStatus) {
      console.log("Cannot change table - order completed or paid:", {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
      return next(
        new AppError("Cannot change table for completed or paid orders", 400)
      );
    }

    // Validate new table exists and is available
    const newTableDoc = await Table.findOne({ tableNumber: newTable });
    if (!newTableDoc) {
      console.log("New table not found:", {
        tableNumber: newTable,
      });
      return next(new AppError(`Table ${newTable} not found`, 404));
    }

    if (
      newTableDoc.status !== TableStatus.AVAILABLE &&
      newTableDoc.tableNumber !== order.table
    ) {
      console.log("New table not available:", {
        tableNumber: newTable,
        status: newTableDoc.status,
      });
      return next(new AppError(`Table ${newTable} is not available`, 400));
    }

    // Update old table status if different table
    if (order.table !== newTable) {
      console.log("Updating old table status:", {
        oldTable: order.table,
        newTable: newTable,
      });
      await Table.findOneAndUpdate(
        { tableNumber: order.table },
        {
          status: TableStatus.AVAILABLE,
          currentOrder: null,
          currentWaiter: null,
        }
      );
    }

    // Update new table status
    await Table.findOneAndUpdate(
      { tableNumber: newTable },
      {
        status: TableStatus.OCCUPIED,
        currentOrder: order.orderNumber,
        currentWaiter: order.waiter,
      }
    );

    // Update order with new table
    order.table = newTable;
    await order.save();

    console.log("Table change completed successfully:", {
      orderId: order._id,
      oldTable: order.table,
      newTable: newTable,
    });

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error("Error changing table:", {
      orderId: req.params.id,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};

// Update order
export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Update order request:", {
      orderId: req.params.id,
      body: req.body,
      userId: req.user._id,
      userRole: req.user.role,
    });

    const order = await Order.findById(req.params.id)
      .populate("waiter", "name")
      .populate("items.menuItem", "name price");

    if (!order) {
      console.log("Order not found:", { orderId: req.params.id });
      return next(new AppError("No order found with that ID", 404));
    }

    // Check if order can be edited
    if (order.status === OrderStatus.COMPLETED || order.paymentStatus) {
      console.log("Cannot edit completed or paid order:", {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
      return next(new AppError("Cannot edit completed or paid orders", 400));
    }

    const { items, notes } = req.body;

    // Calculate new totals if items are being updated
    if (items) {
      let subtotal = 0;
      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem) {
          console.log("Menu item not found:", { itemId: item.menuItem });
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

      // Update order with new calculations
      order.items = items;
      order.subtotal = subtotal;
      order.tax = tax;
      order.serviceCharge = serviceCharge;
      order.total = total;

      console.log("Order calculations updated:", {
        orderId: order._id,
        subtotal,
        tax,
        serviceCharge,
        total,
      });
    }

    // Update notes if provided
    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(order._id)
      .populate("waiter", "name")
      .populate("items.menuItem", "name price");

    console.log("Order updated successfully:", {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    res.status(200).json({
      status: "success",
      data: {
        order: updatedOrder,
      },
    });
  } catch (error) {
    console.error("Error updating order:", {
      orderId: req.params.id,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};
