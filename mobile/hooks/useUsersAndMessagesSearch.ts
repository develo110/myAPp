import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApiClient, userApi } from "../utils/api";

interface MessagePreview {
  id: number;
  text: string;
  fromUser: boolean;
  time: string;
}

interface UserWithMessages {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
  hasMessages: boolean;
  lastMessage: string;
  lastMessageTime: string;
  messagePreview: MessagePreview[];
}

export const useUsersAndMessagesSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const api = useApiClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search query
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["usersAndMessagesSearch", debouncedQuery],
    queryFn: () => userApi.searchUsersAndMessages(api, debouncedQuery),
    select: (response) => response.data,
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    searchResults: (searchResults?.results || []) as UserWithMessages[],
    resultCount: searchResults?.count || 0,
    isLoading,
    error,
    refetch,
    clearSearch,
    hasSearched: debouncedQuery.trim().length > 0,
  };
};