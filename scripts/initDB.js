import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { USER_ROLES } from "../models/Roles.js";

dotenv.config();

const initDB = async () => {
  try {
    // Connect to MongoDB
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const usersToInit = [
      {
        address: process.env.SUPERADMIN_ADDRESS,
        role: USER_ROLES.SUPER_ADMIN,
        name: "Superadmin"
      },
      {
        address: process.env.TAX_ADMININNISTRATION_ADDRESS,
        role: USER_ROLES.TAX_ADMIN,
        name: "Tax Administration"
      },
      {
        address: process.env.TTN_ADDRESS,
        role: USER_ROLES.TTN,
        name: "TTN"
      }
    ];

    for (const userData of usersToInit) {
      if (!userData.address) {
        console.warn(`Skipping ${userData.name} because address is not defined in .env`);
        continue;
      }

      const address = userData.address.toLowerCase();

      // Check if user already exists
      const existingUser = await User.findOne({ address });

      if (existingUser) {
        console.log(`${userData.name} (${address}) already exists in the database with role: ${existingUser.role}`);
        continue;
      }

      // Create new user
      const newUser = new User({
        address,
        role: userData.role,
        isActive: true
      });

      await newUser.save();
      console.log(`${userData.name} user created successfully with address: ${address}`);
    }

    console.log("Database initialization completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

initDB();
// run with:    node scripts/initDB.js