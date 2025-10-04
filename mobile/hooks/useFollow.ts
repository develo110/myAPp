import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, userApi } from "../utils/api";
import { Alert } from "react-native";

export const useFollow = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: (targetUserId: string) => userApi.followUser(api, targetUserId),
    onSuccess: (response, targetUserId) => {
      // Invalidate and refetch user profiles to update follower counts
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      const message = response.data?.message || "Success";
      console.log(message);
    },
    onError: (error: any) => {
      console.error("Follow/Unfollow failed:", error);
      const errorMessage = error.response?.data?.error || "Failed to follow/unfollow user";
      Alert.alert("Error", errorMessage);
    },
  });

  const followUser = (targetUserId: string) => {
    followMutation.mutate(targetUserId);
  };

  return {
    followUser,
    isLoading: followMutation.isPending,
    error: followMutation.error,
  };
};