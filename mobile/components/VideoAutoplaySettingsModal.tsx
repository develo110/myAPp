import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useVideoAutoplaySettings } from '../hooks/useVideoAutoplaySettings';

interface VideoAutoplaySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const VideoAutoplaySettingsModal: React.FC<VideoAutoplaySettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    settings,
    updateSettings,
    isUpdating,
    networkType,
    batteryLevel,
    isLowPowerMode,
  } = useVideoAutoplaySettings();

  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      Alert.alert('Success', 'Video autoplay settings updated successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  const SettingRow = ({
    title,
    description,
    value,
    onValueChange,
    disabled = false,
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View className="flex-row items-center justify-between py-4 px-4 border-b border-gray-100">
      <View className="flex-1 mr-4">
        <Text className={`font-medium text-base ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </Text>
        <Text className={`text-sm mt-1 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            Video Autoplay Settings
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-full ${
              isUpdating ? 'bg-gray-300' : 'bg-blue-500'
            }`}
          >
            <Text className="text-white font-medium">
              {isUpdating ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Current Status */}
          <View className="bg-gray-50 p-4 m-4 rounded-lg">
            <Text className="font-medium text-gray-900 mb-2">Current Status</Text>
            <View className="space-y-1">
              <Text className="text-sm text-gray-600">
                Network: {networkType || 'Unknown'}
              </Text>
              <Text className="text-sm text-gray-600">
                Battery: {Math.round(batteryLevel)}%
              </Text>
              <Text className="text-sm text-gray-600">
                Low Power Mode: {isLowPowerMode ? 'Active' : 'Inactive'}
              </Text>
              <Text className={`text-sm font-medium ${
                settings.enabled && !isLowPowerMode && batteryLevel >= settings.batteryThreshold
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                Autoplay: {
                  settings.enabled && !isLowPowerMode && batteryLevel >= settings.batteryThreshold
                    ? 'Enabled' 
                    : 'Disabled'
                }
              </Text>
            </View>
          </View>

          {/* Settings */}
          <View className="bg-white">
            <SettingRow
              title="Enable Video Autoplay"
              description="Automatically play videos when they appear on screen"
              value={localSettings.enabled}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, enabled: value })
              }
            />

            <SettingRow
              title="Data Saver Mode"
              description="Reduce data usage by limiting autoplay on cellular connections"
              value={localSettings.dataSaverMode}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, dataSaverMode: value })
              }
              disabled={!localSettings.enabled}
            />

            <SettingRow
              title="Wi-Fi Only"
              description="Only autoplay videos when connected to Wi-Fi"
              value={localSettings.wifiOnly}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, wifiOnly: value })
              }
              disabled={!localSettings.enabled || !localSettings.dataSaverMode}
            />

            <SettingRow
              title="Disable on Low Power Mode"
              description="Automatically disable autoplay when device is in low power mode"
              value={localSettings.lowPowerModeDisabled}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, lowPowerModeDisabled: value })
              }
              disabled={!localSettings.enabled}
            />
          </View>

          {/* Battery Threshold */}
          <View className="p-4 border-b border-gray-100">
            <Text className="font-medium text-gray-900 mb-2">
              Battery Threshold: {localSettings.batteryThreshold}%
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              Disable autoplay when battery level falls below this percentage
            </Text>
            <View className="flex-row items-center space-x-4">
              {[10, 15, 20, 25, 30].map((threshold) => (
                <TouchableOpacity
                  key={threshold}
                  onPress={() =>
                    setLocalSettings({ ...localSettings, batteryThreshold: threshold })
                  }
                  className={`px-3 py-2 rounded-full border ${
                    localSettings.batteryThreshold === threshold
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={!localSettings.enabled}
                >
                  <Text
                    className={`text-sm ${
                      localSettings.batteryThreshold === threshold
                        ? 'text-white'
                        : localSettings.enabled
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {threshold}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Help Text */}
          <View className="p-4">
            <Text className="text-sm text-gray-500 leading-5">
              Video autoplay helps you quickly preview content in your feed. Videos always start muted - tap to unmute and show controls. 
              These settings help you manage data usage and battery consumption.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={handleReset}
            className="w-full py-3 border border-gray-300 rounded-lg items-center"
          >
            <Text className="text-gray-700 font-medium">Reset to Current Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default VideoAutoplaySettingsModal;