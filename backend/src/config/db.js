import mongoose from "mongoose";
import { ENV } from "./env.js";

let isConnected = false;

export const connectDB = async () => {
  // Reuse existing connection in serverless
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("Using existing DB connection");
    return;
  }

  try {
    await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("Connected to DB SUCCESSFULLY ✅");
  } catch (error) {
    console.error("Error connecting to MONGODB:", error.message);
    isConnected = false;
    throw error;
  }
};
