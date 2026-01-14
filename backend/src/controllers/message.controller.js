import asyncHandler from "express-async-handler";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import MessagingSettings from "../models/messagingSettings.model.js";
import ChatGame from "../models/chatGame.model.js";
import Post from "../models/post.model.js";
import cloudinary from "../config/cloudinary.js";

// Get or create conversation between two users
const getOrCreateConversation = asyncHandler(async (req, res) => {
  console.log("getOrCreateConversation called with:", req.body);
  
  const auth = req.auth();
  const currentUserId = auth.userId;
  console.log("User ID from auth:", currentUserId);
  
  const { participantId } = req.body;

  if (!participantId) {
    console.log("Missing participantId");
    return res.status(400).json({ error: "Participant ID is required" });
  }

  if (participantId === currentUserId) {
    console.log("User trying to create conversation with themselves");
    return res.status(400).json({ error: "Cannot create conversation with yourself" });
  }

  // Check if participant exists
  const participant = await User.findOne({ clerkId: participantId });
  if (!participant) {
    console.log("Participant not found:", participantId);
    return res.status(404).json({ error: "User not found" });
  }

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    console.log("Current user not found:", currentUserId);
    return res.status(404).json({ error: "Current user not found" });
  }

  // Check messaging permissions
  let participantSettings = await MessagingSettings.findOne({ user: participant._id });
  
  // If no settings exist, create default ones
  if (!participantSettings) {
    try {
      participantSettings = await MessagingSettings.create({
        user: participant._id,
        whoCanMessage: "everyone",
      });
    } catch (settingsError) {
      console.error("Failed to create messaging settings:", settingsError);
      // Continue without settings (will default to allowing messages)
    }
  }
  
  const canMessage = await checkMessagingPermissions(currentUser, participant, participantSettings);
  
  if (!canMessage.allowed) {
    return res.status(403).json({ error: canMessage.reason });
  }

  console.log("Found users:", { currentUser: currentUser.username, participant: participant.username });

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUser._id, participant._id] },
    isGroup: false,
  }).populate("participants", "firstName lastName username profilePicture clerkId");

  if (!conversation) {
    console.log("Creating new conversation");
    // Create new conversation
    const conversationData = {
      participants: [currentUser._id, participant._id],
      createdBy: currentUser._id,
      isMessageRequest: canMessage.isRequest,
      requestedBy: canMessage.isRequest ? currentUser._id : null,
      requestStatus: canMessage.isRequest ? "pending" : "accepted",
    };

    conversation = await Conversation.create(conversationData);

    conversation = await Conversation.findById(conversation._id).populate(
      "participants",
      "firstName lastName username profilePicture clerkId"
    );
  } else {
    console.log("Found existing conversation:", conversation._id);
  }

  res.status(200).json({ conversation });
});

// Create group conversation
const createGroupConversation = asyncHandler(async (req, res) => {
  const { participantIds, groupName, groupDescription } = req.body;
  const auth = req.auth();
  const currentUserId = auth.userId;

  if (!participantIds || participantIds.length < 1 || participantIds.length > 49) {
    return res.status(400).json({ error: "Group must have 1-49 other participants" });
  }

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Validate all participants exist
  const participants = await User.find({ clerkId: { $in: participantIds } });
  if (participants.length !== participantIds.length) {
    return res.status(400).json({ error: "Some participants not found" });
  }

  // Add current user to participants
  const allParticipants = [currentUser._id, ...participants.map(p => p._id)];

  const conversation = await Conversation.create({
    participants: allParticipants,
    isGroup: true,
    groupName: groupName || `Group with ${participants.map(p => p.firstName).join(', ')}`,
    groupDescription,
    createdBy: currentUser._id,
    admins: [currentUser._id],
    conversationType: "group",
  });

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate("participants", "firstName lastName username profilePicture clerkId")
    .populate("createdBy", "firstName lastName username");

  res.status(201).json({ conversation: populatedConversation });
});

// Send a message with enhanced features
const sendMessage = asyncHandler(async (req, res) => {
  const { 
    conversationId, 
    content, 
    messageType = "text",
    replyToId,
    isGhost = false,
    ghostDuration = 86400, // 24 hours in seconds
    sharedPostId
  } = req.body;
  
  const auth = req.auth();
  const currentUserId = auth.userId;
  const mediaFile = req.file;

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is required" });
  }

  if (!content?.trim() && !mediaFile && !sharedPostId) {
    return res.status(400).json({ error: "Message content, media, or shared post is required" });
  }

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  if (!conversation.participants.includes(currentUser._id)) {
    return res.status(403).json({ error: "Not authorized to send messages in this conversation" });
  }

  // Check if conversation is muted or blocked
  const settings = await MessagingSettings.findOne({ user: currentUser._id });
  if (settings?.mutedConversations.some(mc => mc.conversation.equals(conversationId))) {
    // Allow sending but don't send notifications
  }

  let mediaData = null;
  if (mediaFile) {
    try {
      const base64Media = `data:${mediaFile.mimetype};base64,${mediaFile.buffer.toString("base64")}`;
      const isVideo = mediaFile.mimetype.startsWith('video/');
      
      const uploadOptions = {
        folder: "chat_media",
        resource_type: isVideo ? "video" : "image",
      };

      const uploadResponse = await cloudinary.uploader.upload(base64Media, uploadOptions);
      
      mediaData = {
        url: uploadResponse.secure_url,
        type: isVideo ? "video" : "image",
        thumbnail: uploadResponse.secure_url,
        size: mediaFile.size,
        filename: mediaFile.originalname,
      };

      if (isVideo) {
        mediaData.duration = uploadResponse.duration;
      }
    } catch (uploadError) {
      console.error("Media upload error:", uploadError);
      return res.status(400).json({ error: "Failed to upload media" });
    }
  }

  // Prepare message data
  const messageData = {
    sender: currentUser._id,
    conversation: conversationId,
    content: content?.trim() || "",
    messageType,
    media: mediaData,
    replyTo: replyToId || null,
    sharedPost: sharedPostId || null,
    isGhost,
  };

  // Set expiration for ghost messages
  if (isGhost) {
    messageData.expiresAt = new Date(Date.now() + (ghostDuration * 1000));
  }

  // For group chats, don't set receiver
  if (!conversation.isGroup) {
    const receiverId = conversation.participants.find(id => !id.equals(currentUser._id));
    messageData.receiver = receiverId;
  }

  // Create message
  const message = await Message.create(messageData);

  // Update conversation's last message and activity
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastActivity: new Date(),
  });

  // Populate message for response
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "firstName lastName username profilePicture")
    .populate("receiver", "firstName lastName username profilePicture")
    .populate("replyTo", "content sender messageType")
    .populate("sharedPost", "content image video user")
    .populate({
      path: "sharedPost",
      populate: {
        path: "user",
        select: "firstName lastName username profilePicture"
      }
    });

  // Create notifications for participants (except sender)
  const otherParticipants = conversation.participants.filter(id => !id.equals(currentUser._id));
  
  for (const participantId of otherParticipants) {
    const participant = await User.findById(participantId);
    if (participant) {
      await Notification.create({
        from: currentUser._id,
        to: participantId,
        type: "message",
        message: message._id,
        conversation: conversationId,
      });
    }
  }

  // Emit real-time events
  if (req.app.get("io")) {
    const io = req.app.get("io");
    
    // Emit to conversation room
    io.to(`conversation_${conversationId}`).emit("newMessage", {
      message: populatedMessage,
      conversationId,
    });

    // Emit to each participant's personal room
    for (const participantId of otherParticipants) {
      const participant = await User.findById(participantId);
      if (participant) {
        io.to(participant.clerkId).emit("newMessage", {
          message: populatedMessage,
          conversationId,
        });

        io.to(participant.clerkId).emit("newNotification", {
          type: "message",
          from: {
            _id: currentUser._id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            username: currentUser.username,
            profilePicture: currentUser.profilePicture,
          },
          message: populatedMessage,
          conversationId,
          createdAt: new Date(),
        });
      }
    }
  }

  res.status(201).json({ message: populatedMessage });
});

// Add reaction to message
const addReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const auth = req.auth();
  const currentUserId = auth.userId;

  if (!emoji) {
    return res.status(400).json({ error: "Emoji is required" });
  }

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // Check if user already reacted with this emoji
  const existingReaction = message.reactions.find(
    r => r.user.equals(currentUser._id) && r.emoji === emoji
  );

  if (existingReaction) {
    // Remove reaction
    message.reactions = message.reactions.filter(
      r => !(r.user.equals(currentUser._id) && r.emoji === emoji)
    );
  } else {
    // Add reaction
    message.reactions.push({
      user: currentUser._id,
      emoji,
    });
  }

  await message.save();

  // Emit real-time update
  if (req.app.get("io")) {
    const io = req.app.get("io");
    io.to(`conversation_${message.conversation}`).emit("messageReaction", {
      messageId,
      reactions: message.reactions,
      action: existingReaction ? "remove" : "add",
      user: {
        _id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      },
      emoji,
    });
  }

  res.status(200).json({ 
    message: "Reaction updated", 
    reactions: message.reactions 
  });
});

// Share post to conversation
const sharePost = asyncHandler(async (req, res) => {
  const { conversationId, postId, message: additionalMessage } = req.body;
  const auth = req.auth();
  const currentUserId = auth.userId;

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.includes(currentUser._id)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  // Create message with shared post
  const messageData = {
    sender: currentUser._id,
    conversation: conversationId,
    content: additionalMessage || "",
    messageType: "post_share",
    sharedPost: postId,
  };

  if (!conversation.isGroup) {
    const receiverId = conversation.participants.find(id => !id.equals(currentUser._id));
    messageData.receiver = receiverId;
  }

  const message = await Message.create(messageData);

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastActivity: new Date(),
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "firstName lastName username profilePicture")
    .populate("sharedPost")
    .populate({
      path: "sharedPost",
      populate: {
        path: "user",
        select: "firstName lastName username profilePicture"
      }
    });

  res.status(201).json({ message: populatedMessage });
});

// Share post to multiple followers
const sharePostToFollowers = asyncHandler(async (req, res) => {
  const { postId, followerIds, message: additionalMessage } = req.body;
  const auth = req.auth();
  const currentUserId = auth.userId;

  if (!followerIds || !Array.isArray(followerIds) || followerIds.length === 0) {
    return res.status(400).json({ error: "At least one follower must be selected" });
  }

  if (followerIds.length > 20) {
    return res.status(400).json({ error: "Cannot share to more than 20 followers at once" });
  }

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  // Verify all follower IDs are valid and are actually followers
  const followers = await User.find({ 
    _id: { $in: followerIds },
    followers: currentUser._id // Ensure they follow the current user
  });

  if (followers.length !== followerIds.length) {
    return res.status(400).json({ error: "Some selected users are not your followers" });
  }

  const sharedConversations = [];
  const failedShares = [];

  // Share to each follower
  for (const follower of followers) {
    try {
      // Get or create conversation with this follower
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUser._id, follower._id] },
        isGroup: false,
      });

      if (!conversation) {
        // Check messaging permissions before creating conversation
        const followerSettings = await MessagingSettings.findOne({ user: follower._id });
        const canMessage = await checkMessagingPermissions(currentUser, follower, followerSettings);
        
        if (!canMessage.allowed) {
          failedShares.push({
            user: follower,
            reason: canMessage.reason
          });
          continue;
        }

        // Create new conversation
        conversation = await Conversation.create({
          participants: [currentUser._id, follower._id],
          createdBy: currentUser._id,
          isMessageRequest: canMessage.isRequest,
          requestedBy: canMessage.isRequest ? currentUser._id : null,
          requestStatus: canMessage.isRequest ? "pending" : "accepted",
        });
      }

      // Create message with shared post
      const messageData = {
        sender: currentUser._id,
        receiver: follower._id,
        conversation: conversation._id,
        content: additionalMessage || "",
        messageType: "post_share",
        sharedPost: postId,
      };

      const message = await Message.create(messageData);

      // Update conversation
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: message._id,
        lastActivity: new Date(),
      });

      // Create notification
      await Notification.create({
        from: currentUser._id,
        to: follower._id,
        type: "message",
        message: message._id,
        conversation: conversation._id,
      });

      sharedConversations.push({
        conversation: conversation._id,
        user: follower,
        message: message._id
      });

      // Emit real-time events
      if (req.app.get("io")) {
        const io = req.app.get("io");
        
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "firstName lastName username profilePicture")
          .populate("sharedPost")
          .populate({
            path: "sharedPost",
            populate: {
              path: "user",
              select: "firstName lastName username profilePicture"
            }
          });

        // Emit to follower's personal room
        io.to(follower.clerkId).emit("newMessage", {
          message: populatedMessage,
          conversationId: conversation._id,
        });

        io.to(follower.clerkId).emit("newNotification", {
          type: "message",
          from: {
            _id: currentUser._id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            username: currentUser.username,
            profilePicture: currentUser.profilePicture,
          },
          message: populatedMessage,
          conversationId: conversation._id,
          createdAt: new Date(),
        });
      }

    } catch (error) {
      console.error(`Failed to share post to ${follower.username}:`, error);
      failedShares.push({
        user: follower,
        reason: "Failed to send message"
      });
    }
  }

  res.status(200).json({
    message: "Post shared successfully",
    sharedTo: sharedConversations.length,
    totalAttempted: followerIds.length,
    successfulShares: sharedConversations,
    failedShares,
  });
});

// Get user's followers for sharing
const getFollowersForSharing = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const currentUserId = auth.userId;

  const currentUser = await User.findOne({ clerkId: currentUserId })
    .populate("followers", "firstName lastName username profilePicture clerkId");

  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Filter out followers who have blocked the user or don't accept messages
  const availableFollowers = [];
  
  for (const follower of currentUser.followers) {
    const followerSettings = await MessagingSettings.findOne({ user: follower._id });
    const canMessage = await checkMessagingPermissions(currentUser, follower, followerSettings);
    
    if (canMessage.allowed) {
      availableFollowers.push({
        _id: follower._id,
        firstName: follower.firstName,
        lastName: follower.lastName,
        username: follower.username,
        profilePicture: follower.profilePicture,
        clerkId: follower.clerkId,
        canMessage: true,
        isRequest: canMessage.isRequest
      });
    }
  }

  res.status(200).json({ 
    followers: availableFollowers,
    total: availableFollowers.length 
  });
});

// Get user's conversations with enhanced filtering
const getUserConversations = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const currentUserId = auth.userId;
  const { type = "all", archived = false } = req.query; // all, direct, group, requests

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  let filter = { participants: currentUser._id };

  // Filter by conversation type
  if (type === "direct") {
    filter.isGroup = false;
    filter.requestStatus = "accepted";
  } else if (type === "group") {
    filter.isGroup = true;
  } else if (type === "requests") {
    filter.isMessageRequest = true;
    filter.requestStatus = "pending";
  } else if (type === "all") {
    // For "all" type, exclude message requests that are still pending
    filter.$or = [
      { isMessageRequest: false },
      { isMessageRequest: true, requestStatus: "accepted" }
    ];
  }

  // Filter by archived status - fix the array filtering
  if (archived === "true") {
    filter["archivedBy"] = {
      $elemMatch: { user: currentUser._id }
    };
  } else {
    filter["archivedBy.user"] = { $ne: currentUser._id };
  }

  const conversations = await Conversation.find(filter)
    .populate("participants", "firstName lastName username profilePicture clerkId")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "firstName lastName username",
      },
    })
    .sort({ lastActivity: -1 });

  res.status(200).json({ conversations });
});

// Helper function to check messaging permissions
async function checkMessagingPermissions(sender, recipient, recipientSettings) {
  // If no settings exist, allow messaging (default behavior)
  if (!recipientSettings) {
    return { allowed: true, isRequest: false };
  }

  // Check if sender is blocked
  const isBlocked = recipientSettings.blockedUsers.some(
    blocked => blocked.user.equals(sender._id)
  );
  
  if (isBlocked) {
    return { allowed: false, reason: "You cannot message this user" };
  }

  const whoCanMessage = recipientSettings.whoCanMessage;

  switch (whoCanMessage) {
    case "no_one":
      return { allowed: false, reason: "This user doesn't accept messages" };
    
    case "everyone":
      return { allowed: true, isRequest: false };
    
    case "followers":
      // Check if sender follows recipient (sender is in recipient's followers list)
      const isFollowing = recipient.followers?.some(followerId => followerId.equals(sender._id));
      return { 
        allowed: true, 
        isRequest: !isFollowing,
        reason: isFollowing ? null : "Message request sent"
      };
    
    case "following":
      // Check if recipient follows sender (recipient is in sender's followers list)
      const isFollowed = sender.followers?.some(followerId => followerId.equals(recipient._id));
      return { 
        allowed: true, 
        isRequest: !isFollowed,
        reason: isFollowed ? null : "Message request sent"
      };
    
    case "mutual_followers":
      const senderFollowsRecipient = recipient.followers?.some(followerId => followerId.equals(sender._id));
      const recipientFollowsSender = sender.followers?.some(followerId => followerId.equals(recipient._id));
      const isMutual = senderFollowsRecipient && recipientFollowsSender;
      return { 
        allowed: true, 
        isRequest: !isMutual,
        reason: isMutual ? null : "Message request sent"
      };
    
    default:
      return { allowed: true, isRequest: false };
  }
}

// Get messages for a conversation
const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const auth = req.auth();
  const currentUserId = auth.userId;

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  if (!conversation.participants.includes(currentUser._id)) {
    return res.status(403).json({ error: "Not authorized to view this conversation" });
  }

  const skip = (page - 1) * limit;

  const messages = await Message.find({ 
    conversation: conversationId,
    deleted: false,
    $or: [
      { isGhost: false },
      { isGhost: true, expiresAt: { $gt: new Date() } }
    ]
  })
    .populate("sender", "firstName lastName username profilePicture")
    .populate("replyTo", "content sender messageType")
    .populate("sharedPost")
    .populate({
      path: "sharedPost",
      populate: {
        path: "user",
        select: "firstName lastName username profilePicture"
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalMessages = await Message.countDocuments({ 
    conversation: conversationId,
    deleted: false 
  });

  res.status(200).json({
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
      hasMore: skip + messages.length < totalMessages,
    },
  });
});

// Mark messages as read
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const auth = req.auth();
  const currentUserId = auth.userId;

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Mark all unread messages in conversation as read
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: currentUser._id },
      "readBy.user": { $ne: currentUser._id },
    },
    {
      $push: {
        readBy: {
          user: currentUser._id,
          readAt: new Date(),
        },
      },
    }
  );

  res.status(200).json({ message: "Messages marked as read" });
});

// Delete a message
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { deleteFor = "me" } = req.body; // "me" or "everyone"
  const auth = req.auth();
  const currentUserId = auth.userId;

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  if (deleteFor === "everyone") {
    // Only sender can delete for everyone
    if (!message.sender.equals(currentUser._id)) {
      return res.status(403).json({ error: "Not authorized to delete this message for everyone" });
    }
    
    message.deleted = true;
    message.deletedAt = new Date();
    message.content = "This message was deleted";
    await message.save();
  } else {
    // Delete for current user only
    if (!message.deletedFor.includes(currentUser._id)) {
      message.deletedFor.push(currentUser._id);
      await message.save();
    }
  }

  res.status(200).json({ message: "Message deleted successfully" });
});

// Get messaging settings
const getMessagingSettings = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const currentUserId = auth.userId;

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  let settings = await MessagingSettings.findOne({ user: currentUser._id });
  
  if (!settings) {
    // Create default settings
    settings = await MessagingSettings.create({ user: currentUser._id });
  }

  res.status(200).json({ settings });
});

// Update messaging settings
const updateMessagingSettings = asyncHandler(async (req, res) => {
  const auth = req.auth();
  const currentUserId = auth.userId;
  const updates = req.body;

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const settings = await MessagingSettings.findOneAndUpdate(
    { user: currentUser._id },
    updates,
    { new: true, upsert: true }
  );

  res.status(200).json({ settings });
});

// Start a chat game
const startChatGame = asyncHandler(async (req, res) => {
  const { conversationId, gameType, settings } = req.body;
  const auth = req.auth();
  const currentUserId = auth.userId;

  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.includes(currentUser._id)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const game = await ChatGame.create({
    conversation: conversationId,
    gameType,
    players: [{ user: currentUser._id }],
    settings: settings || {},
  });

  // Send game invitation message
  const gameMessage = await Message.create({
    sender: currentUser._id,
    conversation: conversationId,
    content: `🎮 ${currentUser.firstName} started a ${gameType} game! Tap to join.`,
    messageType: "text",
  });

  res.status(201).json({ game, message: gameMessage });
});

export {
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
};