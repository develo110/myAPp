import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getBatteryLevelAsync } from 'expo-battery';

export interface VideoAutoplaySettings {
  enabled: boolean;
  dataSaverMode: boolean;
  wifiOnly: boolean;
  lowPowerModeDisabled: boolean;
  batteryThreshold: number; // Percentage below which autoplay is disabled
}

const DEFAULT_SETTINGS: VideoAutoplaySettings = {
  enabled: true,
  dataSaverMode: false,
  wifiOnly: false,
  lowPowerModeDisabled: true,
  batteryThreshold: 20,
};

const STORAGE_KEY = 'videoAutoplaySettings';

export const useVideoAutoplaySettings = () => {
  const [networkType, setNetworkType] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isLowPowerMode, setIsLowPowerMode] = useState<boolean>(false);

  // Load settings from AsyncStorage
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["videoAutoplaySettings"],
    queryFn: async (): Promise<VideoAutoplaySettings> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: Infinity, // Settings don't change unless user updates them
  });

  const queryClient = useQueryClient();

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<VideoAutoplaySettings>) => {
      const currentSettings = settings || DEFAULT_SETTINGS;
      const newSettings = { ...currentSettings, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["videoAutoplaySettings"], newSettings);
    },
  });

  // Monitor network and battery status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkType(state.type);
    });

    const checkBattery = async () => {
      try {
        const level = await getBatteryLevelAsync();
        setBatteryLevel(level * 100);
        // Note: React Native doesn't have direct low power mode detection
        // We'll use battery level as a proxy
        setIsLowPowerMode(level * 100 < (settings?.batteryThreshold || 20));
      } catch (error) {
        console.warn('Battery level check failed:', error);
      }
    };

    checkBattery();
    const batteryInterval = setInterval(checkBattery, 30000); // Check every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(batteryInterval);
    };
  }, [settings?.batteryThreshold]);

  // Determine if autoplay should be enabled based on current conditions
  const shouldAutoplay = (): boolean => {
    if (!settings?.enabled) return false;
    
    // Check low power mode
    if (settings.lowPowerModeDisabled && isLowPowerMode) return false;
    
    // Check battery level
    if (batteryLevel < settings.batteryThreshold) return false;
    
    // Check data saver mode and network type
    if (settings.dataSaverMode) {
      if (settings.wifiOnly && networkType !== 'wifi') return false;
      if (networkType === 'cellular') return false;
    }
    
    return true;
  };

  const updateSettings = (updates: Partial<VideoAutoplaySettings>) => {
    return updateSettingsMutation.mutateAsync(updates);
  };

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    error,
    updateSettings,
    isUpdating: updateSettingsMutation.isPending,
    shouldAutoplay: shouldAutoplay(),
    networkType,
    batteryLevel,
    isLowPowerMode,
  };
};