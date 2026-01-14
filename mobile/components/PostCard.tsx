import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { Post, User } from "../types";
import { useVideoAutoplayContext } from "../contexts/VideoAutoplayContext";
import { useViewportDetection } from "../hooks/useViewportDetection";
import FullScreenMediaModal from "./FullScreenMediaModal";
import PostShareModal from "./PostShareModal";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onComment?: (post: Post) => void;
  currentUser: User | null;
  isLiked: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onDelete, 
  onComment,
  currentUser,
  isLiked 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const router = useRouter();
  
  const {
    registerVideo,
    unregisterVideo,
    updateVideoVisibility,
    isVideoPlaying,
    pauseVideo,
    playVideo,
    shouldAutoplay,
  } = useVideoAutoplayContext();

  // Handle viewport visibility changes for video autoplay
  const handleVisibilityChange = useCallback((isVisible: boolean, visibilityRatio: number) => {
    if (post.mediaType === "video" && post.video) {
      updateVideoVisibility(post._id, isVisible, visibilityRatio * 100);
    }
  }, [post._id, post.mediaType, post.video, updateVideoVisibility]);

  // Set up viewport detection for video posts
  const videoContainerRef = useViewportDetection(handleVisibilityChange, {
    threshold: 0.5, // 50% of video must be visible
    rootMargin: 10,
  });

  // Safety check for user data
  if (!post.user) {
    return null;
  }

  // Create video player for video posts
  const player = useVideoPlayer(post.video || "", (player) => {
    player.loop = false;
    player.muted = true; // Start muted for autoplay
  });

  // Register video for autoplay management
  useEffect(() => {
    if (post.mediaType === "video" && post.video && player) {
      const cleanup = registerVideo(post._id, player);
      return cleanup;
    }
  }, [post._id, post.mediaType, post.video, player, registerVideo]);

  // Handle video tap - unmute and show controls, or open fullscreen
  const handleVideoTap = () => {
    if (post.mediaType === "video" && player) {
      // If video is autoplaying, just unmute it
      if (isVideoPlaying(post._id)) {
        const newMutedState = !isVideoMuted;
        setIsVideoMuted(newMutedState);
        player.muted = newMutedState;
        setShowVideoControls(true);
        
        // Hide controls after 3 seconds
        setTimeout(() => setShowVideoControls(false), 3000);
      } else {
        // If video is not playing, open fullscreen
        setIsFullScreenVisible(true);
      }
    }
  };

  // Handle image tap - open fullscreen
  const handleImageTap = () => {
    if (post.mediaType === "image") {
      setIsFullScreenVisible(true);
    }
  };

  // Handle navigation to user profile
  const handleUserProfileNavigation = () => {
    router.push(`/user/${post.user.username}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete?.(post._id) },
      ]
    );
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(post._id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    setIsShareModalVisible(true);
  };

  const canDelete = post.user._id === currentUser?._id;
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;

  // Format numbers like Twitter
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Format time like Twitter
  const formatTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? "now" : `${diffInMinutes}m`;
    }
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable className="bg-white border-b border-gray-200/60">
      <View className="px-4 py-3">
        <View className="flex-row">
          {/* Profile Picture */}
          <TouchableOpacity className="mr-3" onPress={handleUserProfileNavigation}>
            <Image
              source={{ 
                uri: post.user.profilePicture || "https://via.placeholder.com/40" 
              }}
              className="w-10 h-10 rounded-full"
              onError={() => setImageError(true)}
            />
          </TouchableOpacity>

          {/* Post Content */}
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center flex-1">
                {/* Show only username for media posts, full name for text posts */}
                {(post.mediaType === "image" || post.mediaType === "video") ? (
                  <TouchableOpacity onPress={handleUserProfileNavigation}>
                    <Text className="font-bold text-gray-900 text-[15px]">
                      @{post.user.username}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={handleUserProfileNavigation}>
                      <Text className="font-bold text-gray-900 text-[15px]">
                        {post.user.firstName} {post.user.lastName}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="ml-1" onPress={handleUserProfileNavigation}>
                      <Text className="text-gray-500 text-[15px]">
                        @{post.user.username}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                <Text className="text-gray-500 text-[15px] mx-1">·</Text>
                <Text className="text-gray-500 text-[15px]">
                  {formatTime(post.createdAt)}
                </Text>
              </View>
              
              {/* More options */}
              <TouchableOpacity 
                className="p-1 rounded-full hover:bg-gray-100 -mr-1"
                onPress={canDelete ? handleDelete : undefined}
              >
                <Feather 
                  name="more-horizontal" 
                  size={16} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>

            {/* Post text content */}
            {post.content && (
              <View className="mb-3">
                <Text className="text-gray-900 text-[15px] leading-5">
                  {post.content}
                </Text>
              </View>
            )}

            {/* Media content */}
            {(post.mediaType === "image" && post.image) && (
              <View className="mb-3 -mx-1">
                <TouchableOpacity 
                  activeOpacity={0.95}
                  className="rounded-2xl overflow-hidden border border-gray-200/60"
                  onPress={handleImageTap}
                >
                  <Image
                    source={{ uri: post.image }}
                    style={{ 
                      width: screenWidth - 72, // Account for padding and profile pic
                      height: Math.min((screenWidth - 72) * 0.6, 300),
                    }}
                    resizeMode="cover"
                    className="bg-gray-100"
                    onError={() => setImageError(true)}
                  />
                </TouchableOpacity>
              </View>
            )}

            {(post.mediaType === "video" && post.video) && (
              <View className="mb-3 -mx-1" ref={videoContainerRef}>
                <TouchableOpacity 
                  activeOpacity={0.95}
                  className="rounded-2xl overflow-hidden border border-gray-200/60 relative"
                  onPress={handleVideoTap}
                >
                  <VideoView
                    style={{ 
                      width: screenWidth - 72,
                      height: Math.min((screenWidth - 72) * 0.6, 300),
                    }}
                    player={player}
                    allowsPictureInPicture
                    nativeControls={showVideoControls}
                  />
                  
                  {/* Video overlay indicators */}
                  <View className="absolute inset-0 pointer-events-none">
                    {/* Autoplay indicator */}
                    {isVideoPlaying(post._id) && (
                      <View className="absolute top-3 left-3">
                        <View className="bg-black/60 rounded-full px-2 py-1 flex-row items-center">
                          <View className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                          <Text className="text-white text-xs font-medium">AUTO</Text>
                        </View>
                      </View>
                    )}
                    
                    {/* Mute indicator */}
                    {isVideoMuted && (
                      <View className="absolute top-3 right-3">
                        <View className="bg-black/60 rounded-full p-2">
                          <Feather name="volume-x" size={16} color="white" />
                        </View>
                      </View>
                    )}
                    
                    {/* Play button overlay when not autoplaying */}
                    {!isVideoPlaying(post._id) && !shouldAutoplay && (
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="bg-black/60 rounded-full p-4">
                          <Feather name="play" size={24} color="white" />
                        </View>
                      </View>
                    )}
                    
                    {/* Loading indicator */}
                    {shouldAutoplay && !isVideoPlaying(post._id) && (
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="bg-black/60 rounded-full p-3">
                          <View className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Action buttons - Twitter style */}
            <View className="flex-row justify-between items-center mt-1 max-w-[425px]">
              {/* Reply */}
              <TouchableOpacity 
                className="flex-row items-center group"
                onPress={() => onComment?.(post)}
                activeOpacity={0.7}
              >
                <View className="p-2 rounded-full group-hover:bg-blue-50">
                  <Feather name="message-circle" size={16} color="#6B7280" />
                </View>
                {commentsCount > 0 && (
                  <Text className="text-gray-500 text-[13px] ml-1">
                    {formatCount(commentsCount)}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Retweet */}
              <TouchableOpacity 
                className="flex-row items-center group"
                activeOpacity={0.7}
                disabled
              >
                <View className="p-2 rounded-full group-hover:bg-green-50">
                  <Feather name="repeat" size={16} color="#6B7280" />
                </View>
              </TouchableOpacity>

              {/* Like */}
              <Pressable 
                className="flex-row items-center group"
                onPress={handleLike}
                disabled={isLiking}
              >
                <View className={`p-2 rounded-full ${isLiked ? 'group-hover:bg-pink-50' : 'group-hover:bg-pink-50'}`}>
                  <Feather
                    name="heart"
                    size={16}
                    color={isLiked ? "#F91880" : "#6B7280"}
                    fill={isLiked ? "#F91880" : "none"}
                  />
                </View>
                {likesCount > 0 && (
                  <Text className={`text-[13px] ml-1 ${
                    isLiked ? 'text-pink-600' : 'text-gray-500'
                  }`}>
                    {formatCount(likesCount)}
                  </Text>
                )}
              </Pressable>

              {/* Share */}
              <TouchableOpacity 
                className="flex-row items-center group"
                activeOpacity={0.7}
                onPress={handleShare}
              >
                <View className="p-2 rounded-full group-hover:bg-blue-50">
                  <Feather name="share" size={16} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Full Screen Media Modal */}
      <FullScreenMediaModal
        visible={isFullScreenVisible}
        onClose={() => setIsFullScreenVisible(false)}
        mediaType={post.mediaType === "image" ? "image" : post.mediaType === "video" ? "video" : null}
        mediaUri={post.mediaType === "image" ? (post.image || null) : (post.video || null)}
        userName={post.user.username}
      />

      {/* Post Share Modal */}
      <PostShareModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        postId={post._id}
        postContent={post.content}
        postAuthor={post.user.username}
      />
    </Pressable>
  );
};

export default PostCard;