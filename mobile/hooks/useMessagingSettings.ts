import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, messageApi } from "../utils/api";

export interface MessagingSettings {
  _id: string;
  user: string;
  whoCanMessage: "everyone" | "followers" | "following" | "mutual_followers" | "no_one";
  allowMessageRequests: boolean;
  readReceipts: boolean;
  showOnlineStatus: boolean;
  showTypingIndicator: boolean;
  blockedUsers: Array<{
    user: string;
    blockedAt: string;
    reason?: string;
  }>;
  mutedConversations: Array<{
    conversation: string;
    mutedUntil?: string;
    mutedAt: string;
  }>;
  notifications: {
    messages: boolean;
    messageRequests: boolean;
    groupMessages: boolean;
    reactions: boolean;
  };
  autoDeleteMessages: {
    enabled: boolean;
    duration: number; // in days
  };
  theme: "light" | "dark" | "auto";
  chatWallpaper?: string;
}

export const useMessagingSettings = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Get messaging settings
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["messagingSettings"],
    queryFn: () => messageApi.getMessagingSettings(api),
    select: (response) => response.data.settings as MessagingSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update messaging settings
  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<MessagingSettings>) =>
      messageApi.updateMessagingSettings(api, updates),
    onSuccess: (response) => {
      // Update cached settings
      queryClient.setQueryData(["messagingSettings"], response.data.settings);
    },
  });

  const updateSettings = (updates: Partial<MessagingSettings>) => {
    return updateSettingsMutation.mutateAsync(updates);
  };

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings,
    isUpdating: updateSettingsMutation.isPending,
  };
};