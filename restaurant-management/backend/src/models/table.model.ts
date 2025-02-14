import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user.model";

export enum TableStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
  CLEANING = "cleaning",
}

export interface ITable extends Document {
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  currentWaiter?: IUser["_id"];
  currentOrder?: string;
  lastCleaned?: Date;
}

const tableSchema = new Schema<ITable>(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(TableStatus),
      default: TableStatus.AVAILABLE,
    },
    currentWaiter: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    currentOrder: {
      type: String,
      ref: "Order",
    },
    lastCleaned: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
tableSchema.index({ status: 1 });
tableSchema.index({ currentWaiter: 1 });

export const Table = mongoose.model<ITable>("Table", tableSchema);
