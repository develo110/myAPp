import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useImageUpload } from "../hooks/useImageUpload";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  formData: {
    firstName: string;
    lastName: string;
    bio: string;
    location: string;
  };
  saveProfile: () => void;
  updateFormField: (field: string, value: string) => void;
  isUpdating: boolean;
}

const EditProfileModal = ({
  formData,
  isUpdating,
  isVisible,
  onClose,
  saveProfile,
  updateFormField,
}: EditProfileModalProps) => {
  const { currentUser } = useCurrentUser();
  const { showImageOptions, isUploadingProfile, isUploadingBanner } = useImageUpload();

  const handleSave = () => {
    saveProfile();
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={onClose}>
          <Text className="text-blue-500 text-lg">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold">Edit Profile</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isUpdating}
          className={`${isUpdating ? "opacity-50" : ""}`}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#1DA1F2" />
          ) : (
            <Text className="text-blue-500 text-lg font-semibold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Profile Images Section */}
        <View className="mb-6">
          <Text className="text-gray-500 text-sm mb-4">Profile Images</Text>
          
          {/* Banner Image */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm mb-2">Banner Image</Text>
            <View className="relative">
              <Image
                source={{
                  uri: currentUser?.bannerImage || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop"
                }}
                className="w-full h-32 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2"
                onPress={() => showImageOptions("banner")}
                disabled={isUploadingBanner}
              >
                {isUploadingBanner ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="camera" size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Image */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm mb-2">Profile Image</Text>
            <View className="relative self-start">
              <Image
                source={{ uri: currentUser?.profilePicture }}
                className="w-20 h-20 rounded-full"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1"
                onPress={() => showImageOptions("profile")}
                disabled={isUploadingProfile}
              >
                {isUploadingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="camera" size={12} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-500 text-sm mb-2">First Name</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 text-base"
              value={formData.firstName}
              onChangeText={(text) => updateFormField("firstName", text)}
              placeholder="Your first name"
            />
          </View>

          <View>
            <Text className="text-gray-500 text-sm mb-2">Last Name</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-3 text-base"
              value={formData.lastName}
              onChangeText={(text) => updateFormField("lastName", text)}
              placeholder="Your last name"
            />
          </View>

          <View>
            <Text className="text-gray-500 text-sm mb-2">Bio</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-3 text-base"
              value={formData.bio}
              onChangeText={(text) => updateFormField("bio", text)}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View>
            <Text className="text-gray-500 text-sm mb-2">Location</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-3 text-base"
              value={formData.location}
              onChangeText={(text) => updateFormField("location", text)}
              placeholder="Where are you located?"
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default EditProfileModal;
