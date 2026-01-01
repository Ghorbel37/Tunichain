import mongoose from "mongoose";
import dotenv from "dotenv";
import rl from 'node:readline';

dotenv.config();

// Check for -y or --yes flag
const skipConfirmation = process.argv.includes('-y') || process.argv.includes('--yes');

const clearDB = async () => {
  try {
    // Connect to MongoDB
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    // Drop each collection
    for (let collection of collections) {
      await collection.drop();
      console.log(`Dropped collection: ${collection.collectionName}`);
    }
    
    console.log("\nDatabase cleared successfully!");
    process.exit(0);
  } catch (error) {
    // Ignore the "ns not found" error which occurs when dropping a non-existent collection
    if (error.message !== 'ns not found') {
      console.error("Error clearing database:", error);
      process.exit(1);
    }
    console.log("\nDatabase cleared successfully!");
    process.exit(0);
  }
};

// Handle confirmation
const confirmAndClear = async () => {
  if (skipConfirmation) {
    await clearDB();
  } else {
    const readline = rl.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('WARNING: This will delete ALL data in the database. Are you sure? (y/N) ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await clearDB();
      } else {
        console.log('Database clearance cancelled.');
        process.exit(0);
      }
      readline.close();
    });
  }
};

confirmAndClear();
