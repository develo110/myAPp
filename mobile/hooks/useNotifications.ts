import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, notificationApi } from "../utils/api";
import { useAuth } from "@clerk/clerk-expo";

export interface Notification {
  _id: string;
  from: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture: string;
  };
  to: string;
  type: "follow" | "like" | "comment" | "message";
  post?: {
    _id: string;
    content: string;
    image?: string;
  };
  comment?: {
    _id: string;
    content: string;
  };
  message?: {
    _id: string;
    content: string;
    messageType: string;
  };
  conversation?: {
    _id: string;
    participants: string[];
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useNotifications = () => {
  const { userId } = useAuth();
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Get notifications
  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getNotifications(api),
    select: (response) => response.data.notifications as Notification[],
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationApi.markNotificationAsRead(api, notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => {
        if (!old) return old;
        return old.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        );
      });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllNotificationsAsRead(api),
    onSuccess: () => {
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => {
        if (!old) return old;
        return old.map(notification => ({ ...notification, read: true }));
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationApi.deleteNotification(api, notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => {
        if (!old) return old;
        return old.filter(notification => notification._id !== notificationId);
      });
    },
  });

  // Add new notification (for real-time updates)
  const addNotification = (notification: Notification) => {
    queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => {
      if (!old) return [notification];
      return [notification, ...old];
    });
  };

  // Get unread count
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return {
    notifications: notifications || [],
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    addNotification,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
};