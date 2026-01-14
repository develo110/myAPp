import { useState } from "react";
import { useApiClient, messageApi } from "../utils/api";

interface Follower {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  clerkId: string;
  canMessage: boolean;
  isRequest: boolean;
}

interface ShareResult {
  sharedTo: number;
  totalAttempted: number;
  successfulShares: any[];
  failedShares: any[];
}

export const usePostSharing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const api = useApiClient();

  const loadFollowers = async (): Promise<Follower[]> => {
    setIsLoading(true);
    try {
      const response = await messageApi.getFollowersForSharing(api);
      const followersList = response.data.followers;
      setFollowers(followersList);
      return followersList;
    } catch (error) {
      console.error("Failed to load followers:", error);
      throw new Error("Failed to load followers");
    } finally {
      setIsLoading(false);
    }
  };

  const sharePostToFollowers = async (
    postId: string,
    followerIds: string[],
    message?: string
  ): Promise<ShareResult> => {
    try {
      const response = await messageApi.sharePostToFollowers(api, {
        postId,
        followerIds,
        message,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to share post:", error);
      throw new Error("Failed to share post");
    }
  };

  const sharePostToConversation = async (
    conversationId: string,
    postId: string,
    message?: string
  ) => {
    try {
      const response = await messageApi.sharePost(api, {
        conversationId,
        postId,
        message,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to share post to conversation:", error);
      throw new Error("Failed to share post");
    }
  };

  return {
    isLoading,
    followers,
    loadFollowers,
    sharePostToFollowers,
    sharePostToConversation,
  };
};