import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getNotifications, 
  deleteNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.delete("/:notificationId", protectRoute, deleteNotification);
router.patch("/:notificationId/read", protectRoute, markNotificationAsRead);
router.patch("/mark-all-read", protectRoute, markAllNotificationsAsRead);

export default router;
