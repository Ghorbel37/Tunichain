import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { USER_ROLES } from "../models/Roles.js";

dotenv.config();

const SUPERADMIN_ADDRESS = process.env.SUPERADMIN_ADDRESS.toLowerCase();

const initDB = async () => {
  try {
    // Connect to MongoDB
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({
      address: SUPERADMIN_ADDRESS,
      role: USER_ROLES.SUPER_ADMIN
    });

    if (existingAdmin) {
      console.log("Superadmin already exists in the database");
      process.exit(0);
    }

    // Create new superadmin
    const superadmin = new User({
      address: SUPERADMIN_ADDRESS,
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });

    await superadmin.save();
    console.log("Superadmin user created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

initDB();
// run with:    node scripts/initDB.js