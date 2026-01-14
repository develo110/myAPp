import { useCreatePost } from "../hooks/useCreatePost";
import { useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useState } from "react";

const { width: screenWidth } = Dimensions.get('window');

const PostComposer = () => {
  const {
    content,
    setContent,
    selectedImage,
    selectedVideo,
    mediaType,
    isCreating,
    pickImageFromGallery,
    takePhoto,
    pickVideoFromGallery,
    recordVideo,
    removeMedia,
    createPost,
  } = useCreatePost();

  const { user } = useUser();
  const [isFocused, setIsFocused] = useState(false);

  // Create video player for video posts
  const player = useVideoPlayer(selectedVideo || "", (player) => {
    player.loop = false;
  });

  const charactersLeft = 280 - content.length;
  const isOverLimit = charactersLeft < 0;
  const canPost = (content.trim() || mediaType !== "none") && !isOverLimit;

  // Twitter-style character count circle
  const getCircleColor = () => {
    if (charactersLeft < 0) return "#F91880"; // Red
    if (charactersLeft < 20) return "#FFD400"; // Yellow
    return "#1D9BF0"; // Blue
  };

  const getCircleProgress = () => {
    const progress = (280 - charactersLeft) / 280;
    return Math.min(progress, 1);
  };

  return (
    <View className="bg-white border-b border-gray-200/60">
      <View className="px-4 py-3">
        <View className="flex-row">
          {/* Profile Picture */}
          <View className="mr-3">
            <Image 
              source={{ uri: user?.imageUrl || "https://via.placeholder.com/40" }} 
              className="w-10 h-10 rounded-full" 
            />
          </View>

          {/* Input Area */}
          <View className="flex-1">
            <TextInput
              className="text-gray-900 text-[20px] leading-6"
              placeholder="What is happening?!"
              placeholderTextColor="#9CA3AF"
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={300}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{ 
                textAlignVertical: 'top',
                minHeight: 60,
                fontSize: 20,
                lineHeight: 24,
              }}
            />

            {/* Media Preview */}
            {mediaType === "image" && selectedImage && (
              <View className="mt-3">
                <View className="relative rounded-2xl overflow-hidden border border-gray-200/60">
                  <Image
                    source={{ uri: selectedImage }}
                    style={{ 
                      width: screenWidth - 72,
                      height: Math.min((screenWidth - 72) * 0.6, 300),
                    }}
                    resizeMode="cover"
                    className="bg-gray-100"
                  />
                  <TouchableOpacity
                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full items-center justify-center"
                    onPress={removeMedia}
                  >
                    <Feather name="x" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mediaType === "video" && selectedVideo && (
              <View className="mt-3">
                <View className="relative rounded-2xl overflow-hidden border border-gray-200/60">
                  <VideoView
                    style={{ 
                      width: screenWidth - 72,
                      height: Math.min((screenWidth - 72) * 0.6, 300),
                    }}
                    player={player}
                    allowsPictureInPicture
                  />
                  <TouchableOpacity
                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full items-center justify-center"
                    onPress={removeMedia}
                  >
                    <Feather name="x" size={16} color="white" />
                  </TouchableOpacity>
                  <View className="absolute bottom-2 left-2 bg-black/70 rounded-lg px-2 py-1">
                    <Text className="text-white text-xs font-semibold">VIDEO</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Twitter-style divider when focused or has content */}
            {(isFocused || content.length > 0) && (
              <View className="border-b border-gray-200/60 my-3" />
            )}

            {/* Everyone can reply section (Twitter style) */}
            {(isFocused || content.length > 0) && (
              <View className="flex-row items-center mb-3">
                <Feather name="globe" size={16} color="#1D9BF0" />
                <Text className="text-blue-500 text-[15px] font-medium ml-2">
                  Everyone can reply
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Bar */}
        <View className="flex-row justify-between items-center mt-3">
          {/* Media Options */}
          <View className="flex-row items-center">
            <TouchableOpacity 
              className="p-2 rounded-full hover:bg-blue-50 mr-1"
              onPress={pickImageFromGallery}
            >
              <Feather name="image" size={20} color="#1D9BF0" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="p-2 rounded-full hover:bg-blue-50 mr-1"
              onPress={pickVideoFromGallery}
            >
              <Feather name="video" size={20} color="#1D9BF0" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="p-2 rounded-full hover:bg-blue-50 mr-1"
              onPress={takePhoto}
            >
              <Feather name="camera" size={20} color="#1D9BF0" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="p-2 rounded-full hover:bg-blue-50 mr-1"
              disabled
            >
              <Feather name="smile" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Right side - Character count and Post button */}
          <View className="flex-row items-center">
            {/* Character count circle (Twitter style) */}
            {content.length > 0 && (
              <View className="mr-3 relative">
                <View className="w-8 h-8 items-center justify-center">
                  {/* Background circle */}
                  <View 
                    className="absolute w-8 h-8 rounded-full border-2"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                  {/* Progress circle */}
                  <View 
                    className="absolute w-8 h-8 rounded-full border-2"
                    style={{ 
                      borderColor: getCircleColor(),
                      transform: [{ rotate: `${getCircleProgress() * 360}deg` }]
                    }}
                  />
                  {/* Character count text */}
                  {charactersLeft < 20 && (
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: getCircleColor() }}
                    >
                      {charactersLeft < 0 ? charactersLeft : ''}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Divider */}
            {content.length > 0 && (
              <View className="w-px h-8 bg-gray-200 mr-3" />
            )}

            {/* Post Button */}
            <TouchableOpacity
              className={`px-6 py-1.5 rounded-full min-w-[70px] items-center justify-center ${
                canPost && !isCreating
                  ? "bg-blue-500" 
                  : "bg-blue-300"
              }`}
              onPress={createPost}
              disabled={isCreating || !canPost}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-[15px]">
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PostComposer;