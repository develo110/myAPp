import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, userApi } from "../utils/api";

export const useImageUpload = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Profile image upload mutation
  const profileImageMutation = useMutation({
    mutationFn: (imageUri: string) => userApi.updateProfileImage(api, imageUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      Alert.alert("Success", "Profile image updated successfully!");
    },
    onError: (error: any) => {
      console.error("Profile image upload failed:", error);
      let errorMessage = "Failed to update profile image";
      
      if (error.response) {
        errorMessage = error.response.data?.error || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = "Network error. Check your connection.";
      } else {
        errorMessage = error.message || "Failed to update profile image";
      }
      
      Alert.alert("Error", errorMessage);
    },
  });

  // Banner image upload mutation
  const bannerImageMutation = useMutation({
    mutationFn: (imageUri: string) => userApi.updateBannerImage(api, imageUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      Alert.alert("Success", "Banner image updated successfully!");
    },
    onError: (error: any) => {
      console.error("Banner image upload failed:", error);
      let errorMessage = "Failed to update banner image";
      
      if (error.response) {
        errorMessage = error.response.data?.error || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = "Network error. Check your connection.";
      } else {
        errorMessage = error.message || "Failed to update banner image";
      }
      
      Alert.alert("Error", errorMessage);
    },
  });

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to upload images!"
      );
      return false;
    }
    return true;
  };

  const pickImage = async (type: "profile" | "banner") => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: type === "profile" ? [1, 1] : [3, 1], // Square for profile, 3:1 for banner
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        if (type === "profile") {
          profileImageMutation.mutate(imageUri);
        } else {
          bannerImageMutation.mutate(imageUri);
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async (type: "profile" | "banner") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera permissions to take photos!"
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === "profile" ? [1, 1] : [3, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        if (type === "profile") {
          profileImageMutation.mutate(imageUri);
        } else {
          bannerImageMutation.mutate(imageUri);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImageOptions = (type: "profile" | "banner") => {
    Alert.alert(
      `Update ${type === "profile" ? "Profile" : "Banner"} Image`,
      "Choose an option",
      [
        { text: "Camera", onPress: () => takePhoto(type) },
        { text: "Photo Library", onPress: () => pickImage(type) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return {
    showImageOptions,
    isUploadingProfile: profileImageMutation.isPending,
    isUploadingBanner: bannerImageMutation.isPending,
    isUploading: profileImageMutation.isPending || bannerImageMutation.isPending,
  };
};