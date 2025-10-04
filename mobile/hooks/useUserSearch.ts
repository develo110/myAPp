import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApiClient, userApi } from "../utils/api";

export const useUserSearch = () => {
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
    queryKey: ["userSearch", debouncedQuery],
    queryFn: () => userApi.searchUsers(api, debouncedQuery),
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
    searchResults: searchResults?.users || [],
    resultCount: searchResults?.count || 0,
    isLoading,
    error,
    refetch,
    clearSearch,
    hasSearched: debouncedQuery.trim().length > 0,
  };
};