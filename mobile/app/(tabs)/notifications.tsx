import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationItem } from "../../components/NotificationItem";

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationPress = (notification: any) => {
    // Mark as read when pressed
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "message":
        if (notification.conversation) {
          router.push(`/user/conversation?id=${notification.conversation._id}`);
        }
        break;
      case "follow":
        router.push(`/user/profile?username=${notification.from.username}`);
        break;
      case "like":
      case "comment":
        if (notification.post) {
          // Navigate to post detail if you have that screen
          // router.push(`/post/${notification.post._id}`);
        }
        break;
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      Alert.alert(
        "Mark All as Read",
        `Mark all ${unreadCount} notifications as read?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Mark All", onPress: () => markAllAsRead() },
        ]
      );
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteNotification(notificationId) },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-xl font-bold">Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            className="px-3 py-1 bg-blue-100 rounded-full"
          >
            <Text className="text-sm text-blue-600">Mark all read ({unreadCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onMarkAsRead={() => markAsRead(item._id)}
            onDelete={() => handleDeleteNotification(item._id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-gray-500 text-center">
              No notifications yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}