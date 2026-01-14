import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, messageApi } from "../utils/api";
import { useRealTimeMessages } from "./useRealTimeMessages";
import { useAuth } from "@clerk/clerk-expo";

export interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture: string;
  };
  receiver?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture: string;
  };
  conversation: string;
  content: string;
  messageType: "text" | "image" | "video" | "gif" | "sticker" | "post_share" | "voice" | "file";
  media?: {
    url: string;
    type: string;
    thumbnail?: string;
    duration?: number;
    size?: number;
    filename?: string;
  };
  sharedPost?: {
    _id: string;
    content: string;
    image?: string;
    video?: string;
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
      profilePicture: string;
    };
  };
  reactions: Array<{
    user: string;
    emoji: string;
    createdAt: string;
  }>;
  replyTo?: {
    _id: string;
    content: string;
    sender: string;
    messageType: string;
  };
  readBy: Array<{
    user: string;
    readAt: Date;
  }>;
  isGhost: boolean;
  expiresAt?: string;
  deleted: boolean;
  deletedFor: string[];
  createdAt: string;
  updatedAt: string;
}

export const useMessages = (conversationId: string | null) => {
  const { userId } = useAuth();
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Enable real-time polling
  useRealTimeMessages(conversationId);

  // Get messages for conversation
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messageApi.getConversationMessages(api, conversationId!, 1, 50),
    select: (response) => response.data,
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30000, // Refetch every 30 seconds as backup
    retry: 2, // Only retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Send text message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { 
      content: string; 
      messageType?: string;
      replyToId?: string;
      isGhost?: boolean;
      ghostDuration?: number;
    }) =>
      messageApi.sendMessage(api, {
        conversationId: conversationId!,
        ...data,
      }),
    onSuccess: (response) => {
      // Optimistically update the messages
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        
        const newMessage = response.data.message;
        const messageExists = old.messages && Array.isArray(old.messages)
          ? old.messages.some((msg: Message) => msg._id === newMessage._id)
          : false;
          
        if (messageExists) return old;

        return {
          ...old,
          messages: old.messages ? [...old.messages, newMessage] : [newMessage],
        };
      });

      // Update conversations list
      queryClient.setQueryData(["conversations"], (old: any[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map(conv => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: {
                _id: response.data.message._id,
                content: response.data.message.content,
                sender: response.data.message.sender,
                createdAt: response.data.message.createdAt,
              },
              lastActivity: response.data.message.createdAt,
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
      });
    },
  });

  // Send media message mutation
  const sendMediaMessageMutation = useMutation({
    mutationFn: (data: {
      content?: string;
      messageType: string;
      media: any;
    }) =>
      messageApi.sendMediaMessage(api, {
        conversationId: conversationId!,
        ...data,
      }),
    onSuccess: (response) => {
      // Update messages list
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        
        const newMessage = response.data.message;
        return {
          ...old,
          messages: old.messages ? [...old.messages, newMessage] : [newMessage],
        };
      });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messageApi.addReaction(api, messageId, emoji),
    onSuccess: (response, { messageId }) => {
      // Update message reactions
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          messages: old.messages.map((msg: Message) =>
            msg._id === messageId
              ? { ...msg, reactions: response.data.reactions }
              : msg
          ),
        };
      });
    },
  });

  // Share post mutation
  const sharePostMutation = useMutation({
    mutationFn: (data: { postId: string; message?: string }) =>
      messageApi.sharePost(api, {
        conversationId: conversationId!,
        ...data,
      }),
    onSuccess: (response) => {
      // Update messages list
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        
        const newMessage = response.data.message;
        return {
          ...old,
          messages: old.messages ? [...old.messages, newMessage] : [newMessage],
        };
      });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId, deleteFor }: { messageId: string; deleteFor?: string }) =>
      messageApi.deleteMessage(api, messageId, deleteFor),
    onSuccess: (_, { messageId, deleteFor }) => {
      // Update messages list
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        
        if (deleteFor === "everyone") {
          return {
            ...old,
            messages: old.messages.map((msg: Message) =>
              msg._id === messageId
                ? { ...msg, deleted: true, content: "This message was deleted" }
                : msg
            ),
          };
        } else {
          // Remove message for current user only
          return {
            ...old,
            messages: old.messages.filter((msg: Message) => msg._id !== messageId),
          };
        }
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: () => messageApi.markMessagesAsRead(api, conversationId!),
  });

  // Mark messages as read when entering conversation
  useEffect(() => {
    if (conversationId && userId) {
      const timer = setTimeout(() => {
        markAsReadMutation.mutate();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [conversationId, userId]);

  const sendMessage = useCallback((
    content: string, 
    messageType = "text",
    options?: {
      replyToId?: string;
      isGhost?: boolean;
      ghostDuration?: number;
    }
  ) => {
    if (!conversationId || !userId) return;

    sendMessageMutation.mutate({ 
      content, 
      messageType,
      ...options,
    });
  }, [conversationId, userId, sendMessageMutation]);

  const sendMediaMessage = useCallback((
    media: any,
    messageType: string,
    content?: string
  ) => {
    if (!conversationId || !userId) return;

    sendMediaMessageMutation.mutate({
      content,
      messageType,
      media,
    });
  }, [conversationId, userId, sendMediaMessageMutation]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  }, [addReactionMutation]);

  const sharePost = useCallback((postId: string, message?: string) => {
    sharePostMutation.mutate({ postId, message });
  }, [sharePostMutation]);

  const deleteMessage = useCallback((messageId: string, deleteFor = "me") => {
    deleteMessageMutation.mutate({ messageId, deleteFor });
  }, [deleteMessageMutation]);

  // Simple typing simulation (since we don't have real-time sockets)
  const handleTyping = useCallback((isTyping: boolean) => {
    // For now, this is just a placeholder
    // In a real implementation, you might send this to the server
    console.log("Typing:", isTyping);
  }, []);

  return {
    messages: messagesData?.messages || [],
    pagination: messagesData?.pagination,
    isLoading,
    error,
    refetch,
    sendMessage,
    sendMediaMessage,
    addReaction,
    sharePost,
    deleteMessage,
    isSending: sendMessageMutation.isPending || sendMediaMessageMutation.isPending,
    typingUsers: [],
    handleTyping,
  };
};