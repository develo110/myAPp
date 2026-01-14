import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useRouter } from 'expo-router';

interface FullScreenMediaModalProps {
  visible: boolean;
  onClose: () => void;
  mediaType: 'image' | 'video' | null;
  mediaUri: string | null;
  userName?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FullScreenMediaModal: React.FC<FullScreenMediaModalProps> = ({
  visible,
  onClose,
  mediaType,
  mediaUri,
  userName,
}) => {
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();

  // Video player for video content
  const player = useVideoPlayer(mediaUri || '', (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Hide controls after timeout
  const hideControlsAfterTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Show controls and set timeout
  const handleShowControls = () => {
    setShowControls(true);
    hideControlsAfterTimeout();
  };

  // Handle navigation to user profile
  const handleUserProfileNavigation = () => {
    if (userName) {
      onClose(); // Close the modal first
      router.push(`/user/${userName}`);
    }
  };

  // Reset when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setShowControls(true);
      hideControlsAfterTimeout();
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [visible]);

  if (!visible || !mediaUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1">
          {/* Controls Overlay */}
          {showControls && (
            <View className="absolute top-0 left-0 right-0 z-10 bg-black/50 px-4 py-3">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2 rounded-full bg-black/30"
                >
                  <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
                {userName && (
                  <TouchableOpacity 
                    className="flex-1 mx-4"
                    onPress={handleUserProfileNavigation}
                  >
                    <Text className="text-white font-medium text-center">
                      @{userName}
                    </Text>
                  </TouchableOpacity>
                )}
                <View className="w-10" />
              </View>
            </View>
          )}

          {/* Media Content */}
          <View className="flex-1 items-center justify-center">
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleShowControls}
              className="flex-1 w-full items-center justify-center"
            >
              {mediaType === 'image' ? (
                <Image
                  source={{ uri: mediaUri }}
                  style={{
                    width: screenWidth,
                    height: screenHeight,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <VideoView
                  style={{
                    width: screenWidth,
                    height: screenHeight * 0.9,
                  }}
                  player={player}
                  allowsPictureInPicture={false}
                  nativeControls={showControls}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Controls for Images */}
          {mediaType === 'image' && showControls && (
            <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-6">
              <View className="flex-row items-center justify-center space-x-8">
                <TouchableOpacity className="p-3 rounded-full bg-black/30">
                  <Feather name="download" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity className="p-3 rounded-full bg-black/30">
                  <Feather name="share" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default FullScreenMediaModal;