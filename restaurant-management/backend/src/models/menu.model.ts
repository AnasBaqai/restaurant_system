import mongoose, { Document, Schema } from "mongoose";

export interface ICustomization {
  name: string;
  options: {
    name: string;
    price: number;
  }[];
}

export interface IMenuItem extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  customizations?: ICustomization[];
  available: boolean;
  preparationTime: number; // in minutes
}

const customizationSchema = new Schema<ICustomization>(
  {
    name: {
      type: String,
      required: true,
    },
    options: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { _id: false }
);

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: [true, "Please provide item name"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Please provide item description"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please provide item category"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please provide item price"],
      min: 0,
    },
    image: {
      type: String,
    },
    customizations: [customizationSchema],
    available: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      required: [true, "Please provide preparation time"],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster search
menuItemSchema.index({ name: "text", category: "text" });

export const MenuItem = mongoose.model<IMenuItem>("MenuItem", menuItemSchema);
