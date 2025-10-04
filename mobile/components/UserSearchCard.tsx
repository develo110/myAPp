import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FollowButton from './FollowButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
}

interface UserSearchCardProps {
  user: User;
}

const UserSearchCard: React.FC<UserSearchCardProps> = ({ user }) => {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const handlePress = () => {
    router.push(`/user/${user.username}`);
  };

  const isFollowing = currentUser?.following?.includes(user._id);

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="flex-row items-center p-4 bg-white border-b border-gray-100"
      activeOpacity={0.7}
    >
      {/* Profile Picture */}
      <Image
        source={{ uri: user.profilePicture || "" }}
        className="w-12 h-12 rounded-full mr-3"
      />

      {/* User Info */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="font-bold text-gray-900 mr-1">
            {user.firstName} {user.lastName}
          </Text>
          <Feather name="check-circle" size={16} color="#1DA1F2" />
        </View>
        
        <Text className="text-gray-500 text-sm mb-1">
          @{user.username}
        </Text>
        
        {user.bio && (
          <Text 
            className="text-gray-700 text-sm leading-4"
            numberOfLines={2}
          >
            {user.bio}
          </Text>
        )}
        
        <View className="flex-row mt-2">
          <Text className="text-gray-500 text-xs mr-4">
            <Text className="font-semibold text-gray-900">{user.followers?.length || 0}</Text> followers
          </Text>
          <Text className="text-gray-500 text-xs">
            <Text className="font-semibold text-gray-900">{user.following?.length || 0}</Text> following
          </Text>
        </View>
      </View>

      {/* Follow Button */}
      <View className="ml-3" onStartShouldSetResponder={() => true}>
        <FollowButton 
          targetUserId={user._id}
          isFollowing={isFollowing}
          size="small"
        />
      </View>
    </TouchableOpacity>
  );
};

export default UserSearchCard;