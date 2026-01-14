import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useConversations } from "../hooks/useConversations";
import { useUsersAndMessagesSearch } from "../hooks/useUsersAndMessagesSearch";

interface GroupChatModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({
  visible,
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { createGroupConversation, isCreatingGroupConversation } = useConversations();
  const { 
    searchResults, 
    isLoading: isSearchLoading,
    setSearchQuery: setUserSearchQuery,
  } = useUsersAndMessagesSearch();

  React.useEffect(() => {
    setUserSearchQuery(searchQuery);
  }, [searchQuery, setUserSearchQuery]);

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Please select at least one person to add to the group");
      return;
    }

    if (selectedUsers.length > 49) {
      Alert.alert("Error", "Groups can have a maximum of 50 members");
      return;
    }

    try {
      const participantIds = selectedUsers.map(user => user.clerkId);
      const response = await createGroupConversation({
        participantIds,
        groupName: groupName.trim() || undefined,
        groupDescription: groupDescription.trim() || undefined,
      });

      const conversation = response.data.conversation;
      onGroupCreated(conversation._id);
      handleClose();
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group chat");
    }
  };

  const handleClose = () => {
    setGroupName("");
    setGroupDescription("");
    setSelectedUsers([]);
    setSearchQuery("");
    onClose();
  };

  const toggleUserSelection = (user: any) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        if (prev.length >= 49) {
          Alert.alert("Limit Reached", "Groups can have a maximum of 50 members");
          return prev;
        }
        return [...prev, user];
      }
    });
  };

  const renderSelectedUser = ({ item: user }: { item: any }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F5FE",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Image
        source={{ uri: user.profilePicture || "https://via.placeholder.com/24" }}
        style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
      />
      <Text style={{ fontSize: 14, color: "#1DA1F2", fontWeight: "500" }}>
        {user.firstName} {user.lastName}
      </Text>
      <TouchableOpacity
        onPress={() => toggleUserSelection(user)}
        style={{ marginLeft: 8 }}
      >
        <Feather name="x" size={16} color="#1DA1F2" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item: user }: { item: any }) => {
    const isSelected = selectedUsers.some(u => u._id === user._id);
    
    return (
      <TouchableOpacity
        onPress={() => toggleUserSelection(user)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F0F0F0",
          backgroundColor: isSelected ? "#F0F8FF" : "white",
        }}
      >
        <Image
          source={{ uri: user.profilePicture || "https://via.placeholder.com/40" }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "500", color: "black" }}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: "#657786" }}>
            @{user.username}
          </Text>
        </View>
        <Feather
          name={isSelected ? "check-circle" : "circle"}
          size={20}
          color={isSelected ? "#1DA1F2" : "#657786"}
        />
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
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E1E8ED",
          }}
        >
          <TouchableOpacity onPress={handleClose} style={{ marginRight: 16 }}>
            <Feather name="x" size={24} color="#1DA1F2" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "black", flex: 1 }}>
            New Group
          </Text>
          <TouchableOpacity
            onPress={handleCreateGroup}
            disabled={selectedUsers.length === 0 || isCreatingGroupConversation}
            style={{
              backgroundColor: selectedUsers.length > 0 ? "#1DA1F2" : "#E1E8ED",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            {isCreatingGroupConversation ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                style={{
                  color: selectedUsers.length > 0 ? "white" : "#657786",
                  fontWeight: "600",
                }}
              >
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
          <TextInput
            placeholder="Group name (optional)"
            value={groupName}
            onChangeText={setGroupName}
            style={{
              fontSize: 16,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: "#E1E8ED",
              borderRadius: 8,
              marginBottom: 12,
            }}
            maxLength={50}
          />
          <TextInput
            placeholder="Group description (optional)"
            value={groupDescription}
            onChangeText={setGroupDescription}
            style={{
              fontSize: 16,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: "#E1E8ED",
              borderRadius: 8,
              minHeight: 80,
            }}
            multiline
            maxLength={500}
          />
        </View>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#657786", marginBottom: 8 }}>
              SELECTED ({selectedUsers.length}/50)
            </Text>
            <FlatList
              data={selectedUsers}
              keyExtractor={(item) => item._id}
              renderItem={renderSelectedUser}
              horizontal={false}
              numColumns={2}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            margin: 16,
            backgroundColor: "#F7F9FA",
            borderRadius: 25,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Feather name="search" size={20} color="#657786" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search for people to add"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, fontSize: 16, color: "black" }}
            placeholderTextColor="#657786"
          />
        </View>

        {/* Search Results */}
        <View style={{ flex: 1 }}>
          {isSearchLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#1DA1F2" />
            </View>
          ) : searchQuery.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
              <Feather name="users" size={64} color="#657786" />
              <Text style={{ fontSize: 18, fontWeight: "600", color: "black", marginTop: 16 }}>
                Add people to your group
              </Text>
              <Text style={{ fontSize: 14, color: "#657786", textAlign: "center", marginTop: 8 }}>
                Search for people to add to your group chat
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
              <Feather name="search" size={64} color="#657786" />
              <Text style={{ fontSize: 18, fontWeight: "600", color: "black", marginTop: 16 }}>
                No results found
              </Text>
              <Text style={{ fontSize: 14, color: "#657786", textAlign: "center", marginTop: 8 }}>
                Try searching for a different name or username
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={renderSearchResult}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default GroupChatModal;