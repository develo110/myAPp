import mongoose from "mongoose";

const chatGameSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    gameType: {
      type: String,
      enum: ["basketball", "word_chain", "trivia", "tic_tac_toe", "rock_paper_scissors"],
      required: true,
    },
    players: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      score: {
        type: Number,
        default: 0,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    gameState: {
      type: mongoose.Schema.Types.Mixed, // Flexible game state storage
      default: {},
    },
    status: {
      type: String,
      enum: ["waiting", "active", "paused", "completed", "cancelled"],
      default: "waiting",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    settings: {
      maxPlayers: {
        type: Number,
        default: 2,
      },
      timeLimit: {
        type: Number, // in seconds
        default: 300, // 5 minutes
      },
      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium",
      },
    },
    moves: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      move: mongoose.Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

// Index for efficient queries
chatGameSchema.index({ conversation: 1, status: 1 });
chatGameSchema.index({ "players.user": 1 });

const ChatGame = mongoose.model("ChatGame", chatGameSchema);

export default ChatGame;