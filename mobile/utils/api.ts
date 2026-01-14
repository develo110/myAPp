import axios, { AxiosInstance } from "axios";
import { useAuth } from "@clerk/clerk-expo";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL + "/api" || "https://x-clone-rn.vercel.app/api";
// ! 🔥 localhost api would not work on your actual physical device
// const API_BASE_URL = "http://localhost:5001/api";

// this will basically create an authenticated api, pass the token into our headers
export const createApiClient = (getToken: () => Promise<string | null>): AxiosInstance => {
  const api = axios.create({ baseURL: API_BASE_URL });

  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
};

export const useApiClient = (): AxiosInstance => {
  const { getToken } = useAuth();
  return createApiClient(getToken);
};

export const userApi = {
  syncUser: (api: AxiosInstance) => api.post("/users/sync"),
  getCurrentUser: (api: AxiosInstance) => api.get("/users/me"),
  updateProfile: (api: AxiosInstance, data: any) => api.put("/users/profile", data),
  updateProfileImage: (api: AxiosInstance, imageUri: string) => {
    const formData = new FormData();
    formData.append("profileImage", {
      uri: imageUri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);
    return api.put("/users/profile-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateBannerImage: (api: AxiosInstance, imageUri: string) => {
    const formData = new FormData();
    formData.append("bannerImage", {
      uri: imageUri,
      type: "image/jpeg",
      name: "banner.jpg",
    } as any);
    return api.put("/users/banner-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getUserProfile: (api: AxiosInstance, username: string) => api.get(`/users/profile/${username}`),
  followUser: (api: AxiosInstance, targetUserId: string) => api.post(`/users/follow/${targetUserId}`),
  searchUsers: (api: AxiosInstance, query: string) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  searchUsersAndMessages: (api: AxiosInstance, query: string) => api.get(`/users/search-messages?q=${encodeURIComponent(query)}`),
};

export const postApi = {
  createPost: (api: AxiosInstance, data: { content: string; image?: string }) =>
    api.post("/posts", data),
  getPosts: (api: AxiosInstance) => api.get("/posts"),
  getUserPosts: (api: AxiosInstance, username: string) => api.get(`/posts/user/${username}`),
  likePost: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/like`),
  deletePost: (api: AxiosInstance, postId: string) => api.delete(`/posts/${postId}`),
};

export const commentApi = {
  createComment: (api: AxiosInstance, postId: string, content: string) =>
    api.post(`/comments/post/${postId}`, { content }),
  getComments: (api: AxiosInstance, postId: string) => api.get(`/comments/post/${postId}`),
  deleteComment: (api: AxiosInstance, commentId: string) => api.delete(`/comments/${commentId}`),
};

export const messageApi = {
  // Conversations
  getOrCreateConversation: (api: AxiosInstance, participantId: string) =>
    api.post("/messages/conversations", { participantId }),
  createGroupConversation: (api: AxiosInstance, data: { 
    participantIds: string[]; 
    groupName?: string; 
    groupDescription?: string; 
  }) => api.post("/messages/conversations/group", data),
  getUserConversations: (api: AxiosInstance, type = "all", archived = false) => 
    api.get(`/messages/conversations?type=${type}&archived=${archived}`),
  
  // Messages
  sendMessage: (api: AxiosInstance, data: { 
    conversationId: string; 
    content: string; 
    messageType?: string;
    replyToId?: string;
    isGhost?: boolean;
    ghostDuration?: number;
    sharedPostId?: string;
  }) => api.post("/messages", data),
  sendMediaMessage: (api: AxiosInstance, data: {
    conversationId: string;
    content?: string;
    messageType: string;
    media: any;
  }) => {
    const formData = new FormData();
    formData.append("conversationId", data.conversationId);
    if (data.content) formData.append("content", data.content);
    formData.append("messageType", data.messageType);
    formData.append("media", data.media);
    
    return api.post("/messages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getConversationMessages: (api: AxiosInstance, conversationId: string, page = 1, limit = 50) =>
    api.get(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`),
  markMessagesAsRead: (api: AxiosInstance, conversationId: string) =>
    api.put(`/messages/conversation/${conversationId}/read`),
  deleteMessage: (api: AxiosInstance, messageId: string, deleteFor = "me") => 
    api.delete(`/messages/${messageId}`, { data: { deleteFor } }),
  
  // Reactions
  addReaction: (api: AxiosInstance, messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/reactions`, { emoji }),
  
  // Post sharing
  sharePost: (api: AxiosInstance, data: { 
    conversationId: string; 
    postId: string; 
    message?: string; 
  }) => api.post("/messages/share-post", data),
  
  sharePostToFollowers: (api: AxiosInstance, data: {
    postId: string;
    followerIds: string[];
    message?: string;
  }) => api.post("/messages/share-post-to-followers", data),
  
  getFollowersForSharing: (api: AxiosInstance) => api.get("/messages/followers-for-sharing"),
  
  // Settings
  getMessagingSettings: (api: AxiosInstance) => api.get("/messages/settings"),
  updateMessagingSettings: (api: AxiosInstance, settings: any) => 
    api.put("/messages/settings", settings),
  
  // Chat games
  startChatGame: (api: AxiosInstance, data: {
    conversationId: string;
    gameType: string;
    settings?: any;
  }) => api.post("/messages/games", data),
};

export const notificationApi = {
  getNotifications: (api: AxiosInstance) => api.get("/notifications"),
  markNotificationAsRead: (api: AxiosInstance, notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: (api: AxiosInstance) => api.patch("/notifications/mark-all-read"),
  deleteNotification: (api: AxiosInstance, notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
};
