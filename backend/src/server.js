import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { clerkMiddleware } from "@clerk/express";

import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";
import messageRoutes from "./routes/message.route.js";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";
import { setupSocketHandlers } from "./socket/socketHandlers.js";

const app = express();

// Only create Socket.IO server in non-serverless environments
let io = null;
let server = null;

if (ENV.NODE_ENV !== "production" || process.env.ENABLE_WEBSOCKETS === "true") {
  server = createServer(app);
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  
  // Setup Socket.io handlers
  setupSocketHandlers(io);
  
  // Make io available to routes
  app.set("io", io);
} else {
  // For Vercel deployment without WebSockets
  console.log("Running in serverless mode - WebSocket features disabled");
  app.set("io", null);
}

app.use(cors());
app.use(express.json());

// Ensure DB connection for each request in serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB connection error:", error);
    res.status(503).json({ error: "Database connection failed" });
  }
});

app.use(clerkMiddleware());
app.use(arcjetMiddleware);

app.get("/", (req, res) => res.send("Hello from server"));
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDB();

    // listen for local development
    if (ENV.NODE_ENV !== "production") {
      const serverToListen = server || app;
      serverToListen.listen(ENV.PORT, () => console.log("Server is up and running on PORT:", ENV.PORT));
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    // Don't exit in production/serverless - let requests handle DB connection
    if (ENV.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

// Only start server in non-production (local dev)
if (ENV.NODE_ENV !== "production") {
  startServer();
} else {
  // In production/Vercel, connect to DB but don't fail if it errors initially
  connectDB().catch(err => console.error("Initial DB connection failed:", err.message));
}

// export for vercel
export default app;
