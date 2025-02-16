import { IOrder } from "../models/order.model";
import { Document } from "mongoose";

type GenerateReceiptInput = {
  orderNumber: string;
  table: number;
  items: {
    menuItem: { name: string };
    quantity: number;
    subtotal: number;
  }[];
  waiter: { name: string };
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: boolean;
};

export const generateReceipt = (order: GenerateReceiptInput): string => {
  console.log("Starting receipt generation with order:", {
    orderNumber: order.orderNumber,
    table: order.table,
    itemCount: order.items?.length,
  });

  try {
    const date = new Date().toLocaleString();

    console.log("Processing order items");
    const items = order.items.map((item) => {
      if (!item.menuItem?.name) {
        console.error("Invalid menu item:", item);
        throw new Error("Menu item name is missing");
      }
      return {
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.subtotal / item.quantity,
        subtotal: item.subtotal,
      };
    });

    // Create the receipt with manual formatting
    const receiptContent = [
      "                RESTAURANT MANAGEMENT                ",
      "                123 Restaurant Street                ",
      "                   City, Country                    ",
      "                Tel: (123) 456-7890                 ",
      "------------------------------------------------",
      `Order #: ${order.orderNumber}`,
      `Date: ${date}`,
      `Table: ${order.table}`,
      `Waiter: ${order.waiter?.name || "Unknown"}`,
      "------------------------------------------------",
      "ITEM                  QTY   PRICE   TOTAL",
      "------------------------------------------------",
      ...items.map((item) => {
        const name = item.name.padEnd(22);
        const qty = item.quantity.toString().padStart(5);
        const price = (item.subtotal / item.quantity).toFixed(2).padStart(7);
        const total = item.subtotal.toFixed(2).padStart(8);
        return `${name}${qty}${price}${total}`;
      }),
      "------------------------------------------------",
      `Subtotal:${order.subtotal.toFixed(2).padStart(32)}`,
      `Tax:${order.tax.toFixed(2).padStart(37)}`,
      `Service Charge:${order.serviceCharge.toFixed(2).padStart(27)}`,
      "------------------------------------------------",
      `TOTAL:${order.total.toFixed(2).padStart(35)}`,
      "------------------------------------------------",
      "",
      `                Payment Method: ${order.paymentMethod || "N/A"}`,
      `                Payment Status: ${
        order.paymentStatus ? "PAID" : "UNPAID"
      }`,
      "",
      "            Thank you for dining with us!",
      "                Please come again",
      "------------------------------------------------",
    ].join("\n");

    return receiptContent;
  } catch (error) {
    console.error("Error generating receipt:", {
      error: error instanceof Error ? error.message : error,
      orderData: {
        orderNumber: order.orderNumber,
        table: order.table,
        items: order.items,
        waiter: order.waiter,
      },
    });
    throw error;
  }
};
