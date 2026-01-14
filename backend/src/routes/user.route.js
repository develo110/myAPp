import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  searchUsers,
  searchUsersAndMessages,
  syncUser,
  updateProfile,
  updateProfileImage,
  updateBannerImage,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// public routes
router.get("/profile/:username", getUserProfile);
router.get("/search", searchUsers);
router.get("/search-messages", searchUsersAndMessages);

// protected routes
router.post("/sync", protectRoute, syncUser);
router.get("/me", protectRoute, getCurrentUser);
router.put("/profile", protectRoute, updateProfile);
router.put("/profile-image", protectRoute, upload.single("profileImage"), updateProfileImage);
router.put("/banner-image", protectRoute, upload.single("bannerImage"), updateBannerImage);
router.post("/follow/:targetUserId", protectRoute, followUser);

export default router;
