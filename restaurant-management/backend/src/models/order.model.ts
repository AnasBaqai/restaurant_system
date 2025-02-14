import mongoose, { Document, Schema } from "mongoose";
import { IMenuItem } from "./menu.model";
import { IUser } from "./user.model";

export enum OrderStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  DIGITAL_WALLET = "digital_wallet",
}

export interface IOrderItem {
  menuItem: IMenuItem["_id"];
  quantity: number;
  customizations?: {
    name: string;
    option: string;
    price: number;
  }[];
  subtotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  table: number;
  waiter: IUser["_id"];
  items: IOrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: boolean;
  notes?: string;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    customizations: [
      {
        name: String,
        option: String,
        price: Number,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    table: {
      type: Number,
      required: true,
      min: 1,
    },
    waiter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ waiter: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
