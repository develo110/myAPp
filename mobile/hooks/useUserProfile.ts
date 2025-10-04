import { useQuery } from "@tanstack/react-query";
import { useApiClient, userApi } from "../utils/api";

export const useUserProfile = (username: string) => {
  const api = useApiClient();

  const {
    data: userProfile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => userApi.getUserProfile(api, username),
    select: (response) => response.data.user,
    enabled: !!username,
  });

  return { userProfile, isLoading, error, refetch };
};