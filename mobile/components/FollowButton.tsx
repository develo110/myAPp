import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useFollow } from '@/hooks/useFollow';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface FollowButtonProps {
  targetUserId: string;
  isFollowing?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: 'default' | 'outline';
}

const FollowButton: React.FC<FollowButtonProps> = ({ 
  targetUserId, 
  isFollowing = false,
  size = 'medium',
  style = 'default'
}) => {
  const { followUser, isLoading } = useFollow();
  const { currentUser } = useCurrentUser();

  // Don't show follow button for own profile
  if (currentUser?._id === targetUserId) {
    return null;
  }

  const handlePress = () => {
    followUser(targetUserId);
  };

  // Size variations
  const sizeClasses = {
    small: 'px-3 py-1',
    medium: 'px-4 py-2',
    large: 'px-6 py-3'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  // Style variations
  const getButtonClasses = () => {
    const baseClasses = `${sizeClasses[size]} rounded-full`;
    
    if (style === 'outline') {
      return `${baseClasses} border border-gray-300`;
    }
    
    if (isFollowing) {
      return `${baseClasses} border border-gray-300`;
    }
    
    return `${baseClasses} bg-black`;
  };

  const getTextClasses = () => {
    const baseClasses = `font-semibold ${textSizeClasses[size]}`;
    
    if (style === 'outline') {
      return `${baseClasses} text-gray-900`;
    }
    
    if (isFollowing) {
      return `${baseClasses} text-gray-900`;
    }
    
    return `${baseClasses} text-white`;
  };

  return (
    <TouchableOpacity
      className={getButtonClasses()}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={isFollowing || style === 'outline' ? "#000" : "#fff"} 
        />
      ) : (
        <Text className={getTextClasses()}>
          {isFollowing ? "Following" : "Follow"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default FollowButton;