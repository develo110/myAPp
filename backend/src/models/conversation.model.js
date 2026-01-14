import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Group chat features
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
    },
    groupImage: {
      type: String,
    },
    groupDescription: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Group settings
    groupSettings: {
      whoCanAddMembers: {
        type: String,
        enum: ["admins", "all"],
        default: "admins",
      },
      whoCanEditInfo: {
        type: String,
        enum: ["admins", "all"],
        default: "admins",
      },
      whoCanSendMessages: {
        type: String,
        enum: ["admins", "all"],
        default: "all",
      },
    },
    // Message requests (for non-followers)
    isMessageRequest: {
      type: Boolean,
      default: false,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestStatus: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "accepted",
    },
    // Privacy settings
    mutedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      mutedUntil: {
        type: Date,
      },
    }],
    // Conversation type
    conversationType: {
      type: String,
      enum: ["direct", "group", "broadcast"],
      default: "direct",
    },
    // Encryption status (for future implementation)
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    // Disappearing messages setting
    disappearingMessages: {
      enabled: {
        type: Boolean,
        default: false,
      },
      duration: {
        type: Number, // in seconds
        default: 86400, // 24 hours
      },
    },
    // Archived status
    archivedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      archivedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Pinned status
    pinnedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      pinnedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

// Validation for group size
conversationSchema.pre("save", function (next) {
  if (this.isGroup) {
    if (this.participants.length > 50) {
      return next(new Error("Group conversations cannot have more than 50 participants"));
    }
    if (this.participants.length < 2) {
      return next(new Error("Group conversations must have at least 2 participants"));
    }
  } else {
    if (this.participants.length !== 2) {
      return next(new Error("Direct conversations must have exactly 2 participants"));
    }
  }
  next();
});

// Index for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ isGroup: 1 });
conversationSchema.index({ requestStatus: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;