import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import MessagingSettings from "../models/messagingSettings.model.js";
import cloudinary from "../config/cloudinary.js";

import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { firstName, lastName, bio, location } = req.body;

  // Basic validation
  if (bio && bio.length > 160) {
    return res.status(400).json({ error: "Bio must be 160 characters or less" });
  }

  // Prepare update data (only include provided fields)
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;

  const user = await User.findOneAndUpdate({ clerkId: userId }, updateData, { new: true });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const imageFile = req.file;

  if (!imageFile) {
    return res.status(400).json({ error: "Profile image is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    // Convert buffer to base64 for cloudinary
    const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`;

    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "profile_pictures",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" },
        { format: "auto" },
      ],
    });

    // Update user's profile picture
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { profilePicture: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json({ 
      user: updatedUser,
      message: "Profile image updated successfully" 
    });
  } catch (uploadError) {
    console.error("Cloudinary upload error:", uploadError);
    return res.status(400).json({ error: "Failed to upload profile image" });
  }
});

export const updateBannerImage = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const imageFile = req.file;

  if (!imageFile) {
    return res.status(400).json({ error: "Banner image is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    // Convert buffer to base64 for cloudinary
    const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`;

    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "banner_images",
      resource_type: "image",
      transformation: [
        { width: 1200, height: 400, crop: "fill" },
        { quality: "auto" },
        { format: "auto" },
      ],
    });

    // Update user's banner image
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { bannerImage: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json({ 
      user: updatedUser,
      message: "Banner image updated successfully" 
    });
  } catch (uploadError) {
    console.error("Cloudinary upload error:", uploadError);
    return res.status(400).json({ error: "Failed to upload banner image" });
  }
});

export const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  // check if user already exists in mongodb
  const existingUser = await User.findOne({ clerkId: userId });
  if (existingUser) {
    return res.status(200).json({ user: existingUser, message: "User already exists" });
  }

  // create new user from Clerk data
  const clerkUser = await clerkClient.users.getUser(userId);

  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName || "User",
    lastName: clerkUser.lastName || "", // Now optional in model
    username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
    profilePicture: clerkUser.imageUrl || "",
  };

  const user = await User.create(userData);

  // Create default messaging settings for the new user
  try {
    await MessagingSettings.create({
      user: user._id,
      whoCanMessage: "everyone", // Default to everyone for easier onboarding
    });
  } catch (settingsError) {
    console.error("Failed to create messaging settings:", settingsError);
    // Don't fail user creation if messaging settings fail
  }

  res.status(201).json({ user, message: "User created successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (userId === targetUserId) return res.status(400).json({ error: "You cannot follow yourself" });

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) return res.status(404).json({ error: "User not found" });

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUser._id },
    });
  } else {
    // follow
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUser._id },
    });

    // create notification
    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing ? "User unfollowed successfully" : "User followed successfully",
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Search query is required" });
  }

  const searchQuery = q.trim();
  
  // Search for users by username, firstName, or lastName (case insensitive)
  const users = await User.find({
    $or: [
      { username: { $regex: searchQuery, $options: "i" } },
      { firstName: { $regex: searchQuery, $options: "i" } },
      { lastName: { $regex: searchQuery, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: searchQuery,
            options: "i"
          }
        }
      }
    ]
  })
  .select("clerkId firstName lastName username profilePicture bio followers following createdAt")
  .limit(20)
  .lean();

  res.status(200).json({ users, count: users.length });
});

export const searchUsersAndMessages = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const auth = req.auth();
  const currentUserId = auth.userId;

  console.log("Search query:", q, "Current user:", currentUserId);

  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Search query is required" });
  }

  const searchQuery = q.trim();
  
  // Get current user to exclude from results
  const currentUser = await User.findOne({ clerkId: currentUserId });
  if (!currentUser) {
    console.log("Current user not found:", currentUserId);
    return res.status(404).json({ error: "User not found" });
  }
  
  console.log("Current user found:", currentUser.username, "ID:", currentUser._id);
  
  // Search for users by username, firstName, or lastName (case insensitive)
  // Exclude the current user from results
  const users = await User.find({
    _id: { $ne: currentUser._id }, // Exclude current user
    $or: [
      { username: { $regex: searchQuery, $options: "i" } },
      { firstName: { $regex: searchQuery, $options: "i" } },
      { lastName: { $regex: searchQuery, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: searchQuery,
            options: "i"
          }
        }
      }
    ]
  })
  .select("clerkId firstName lastName username profilePicture bio followers following createdAt")
  .limit(20)
  .lean();

  console.log("Found users:", users.length, users.map(u => u.username));

  // For now, we'll return users with mock message data
  // In a real app, you would also search through actual message/conversation collections
  const usersWithMessages = users.map(user => ({
    ...user,
    hasMessages: true,
    lastMessage: `Hey! Let's connect and chat about ${searchQuery}`,
    lastMessageTime: "now",
    messagePreview: [
      {
        id: 1,
        text: `Hi there! I saw you're interested in ${searchQuery}`,
        fromUser: false,
        time: "2h"
      },
      {
        id: 2,
        text: "Would love to chat more about it!",
        fromUser: false,
        time: "2h"
      }
    ]
  }));

  console.log("Returning users with messages:", usersWithMessages.length);

  res.status(200).json({ 
    results: usersWithMessages, 
    count: usersWithMessages.length,
    type: "users_with_messages"
  });
});
