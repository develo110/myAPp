import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Notification from "../models/notification.model.js";

// Store active users and their socket connections
const activeUsers = new Map();

export const setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle user joining
    socket.on("join", async (userId) => {
      try {
        const user = await User.findOne({ clerkId: userId });
        if (user) {
          activeUsers.set(userId, {
            socketId: socket.id,
            user: user,
            lastSeen: new Date(),
          });
          
          // Join user to their personal room
          socket.join(userId);
          
          // Notify others that user is online
          socket.broadcast.emit("userOnline", {
            userId: userId,
            user: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              profilePicture: user.profilePicture,
            },
          });

          console.log(`User ${user.username} joined with socket ${socket.id}`);
        }
      } catch (error) {
        console.error("Error in join handler:", error);
      }
    });

    // Handle joining a conversation room
    socket.on("joinConversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle sending a message
    socket.on("sendMessage", async (data) => {
      try {
        const { conversationId, content, senderId, messageType = "text" } = data;

        // Validate required fields
        if (!conversationId || !content?.trim() || !senderId) {
          socket.emit("messageError", { error: "Missing required fields" });
          return;
        }

        const sender = await User.findOne({ clerkId: senderId });
        if (!sender) {
          socket.emit("messageError", { error: "Sender not found" });
          return;
        }

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("messageError", { error: "Conversation not found" });
          return;
        }

        if (!conversation.participants.includes(sender._id)) {
          socket.emit("messageError", { error: "Not authorized to send messages in this conversation" });
          return;
        }

        // Get receiver (other participant)
        const receiverId = conversation.participants.find(
          (id) => !id.equals(sender._id)
        );

        // Create message
        const message = await Message.create({
          sender: sender._id,
          receiver: receiverId,
          conversation: conversationId,
          content: content.trim(),
          messageType,
        });

        // Update conversation's last message and activity
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastActivity: new Date(),
        });

        // Populate message for response
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "firstName lastName username profilePicture")
          .populate("receiver", "firstName lastName username profilePicture");

        // Create notification for the receiver
        const receiver = await User.findById(receiverId);
        if (receiver) {
          await Notification.create({
            from: sender._id,
            to: receiverId,
            type: "message",
            message: message._id,
            conversation: conversationId,
          });
        }

        // Emit to conversation room
        io.to(`conversation_${conversationId}`).emit("newMessage", {
          message: populatedMessage,
          conversationId,
        });

        // Also emit to receiver's personal room if they're not in the conversation room
        if (receiver) {
          io.to(receiver.clerkId).emit("newMessage", {
            message: populatedMessage,
            conversationId,
          });

          // Emit notification to receiver
          io.to(receiver.clerkId).emit("newNotification", {
            type: "message",
            from: {
              _id: sender._id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              username: sender.username,
              profilePicture: sender.profilePicture,
            },
            message: populatedMessage,
            conversationId,
            createdAt: new Date(),
          });
        }

        console.log(`Message sent in conversation ${conversationId}`);
      } catch (error) {
        console.error("Error in sendMessage handler:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      const { conversationId, userId, isTyping } = data;
      socket.to(`conversation_${conversationId}`).emit("userTyping", {
        userId,
        isTyping,
        conversationId,
      });
    });

    // Handle message read status
    socket.on("markAsRead", async (data) => {
      try {
        const { conversationId, userId } = data;

        const user = await User.findOne({ clerkId: userId });
        if (!user) return;

        // Mark messages as read
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: user._id },
            "readBy.user": { $ne: user._id },
          },
          {
            $push: {
              readBy: {
                user: user._id,
                readAt: new Date(),
              },
            },
          }
        );

        // Notify conversation participants
        io.to(`conversation_${conversationId}`).emit("messagesRead", {
          conversationId,
          userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Error in markAsRead handler:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // Find and remove user from active users
      for (const [userId, userData] of activeUsers.entries()) {
        if (userData.socketId === socket.id) {
          activeUsers.delete(userId);
          
          // Notify others that user is offline
          socket.broadcast.emit("userOffline", {
            userId: userId,
            lastSeen: new Date(),
          });
          
          console.log(`User ${userData.user.username} disconnected`);
          break;
        }
      }
    });
  });

  // Utility function to get online users
  io.getActiveUsers = () => {
    return Array.from(activeUsers.entries()).map(([userId, userData]) => ({
      userId,
      user: userData.user,
      lastSeen: userData.lastSeen,
    }));
  };
};