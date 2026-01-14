import mongoose from "mongoose";

const messagingSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Privacy settings
    whoCanMessage: {
      type: String,
      enum: ["everyone", "followers", "following", "mutual_followers", "no_one"],
      default: "everyone", // Changed from "followers" to "everyone" for easier testing
    },
    // Message requests
    allowMessageRequests: {
      type: Boolean,
      default: true,
    },
    // Read receipts
    readReceipts: {
      type: Boolean,
      default: true,
    },
    // Online status
    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
    // Typing indicators
    showTypingIndicator: {
      type: Boolean,
      default: true,
    },
    // Blocked users
    blockedUsers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      blockedAt: {
        type: Date,
        default: Date.now,
      },
      reason: String,
    }],
    // Muted conversations
    mutedConversations: [{
      conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
      mutedUntil: Date,
      mutedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Notification settings
    notifications: {
      messages: {
        type: Boolean,
        default: true,
      },
      messageRequests: {
        type: Boolean,
        default: true,
      },
      groupMessages: {
        type: Boolean,
        default: true,
      },
      reactions: {
        type: Boolean,
        default: true,
      },
    },
    // Auto-delete settings
    autoDeleteMessages: {
      enabled: {
        type: Boolean,
        default: false,
      },
      duration: {
        type: Number, // in days
        default: 30,
      },
    },
    // Theme preferences
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },
    chatWallpaper: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
messagingSettingsSchema.index({ user: 1 });

const MessagingSettings = mongoose.model("MessagingSettings", messagingSettingsSchema);

export default MessagingSettings;