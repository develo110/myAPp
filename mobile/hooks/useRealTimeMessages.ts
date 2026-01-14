import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiClient, messageApi } from "../utils/api";
import { useNotifications } from "./useNotifications";

export const useRealTimeMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const { addNotification } = useNotifications();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll for new messages every 2 seconds
    const pollMessages = async () => {
      try {
        const response = await messageApi.getConversationMessages(api, conversationId, 1, 50);
        const messages = response.data.messages;
        
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          
          // If we have a new message, update the cache
          if (lastMessageIdRef.current !== latestMessage._id) {
            lastMessageIdRef.current = latestMessage._id;
            
            queryClient.setQueryData(["messages", conversationId], (old: any) => {
              if (!old) return { messages, pagination: response.data.pagination };
              
              // Check if this message already exists
              const messageExists = old.messages && Array.isArray(old.messages) 
                ? old.messages.some((msg: any) => msg._id === latestMessage._id)
                : false;
                
              if (!messageExists) {
                return {
                  ...old,
                  messages: old.messages ? [...old.messages, latestMessage] : [latestMessage],
                };
              }
              return old;
            });

            // Also update conversations list
            queryClient.setQueryData(["conversations"], (old: any[] | undefined) => {
              if (!old || !Array.isArray(old)) return old;
              
              return old.map(conv => {
                if (conv._id === conversationId) {
                  return {
                    ...conv,
                    lastMessage: {
                      _id: latestMessage._id,
                      content: latestMessage.content,
                      sender: latestMessage.sender,
                      createdAt: latestMessage.createdAt,
                    },
                    lastActivity: latestMessage.createdAt,
                  };
                }
                return conv;
              }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
            });
          }
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    // Initial poll
    pollMessages();

    // Set up polling interval
    intervalRef.current = setInterval(pollMessages, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [conversationId, api, queryClient]);

  return {
    isPolling: !!intervalRef.current,
  };
};