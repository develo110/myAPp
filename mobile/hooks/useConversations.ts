import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, messageApi } from "../utils/api";
import { useAuth } from "@clerk/clerk-expo";

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture: string;
    clerkId: string;
  }>;
  lastMessage?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
    };
    createdAt: string;
  };
  lastActivity: string;
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
  groupDescription?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  admins?: string[];
  isMessageRequest: boolean;
  requestStatus: "pending" | "accepted" | "declined";
  conversationType: "direct" | "group" | "broadcast";
  createdAt: string;
  updatedAt: string;
}

export const useConversations = (type: "all" | "direct" | "group" | "requests" = "all", archived = false) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Get user's conversations
  const {
    data: conversations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations", type, archived],
    queryFn: () => messageApi.getUserConversations(api, type, archived),
    select: (response) => response.data.conversations as Conversation[],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60000, // Refetch every 60 seconds to get new conversations
    retry: 2, // Only retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Create or get direct conversation
  const createConversationMutation = useMutation({
    mutationFn: (participantId: string) => messageApi.getOrCreateConversation(api, participantId),
    onSuccess: (response) => {
      const newConversation = response.data.conversation;
      
      // Update conversations list
      queryClient.setQueryData(["conversations", type, archived], (old: Conversation[] | undefined) => {
        if (!old || !Array.isArray(old)) return [newConversation];
        
        const exists = old.find(conv => conv._id === newConversation._id);
        if (exists) return old;
        return [newConversation, ...old];
      });
    },
  });

  // Create group conversation
  const createGroupConversationMutation = useMutation({
    mutationFn: (data: { 
      participantIds: string[]; 
      groupName?: string; 
      groupDescription?: string; 
    }) => messageApi.createGroupConversation(api, data),
    onSuccess: (response) => {
      const newConversation = response.data.conversation;
      
      // Update conversations list
      queryClient.setQueryData(["conversations", type, archived], (old: Conversation[] | undefined) => {
        if (!old || !Array.isArray(old)) return [newConversation];
        return [newConversation, ...old];
      });
    },
  });

  const createConversation = (participantId: string) => {
    return createConversationMutation.mutateAsync(participantId);
  };

  const createGroupConversation = (data: { 
    participantIds: string[]; 
    groupName?: string; 
    groupDescription?: string; 
  }) => {
    return createGroupConversationMutation.mutateAsync(data);
  };

  return {
    conversations: conversations || [],
    isLoading,
    error,
    refetch,
    createConversation,
    createGroupConversation,
    isCreatingConversation: createConversationMutation.isPending,
    isCreatingGroupConversation: createGroupConversationMutation.isPending,
  };
};