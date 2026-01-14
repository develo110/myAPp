import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useApiClient, commentApi } from "../utils/api";

export const useComments = () => {
  const [commentText, setCommentText] = useState("");
  const api = useApiClient();

  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await commentApi.createComment(api, postId, content);
      return response.data;
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      console.error("Comment creation failed:", error);
      let errorMessage = "Failed to post comment. Try again.";
      
      if (error.response) {
        console.error("Response error:", error.response.status, error.response.data);
        errorMessage = error.response.data?.error || `Server error (${error.response.status})`;
      } else if (error.request) {
        console.error("Network error - no response received");
        errorMessage = "Network error. Check your connection.";
      } else {
        console.error("Request setup error:", error.message);
        errorMessage = error.message || "Failed to post comment";
      }
      
      Alert.alert("Error", errorMessage);
    },
  });

  const createComment = (postId: string) => {
    if (!commentText.trim()) {
      Alert.alert("Empty Comment", "Please write something before posting!");
      return;
    }

    createCommentMutation.mutate({ postId, content: commentText.trim() });
  };

  return {
    commentText,
    setCommentText,
    createComment,
    isCreatingComment: createCommentMutation.isPending,
  };
};
