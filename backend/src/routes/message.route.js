import express from "express";
import {
  getOrCreateConversation,
  createGroupConversation,
  getUserConversations,
  sendMessage,
  addReaction,
  sharePost,
  sharePostToFollowers,
  getFollowersForSharing,
  getConversationMessages,
  markMessagesAsRead,
  deleteMessage,
  getMessagingSettings,
  updateMessagingSettings,
  startChatGame,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`Message route hit: ${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// All routes require authentication
router.use(protectRoute);

// Conversation routes
router.post("/conversations", getOrCreateConversation);
router.post("/conversations/group", createGroupConversation);
router.get("/conversations", getUserConversations);

// Message routes
router.post("/", upload.single("media"), sendMessage);
router.get("/conversation/:conversationId", getConversationMessages);
router.put("/conversation/:conversationId/read", markMessagesAsRead);
router.delete("/:messageId", deleteMessage);

// Message reactions
router.post("/:messageId/reactions", addReaction);

// Post sharing
router.post("/share-post", sharePost);
router.post("/share-post-to-followers", sharePostToFollowers);
router.get("/followers-for-sharing", getFollowersForSharing);

// Messaging settings
router.get("/settings", getMessagingSettings);
router.put("/settings", updateMessagingSettings);

// Chat games
router.post("/games", startChatGame);

export default router;