import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Notification } from "../hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const getNotificationText = () => {
    switch (notification.type) {
      case "follow":
        return `${notification.from.firstName} ${notification.from.lastName} started following you`;
      case "like":
        return `${notification.from.firstName} ${notification.from.lastName} liked your post`;
      case "comment":
        return `${notification.from.firstName} ${notification.from.lastName} commented on your post`;
      case "message":
        return `${notification.from.firstName} ${notification.from.lastName} sent you a message`;
      default:
        return "New notification";
    }
  };

  const getNotificationContent = () => {
    if (notification.type === "message" && notification.message) {
      return notification.message.content;
    }
    if (notification.type === "comment" && notification.comment) {
      return notification.comment.content;
    }
    if (notification.type === "like" && notification.post) {
      return notification.post.content;
    }
    return null;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`p-4 border-b border-gray-200 ${
        !notification.read ? "bg-blue-50" : "bg-white"
      }`}
    >
      <View className="flex-row items-start space-x-3">
        <Image
          source={{
            uri: notification.from.profilePicture || "https://via.placeholder.com/40",
          }}
          className="w-10 h-10 rounded-full"
        />
        
        <View className="flex-1">
          <Text className="text-sm text-gray-900 font-medium">
            {getNotificationText()}
          </Text>
          
          {getNotificationContent() && (
            <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
              "{getNotificationContent()}"
            </Text>
          )}
          
          <Text className="text-xs text-gray-500 mt-1">
            {new Date(notification.createdAt).toLocaleDateString()} at{" "}
            {new Date(notification.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {!notification.read && (
          <View className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
        )}
      </View>

      <View className="flex-row justify-end space-x-2 mt-2">
        {!notification.read && onMarkAsRead && (
          <TouchableOpacity
            onPress={onMarkAsRead}
            className="px-3 py-1 bg-blue-100 rounded-full"
          >
            <Text className="text-xs text-blue-600">Mark as read</Text>
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            className="px-3 py-1 bg-red-100 rounded-full"
          >
            <Text className="text-xs text-red-600">Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};