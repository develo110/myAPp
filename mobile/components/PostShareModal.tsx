import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { usePostSharing } from "../hooks/usePostSharing";

interface Follower {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  clerkId: string;
  canMessage: boolean;
  isRequest: boolean;
}

interface PostShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postContent?: string;
  postAuthor?: string;
}

const PostShareModal: React.FC<PostShareModalProps> = ({
  visible,
  onClose,
  postId,
  postContent,
  postAuthor,
}) => {
  const [selectedFollowers, setSelectedFollowers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { isLoading, followers, loadFollowers, sharePostToFollowers } = usePostSharing();

  // Load followers when modal opens
  useEffect(() => {
    if (visible) {
      loadFollowersData();
      setSelectedFollowers(new Set());
      setMessage("");
      setSearchQuery("");
    }
  }, [visible]);

  const loadFollowersData = async () => {
    try {
      await loadFollowers();
    } catch (error) {
      Alert.alert("Error", "Failed to load followers");
    }
  };

  const toggleFollowerSelection = (followerId: string) => {
    const newSelection = new Set(selectedFollowers);
    if (newSelection.has(followerId)) {
      newSelection.delete(followerId);
    } else {
      newSelection.add(followerId);
    }
    setSelectedFollowers(newSelection);
  };

  const handleShare = async () => {
    if (selectedFollowers.size === 0) {
      Alert.alert("No Selection", "Please select at least one follower to share with");
      return;
    }

    setIsSharing(true);
    try {
      const result = await sharePostToFollowers(
        postId,
        Array.from(selectedFollowers),
        message.trim() || undefined
      );

      const { sharedTo, totalAttempted, failedShares } = result;
      
      let alertMessage = `Post shared to ${sharedTo} of ${totalAttempted} followers`;
      
      if (failedShares.length > 0) {
        alertMessage += `\n\nFailed to share to ${failedShares.length} followers`;
      }

      Alert.alert("Share Complete", alertMessage);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to share post");
    } finally {
      setIsSharing(false);
    }
  };

  const filteredFollowers = followers.filter(follower =>
    follower.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    follower.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    follower.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFollowerItem = ({ item }: { item: Follower }) => {
    const isSelected = selectedFollowers.has(item._id);
    
    return (
      <TouchableOpacity
        onPress={() => toggleFollowerSelection(item._id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: isSelected ? "#F0F9FF" : "white",
        }}
        activeOpacity={0.7}
      >
        {/* Profile Picture */}
        <Image
          source={{ uri: item.profilePicture || "https://via.placeholder.com/40" }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
        
        {/* User Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#000" }}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            @{item.username}
          </Text>
          {item.isRequest && (
            <Text style={{ fontSize: 12, color: "#F59E0B", marginTop: 2 }}>
              Will send as message request
            </Text>
          )}
        </View>
        
        {/* Selection Indicator */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isSelected ? "#3B82F6" : "#D1D5DB",
            backgroundColor: isSelected ? "#3B82F6" : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected && <Feather name="check" size={14} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 16, color: "#6B7280" }}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#000" }}>
            Share Post
          </Text>
          
          <TouchableOpacity
            onPress={handleShare}
            disabled={selectedFollowers.size === 0 || isSharing}
            style={{
              opacity: selectedFollowers.size === 0 || isSharing ? 0.5 : 1,
            }}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={{ fontSize: 16, color: "#3B82F6", fontWeight: "600" }}>
                Share
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Post Preview */}
        {(postContent || postAuthor) && (
          <View
            style={{
              margin: 20,
              padding: 16,
              backgroundColor: "#F9FAFB",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            {postAuthor && (
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 }}>
                @{postAuthor}
              </Text>
            )}
            {postContent && (
              <Text style={{ fontSize: 14, color: "#6B7280" }} numberOfLines={3}>
                {postContent}
              </Text>
            )}
          </View>
        )}

        {/* Message Input */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 8 }}>
            Add a message (optional)
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Say something about this post..."
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              minHeight: 80,
              textAlignVertical: "top",
            }}
            maxLength={280}
          />
          <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "right", marginTop: 4 }}>
            {message.length}/280
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Feather name="search" size={16} color="#6B7280" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search followers..."
              style={{ flex: 1, fontSize: 16 }}
            />
          </View>
        </View>

        {/* Selection Counter */}
        {selectedFollowers.size > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: "#3B82F6", fontWeight: "500" }}>
              {selectedFollowers.size} follower{selectedFollowers.size !== 1 ? "s" : ""} selected
            </Text>
          </View>
        )}

        {/* Followers List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>
              Loading followers...
            </Text>
          </View>
        ) : filteredFollowers.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }}>
            <Feather name="users" size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 16, textAlign: "center" }}>
              {searchQuery ? "No followers found" : "No followers to share with"}
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 8, textAlign: "center" }}>
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "You need followers who can receive messages to share posts"
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFollowers}
            keyExtractor={(item) => item._id}
            renderItem={renderFollowerItem}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default PostShareModal;