import mongoose from "mongoose";
import { User } from "../models/user.model";
import { MenuItem } from "../models/menu.model";
import { Table } from "../models/table.model";
import users from "../data/users.json";
import menuItems from "../data/menu-items.json";
import tables from "../data/tables.json";
import dotenv from "dotenv";

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    console.log("Cleared existing data");

    // Insert new data
    await User.insertMany(users);
    await MenuItem.insertMany(menuItems);
    await Table.insertMany(tables);
    console.log("Sample data inserted successfully");

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
