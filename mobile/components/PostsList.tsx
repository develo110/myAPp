import { useCurrentUser } from "../hooks/useCurrentUser";
import { usePosts } from "../hooks/usePosts";
import { Post } from "../types/index";
import { View, Text, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import PostCard from "./PostCard";
import { useState } from "react";
import CommentsModal from "./CommentsModal";
import { VideoAutoplayProvider } from "../contexts/VideoAutoplayContext";

const PostsList = ({ username }: { username?: string }) => {
  const { currentUser } = useCurrentUser();
  const { posts, isLoading, error, refetch, toggleLike, deletePost, checkIsLiked } =
    usePosts(username);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const selectedPost = selectedPostId ? posts.find((p: Post) => p._id === selectedPostId) : null;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <View className="items-center">
        <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
          <Feather name="message-square" size={32} color="#9CA3AF" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {username ? "No posts yet" : "Welcome to X"}
        </Text>
        <Text className="text-gray-500 text-center leading-6 text-[15px]">
          {username 
            ? "When they post, their posts will show up here." 
            : "When you follow accounts, you'll see their posts here."
          }
        </Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <View className="items-center">
        <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6">
          <Feather name="wifi-off" size={32} color="#EF4444" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </Text>
        <Text className="text-gray-500 text-center leading-6 mb-8 text-[15px]">
          Try reloading.
        </Text>
        <TouchableOpacity 
          className="bg-black px-8 py-3 rounded-full"
          onPress={() => refetch()}
        >
          <Text className="text-white font-bold text-[15px]">Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoadingState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#1D9BF0" />
    </View>
  );

  if (isLoading && posts.length === 0) {
    return renderLoadingState();
  }

  if (error && posts.length === 0) {
    return renderErrorState();
  }

  if (posts.length === 0) {
    return renderEmptyState();
  }

  return (
    <VideoAutoplayProvider>
      <View className="flex-1 bg-white">
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1D9BF0']}
              tintColor="#1D9BF0"
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {posts.map((post: Post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={toggleLike}
              onDelete={deletePost}
              onComment={(post: Post) => setSelectedPostId(post._id)}
              currentUser={currentUser}
              isLiked={checkIsLiked(post.likes, currentUser)}
            />
          ))}
        </ScrollView>

        <CommentsModal 
          selectedPost={selectedPost} 
          onClose={() => setSelectedPostId(null)} 
        />
      </View>
    </VideoAutoplayProvider>
  );
};

export default PostsList;
