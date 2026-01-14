import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useApiClient } from "../utils/api";

export const useCreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const api = useApiClient();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; mediaUri?: string; mediaType: "none" | "image" | "video" }) => {
      const formData = new FormData();

      if (postData.content) formData.append("content", postData.content);

      if (postData.mediaUri && postData.mediaType !== "none") {
        const uriParts = postData.mediaUri.split(".");
        const fileType = uriParts[uriParts.length - 1].toLowerCase();

        let mimeType: string;
        let fileName: string;

        if (postData.mediaType === "video") {
          const videoMimeTypeMap: Record<string, string> = {
            mp4: "video/mp4",
            mov: "video/quicktime",
            avi: "video/x-msvideo",
            mkv: "video/x-matroska",
            webm: "video/webm",
          };
          mimeType = videoMimeTypeMap[fileType] || "video/mp4";
          fileName = `video.${fileType}`;
        } else {
          const imageMimeTypeMap: Record<string, string> = {
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
          };
          mimeType = imageMimeTypeMap[fileType] || "image/jpeg";
          fileName = `image.${fileType}`;
        }

        formData.append("media", {
          uri: postData.mediaUri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      return api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      setContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setMediaType("none");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      Alert.alert("Success", "Post created successfully!");
    },
    onError: (error: any) => {
      console.error("Post creation error:", error);
      const errorMessage = error.response?.data?.error || "Failed to create post. Please try again.";
      Alert.alert("Error", errorMessage);
    },
  });

  const handleImagePicker = async (useCamera: boolean = false) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== "granted") {
      const source = useCamera ? "camera" : "photo library";
      Alert.alert("Permission needed", `Please grant permission to access your ${source}`);
      return;
    }

    const pickerOptions = {
      allowsEditing: true,
      aspect: [16, 9] as [number, number],
      quality: 0.8,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync({
          ...pickerOptions,
          mediaTypes: ["images"],
        });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null);
      setMediaType("image");
    }
  };

  const handleVideoPicker = async (useCamera: boolean = false) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== "granted") {
      const source = useCamera ? "camera" : "photo library";
      Alert.alert("Permission needed", `Please grant permission to access your ${source}`);
      return;
    }

    const pickerOptions = {
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          ...pickerOptions,
          mediaTypes: ["videos"],
        })
      : await ImagePicker.launchImageLibraryAsync({
          ...pickerOptions,
          mediaTypes: ["videos"],
        });

    if (!result.canceled) {
      const videoAsset = result.assets[0];
      
      // Check video duration (max 60 seconds)
      if (videoAsset.duration && videoAsset.duration > 60000) {
        Alert.alert("Video too long", "Please select a video that is 60 seconds or shorter.");
        return;
      }

      setSelectedVideo(videoAsset.uri);
      setSelectedImage(null);
      setMediaType("video");
    }
  };

  const createPost = () => {
    if (!content.trim() && mediaType === "none") {
      Alert.alert("Empty Post", "Please write something or add media before posting!");
      return;
    }

    const postData: { content: string; mediaUri?: string; mediaType: "none" | "image" | "video" } = {
      content: content.trim(),
      mediaType,
    };

    if (mediaType === "image" && selectedImage) {
      postData.mediaUri = selectedImage;
    } else if (mediaType === "video" && selectedVideo) {
      postData.mediaUri = selectedVideo;
    }

    createPostMutation.mutate(postData);
  };

  const removeMedia = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
    setMediaType("none");
  };

  return {
    content,
    setContent,
    selectedImage,
    selectedVideo,
    mediaType,
    isCreating: createPostMutation.isPending,
    pickImageFromGallery: () => handleImagePicker(false),
    takePhoto: () => handleImagePicker(true),
    pickVideoFromGallery: () => handleVideoPicker(false),
    recordVideo: () => handleVideoPicker(true),
    removeMedia,
    createPost,
  };
};
