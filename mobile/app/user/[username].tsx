import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePosts } from "@/hooks/usePosts";
import PostsList from "@/components/PostsList";
import FollowButton from "@/components/FollowButton";

const UserProfileScreen = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { userProfile, isLoading, refetch } = useUserProfile(username!);
  const { currentUser } = useCurrentUser();
  
  const {
    posts: userPosts,
    refetch: refetchPosts,
    isLoading: isRefetching,
  } = usePosts(username);

  if (isLoading || !userProfile) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  const isOwnProfile = currentUser?._id === userProfile._id;
  const isFollowing = currentUser?.following?.includes(userProfile._id);


  const handleRefresh = () => {
    refetch();
    refetchPosts();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900">
              {userProfile.firstName} {userProfile.lastName}
            </Text>
            <Text className="text-gray-500 text-sm">{userPosts.length} Posts</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#1DA1F2"
          />
        }
      >
        {/* Banner Image */}
        <Image
          source={{
            uri:
              userProfile.bannerImage ||
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
          }}
          className="w-full h-48"
          resizeMode="cover"
        />

        {/* Profile Info */}
        <View className="px-4 pb-4 border-b border-gray-100">
          <View className="flex-row justify-between items-end -mt-16 mb-4">
            <Image
              source={{ uri: userProfile.profilePicture }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
            
            <FollowButton 
              targetUserId={userProfile._id}
              isFollowing={isFollowing}
              size="medium"
            />
          </View>

          <View className="mb-4">
            <View className="flex-row items-center mb-1">
              <Text className="text-xl font-bold text-gray-900 mr-1">
                {userProfile.firstName} {userProfile.lastName}
              </Text>
              <Feather name="check-circle" size={20} color="#1DA1F2" />
            </View>
            <Text className="text-gray-500 mb-2">@{userProfile.username}</Text>
            
            {userProfile.bio && (
              <Text className="text-gray-900 mb-3">{userProfile.bio}</Text>
            )}

            {userProfile.location && (
              <View className="flex-row items-center mb-2">
                <Feather name="map-pin" size={16} color="#657786" />
                <Text className="text-gray-500 ml-2">{userProfile.location}</Text>
              </View>
            )}

            <View className="flex-row items-center mb-3">
              <Feather name="calendar" size={16} color="#657786" />
              <Text className="text-gray-500 ml-2">
                Joined {format(new Date(userProfile.createdAt), "MMMM yyyy")}
              </Text>
            </View>

            <View className="flex-row">
              <TouchableOpacity className="mr-6">
                <Text className="text-gray-900">
                  <Text className="font-bold">{userProfile.following?.length || 0}</Text>
                  <Text className="text-gray-500"> Following</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-gray-900">
                  <Text className="font-bold">{userProfile.followers?.length || 0}</Text>
                  <Text className="text-gray-500"> Followers</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* User's Posts */}
        <PostsList username={userProfile.username} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserProfileScreen;