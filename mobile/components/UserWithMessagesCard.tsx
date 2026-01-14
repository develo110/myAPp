import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FollowButton from './FollowButton';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface UserWithMessages {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
}

interface UserWithMessagesCardProps {
  user: UserWithMessages;
  onStartConversation?: (user: UserWithMessages) => void;
}

const UserWithMessagesCard: React.FC<UserWithMessagesCardProps> = ({ 
  user, 
  onStartConversation 
}) => {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const handleUserPress = () => {
    router.push(`/user/${user.username}`);
  };

  const handleMessagePress = () => {
    onStartConversation?.(user);
  };

  const isFollowing = currentUser?.following?.includes(user._id);

  return (
    <TouchableOpacity 
      onPress={handleUserPress}
      className="bg-white border-b border-gray-100 p-4"
      activeOpacity={0.7}
    >
      {/* User Header */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: user.profilePicture || "" }}
          className="w-12 h-12 rounded-full mr-3"
        />
        
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="font-bold text-gray-900 mr-1">
              {user.firstName} {user.lastName}
            </Text>
            <Feather name="check-circle" size={16} color="#1DA1F2" />
          </View>
          
          <Text className="text-gray-500 text-sm">
            @{user.username}
          </Text>
          
          <View className="flex-row mt-1">
            <Text className="text-gray-500 text-xs mr-3">
              <Text className="font-semibold text-gray-900">{user.followers?.length || 0}</Text> followers
            </Text>
            <Text className="text-gray-500 text-xs">
              <Text className="font-semibold text-gray-900">{user.following?.length || 0}</Text> following
            </Text>
          </View>
        </View>

        <View className="ml-3">
          <FollowButton 
            targetUserId={user._id}
            isFollowing={isFollowing}
            size="small"
          />
        </View>
      </View>

      {user.bio && (
        <Text 
          className="text-gray-700 text-sm mb-3 ml-15" 
          numberOfLines={2}
        >
          {user.bio}
        </Text>
      )}

      {/* Start Conversation Button */}
      <View className="bg-gray-50 rounded-lg p-3 ml-15">
        <View className="flex-row items-center mb-2">
          <Feather name="message-circle" size={16} color="#1DA1F2" />
          <Text className="text-blue-600 font-semibold text-sm ml-2">
            Send Message
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleMessagePress}
          className="bg-blue-500 rounded-full py-2 px-4 mt-2 self-start"
        >
          <Text className="text-white font-semibold text-sm">
            Start Conversation
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default UserWithMessagesCard;