import EditProfileModal from "@/components/EditProfileModal";
import PostsList from "@/components/PostsList";
import SignOutButton from "@/components/SignOutButton";
import VideoAutoplaySettingsModal from "@/components/VideoAutoplaySettingsModal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePosts } from "@/hooks/usePosts";
import { useProfile } from "@/hooks/useProfile";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const ProfileScreens = () => {
  const { currentUser, isLoading } = useCurrentUser();
  const insets = useSafeAreaInsets();
  const { showImageOptions, isUploadingProfile, isUploadingBanner } = useImageUpload();
  const [isVideoSettingsVisible, setIsVideoSettingsVisible] = useState(false);

  const {
    posts: userPosts,
    refetch: refetchPosts,
    isLoading: isRefetching,
  } = usePosts(currentUser?.username);

  const {
    isEditModalVisible,
    openEditModal,
    closeEditModal,
    formData,
    saveProfile,
    updateFormField,
    isUpdating,
    refetch: refetchProfile,
  } = useProfile();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View>
          <Text className="text-xl font-bold text-gray-900">
            {currentUser.firstName} {currentUser.lastName}
          </Text>
          <Text className="text-gray-500 text-sm">{userPosts.length} Posts</Text>
        </View>
        <SignOutButton />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchProfile();
              refetchPosts();
            }}
            tintColor="#1DA1F2"
          />
        }
      >
        {/* Banner Image with Upload Option */}
        <View className="relative">
          <Image
            source={{
              uri:
                currentUser.bannerImage ||
                "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
            }}
            className="w-full h-48"
            resizeMode="cover"
          />
          
          {/* Banner Upload Button */}
          <TouchableOpacity
            className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2"
            onPress={() => showImageOptions("banner")}
            disabled={isUploadingBanner}
          >
            {isUploadingBanner ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Feather name="camera" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <View className="px-4 pb-4 border-b border-gray-100">
          <View className="flex-row justify-between items-end -mt-16 mb-4">
            {/* Profile Image with Upload Option */}
            <View className="relative">
              <Image
                source={{ uri: currentUser.profilePicture }}
                className="w-32 h-32 rounded-full border-4 border-white"
              />
              
              {/* Profile Image Upload Button */}
              <TouchableOpacity
                className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2"
                onPress={() => showImageOptions("profile")}
                disabled={isUploadingProfile}
              >
                {isUploadingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="camera" size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              className="border border-gray-300 px-6 py-2 rounded-full"
              onPress={openEditModal}
            >
              <Text className="font-semibold text-gray-900">Edit profile</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center mb-1">
              <Text className="text-xl font-bold text-gray-900 mr-1">
                {currentUser.firstName} {currentUser.lastName}
              </Text>
              <Feather name="check-circle" size={20} color="#1DA1F2" />
            </View>
            <Text className="text-gray-500 mb-2">@{currentUser.username}</Text>
            <Text className="text-gray-900 mb-3">{currentUser.bio}</Text>

            <View className="flex-row items-center mb-2">
              <Feather name="map-pin" size={16} color="#657786" />
              <Text className="text-gray-500 ml-2">{currentUser.location}</Text>
            </View>

            <View className="flex-row items-center mb-3">
              <Feather name="calendar" size={16} color="#657786" />
              <Text className="text-gray-500 ml-2">
                Joined {format(new Date(currentUser.createdAt), "MMMM yyyy")}
              </Text>
            </View>

            <View className="flex-row">
              <TouchableOpacity className="mr-6">
                <Text className="text-gray-900">
                  <Text className="font-bold">{currentUser.following?.length}</Text>
                  <Text className="text-gray-500"> Following</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-gray-900">
                  <Text className="font-bold">{currentUser.followers?.length}</Text>
                  <Text className="text-gray-500"> Followers</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="border-b border-gray-100">
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4"
            onPress={() => setIsVideoSettingsVisible(true)}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                <Feather name="play" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text className="font-medium text-gray-900">Video Autoplay</Text>
                <Text className="text-sm text-gray-500">Manage video autoplay settings</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <PostsList username={currentUser?.username} />
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={closeEditModal}
        formData={formData}
        saveProfile={saveProfile}
        updateFormField={updateFormField}
        isUpdating={isUpdating}
      />

      <VideoAutoplaySettingsModal
        visible={isVideoSettingsVisible}
        onClose={() => setIsVideoSettingsVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ProfileScreens;
