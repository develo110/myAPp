import { Feather, MaterialIcons } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  RefreshControl,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useUsersAndMessagesSearch } from "../../hooks/useUsersAndMessagesSearch";
import { useConversations } from "../../hooks/useConversations";
import { useMessages, Message } from "../../hooks/useMessages";
import UserWithMessagesCard from "../../components/UserWithMessagesCard";
import MessageBubble from "../../components/MessageBubble";
import MessageInput from "../../components/MessageInput";
import MessagingSettingsModal from "../../components/MessagingSettingsModal";
import GroupChatModal from "../../components/GroupChatModal";
import { useAuth } from "@clerk/clerk-expo";

const { width: screenWidth } = Dimensions.get("window");

const MessagesScreen = () => {
  const { userId } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [conversationType, setConversationType] = useState<"all" | "direct" | "group" | "requests">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewChatOptions, setShowNewChatOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchFocusAnim = useRef(new Animated.Value(0)).current;
  
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    resultCount,
    isLoading: isSearchLoading,
    clearSearch,
    hasSearched,
  } = useUsersAndMessagesSearch();

  const { 
    conversations, 
    isLoading: isConversationsLoading, 
    createConversation,
    refetch: refetchConversations,
  } = useConversations(conversationType);
  
  const { 
    messages, 
    sendMessage, 
    sendMediaMessage,
    addReaction,
    deleteMessage,
    isSending, 
    typingUsers, 
    handleTyping 
  } = useMessages(selectedConversationId);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchConversations();
    setRefreshing(false);
  };

  const handleSearchFocus = () => {
    Animated.timing(searchFocusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      Animated.timing(searchFocusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const selectedConversation = conversations.find(conv => conv._id === selectedConversationId);

  const openChat = async (user: any) => {
    try {
      // Create or get conversation with this user using clerkId
      const response = await createConversation(user.clerkId);
      const conversation = response.data.conversation;
      
      setSelectedConversationId(conversation._id);
      setIsChatOpen(true);
      clearSearch();
    } catch (error) {
      console.error("Error creating conversation:", error);
      Alert.alert("Error", "Failed to start conversation");
    }
  };

  const openExistingChat = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedConversationId(null);
    setReplyTo(null);
  };

  const handleSendMessage = (content: string, options?: any) => {
    sendMessage(content, "text", options);
  };

  const handleSendMedia = (media: any, messageType: string, content?: string) => {
    sendMediaMessage(media, messageType, content);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
  };

  const handleDeleteMessage = (messageId: string, deleteFor?: string) => {
    deleteMessage(messageId, deleteFor);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const clearReply = () => {
    setReplyTo(null);
  };

  const handleGroupCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsChatOpen(true);
  };

  const showNewChatMenu = () => {
    setShowNewChatOptions(true);
  };

  const getOtherParticipant = (conversation: any) => {
    if (conversation.isGroup) {
      return null; // Handle group conversations differently
    }
    return conversation.participants.find((p: any) => p.clerkId !== userId);
  };

  const getConversationTitle = (conversation: any) => {
    if (conversation.isGroup) {
      return conversation.groupName || `Group (${conversation.participants.length})`;
    }
    const otherParticipant = getOtherParticipant(conversation);
    return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : "Unknown";
  };

  const getConversationSubtitle = (conversation: any) => {
    if (conversation.isGroup) {
      return `${conversation.participants.length} members`;
    }
    const otherParticipant = getOtherParticipant(conversation);
    return otherParticipant ? `@${otherParticipant.username}` : "";
  };

  const getConversationImage = (conversation: any) => {
    if (conversation.isGroup) {
      return conversation.groupImage || "https://via.placeholder.com/50";
    }
    const otherParticipant = getOtherParticipant(conversation);
    return otherParticipant?.profilePicture || "https://via.placeholder.com/50";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = ({ item: message }: { item: Message }) => (
    <MessageBubble
      message={message}
      onReaction={handleReaction}
      onDelete={handleDeleteMessage}
      onReply={handleReply}
    />
  );

  // Modern Instagram/Meta-style empty state with profile circles
  const renderEmptyState = () => (
    <Animated.View 
      style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        paddingHorizontal: 40,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {/* Profile circles arrangement like in the reference image */}
      <View style={{ 
        position: "relative", 
        width: 200, 
        height: 120, 
        marginBottom: 40,
        alignItems: "center",
        justifyContent: "center"
      }}>
        {/* Background circles */}
        <View style={{
          position: "absolute",
          top: 0,
          left: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#E5E5E5",
        }} />
        <View style={{
          position: "absolute",
          top: 10,
          right: 30,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: "#D0D0D0",
        }} />
        <View style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          width: 45,
          height: 45,
          borderRadius: 22.5,
          backgroundColor: "#C0C0C0",
        }} />
        <View style={{
          position: "absolute",
          bottom: 0,
          right: 10,
          width: 55,
          height: 55,
          borderRadius: 27.5,
          backgroundColor: "#B5B5B5",
        }} />
        
        {/* Center main circle */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "#A0A0A0",
          zIndex: 1,
        }} />
      </View>

      <Text style={{ 
        fontSize: 24, 
        fontWeight: "700", 
        color: "#000000", 
        marginBottom: 12,
        textAlign: "center"
      }}>
        Keep it real in direct messages
      </Text>
      
      <Text style={{ 
        fontSize: 16, 
        color: "#8E8E93", 
        textAlign: "center", 
        lineHeight: 22,
        marginBottom: 40,
      }}>
        Start a side conversation, send threads and more.
      </Text>

      <TouchableOpacity
        onPress={showNewChatMenu}
        style={{
          backgroundColor: "#000000",
          borderRadius: 25,
          paddingHorizontal: 32,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        activeOpacity={0.8}
      >
        <Text style={{ 
          color: "white", 
          fontSize: 16, 
          fontWeight: "600" 
        }}>
          Message
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Modern filter tabs like Instagram
  const renderFilterTabs = () => (
    <View style={{ 
      flexDirection: "row", 
      paddingHorizontal: 20, 
      paddingVertical: 16,
      alignItems: "center"
    }}>
      {/* Filter button */}
      <TouchableOpacity
        onPress={() => setShowFilterModal(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: "#F2F2F7",
          marginRight: 12,
        }}
        activeOpacity={0.7}
      >
        <Feather name="filter" size={16} color="#000" />
      </TouchableOpacity>

      {/* Inbox and Requests tabs */}
      <View style={{
        flexDirection: "row",
        backgroundColor: "#F2F2F7",
        borderRadius: 20,
        padding: 2,
      }}>
        <TouchableOpacity
          onPress={() => setConversationType("all")}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 18,
            backgroundColor: conversationType === "all" || conversationType === "direct" || conversationType === "group" ? "#FFFFFF" : "transparent",
            shadowColor: conversationType === "all" || conversationType === "direct" || conversationType === "group" ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: conversationType === "all" || conversationType === "direct" || conversationType === "group" ? 1 : 0,
          }}
          activeOpacity={0.7}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: "600",
            color: conversationType === "all" || conversationType === "direct" || conversationType === "group" ? "#000" : "#8E8E93",
          }}>
            Inbox
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setConversationType("requests")}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 18,
            backgroundColor: conversationType === "requests" ? "#FFFFFF" : "transparent",
            shadowColor: conversationType === "requests" ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: conversationType === "requests" ? 1 : 0,
          }}
          activeOpacity={0.7}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: "600",
            color: conversationType === "requests" ? "#000" : "#8E8E93",
          }}>
            Requests
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConversationItem = ({ item: conversation, index }: { item: any; index: number }) => {
    const isMessageRequest = conversation.isMessageRequest && conversation.requestStatus === "pending";
    const hasUnreadMessages = conversation.lastMessage && 
      !conversation.lastMessage.readBy?.some((read: any) => read.user === userId);
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity
          onPress={() => openExistingChat(conversation._id)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: "white",
          }}
          activeOpacity={0.7}
        >
          {/* Profile Image */}
          <View style={{ position: "relative", marginRight: 16 }}>
            <Image
              source={{ uri: getConversationImage(conversation) }}
              style={{ 
                width: 56, 
                height: 56, 
                borderRadius: 28,
              }}
            />
            {conversation.isGroup && (
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  backgroundColor: "#1DA1F2",
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "white",
                }}
              >
                <Feather name="users" size={10} color="white" />
              </View>
            )}
            {!conversation.isGroup && hasUnreadMessages && (
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  backgroundColor: "#007AFF",
                  borderRadius: 8,
                  width: 16,
                  height: 16,
                  borderWidth: 2,
                  borderColor: "white",
                }}
              />
            )}
          </View>

          {/* Conversation Info */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text 
                style={{ 
                  fontSize: 16, 
                  fontWeight: hasUnreadMessages ? "600" : "400", 
                  color: "#000000",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {getConversationTitle(conversation)}
              </Text>
              
              {conversation.lastMessage && (
                <Text style={{ fontSize: 14, color: "#8E8E93", marginLeft: 8 }}>
                  {formatTime(conversation.lastMessage.createdAt)}
                </Text>
              )}
            </View>

            <Text 
              style={{ 
                fontSize: 15, 
                color: hasUnreadMessages ? "#000000" : "#8E8E93",
                fontWeight: hasUnreadMessages ? "500" : "400",
              }}
              numberOfLines={1}
            >
              {conversation.lastMessage?.content || getConversationSubtitle(conversation)}
            </Text>
          </View>

          {/* Unread Indicator */}
          {hasUnreadMessages && (
            <View
              style={{
                backgroundColor: "#007AFF",
                borderRadius: 10,
                width: 8,
                height: 8,
                marginLeft: 12,
              }}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#000000" }}>
            Messages
          </Text>
          <TouchableOpacity 
            onPress={showNewChatMenu}
            activeOpacity={0.7}
          >
            <Feather name="edit" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Animated.View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            borderRadius: 16,
            backgroundColor: "#F2F2F7",
          }}
        >
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
            <Feather name="search" size={18} color="#8E8E93" style={{ marginRight: 12 }} />
            <TextInput
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              style={{ 
                flex: 1, 
                fontSize: 16, 
                color: "#000000",
              }}
              placeholderTextColor="#8E8E93"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={{ padding: 4 }}>
                <Feather name="x-circle" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* Content */}
        {isSearchLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : hasSearched ? (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <UserWithMessagesCard user={item} onStartConversation={openChat} />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </Animated.View>
        ) : (
          <View style={{ flex: 1 }}>
            {isConversationsLoading ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : conversations.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(item) => item._id}
                renderItem={renderConversationItem}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#007AFF"]}
                    tintColor="#007AFF"
                  />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        )}

        {/* Filter Modal */}
        <Modal visible={showFilterModal} transparent animationType="slide">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => setShowFilterModal(false)}
          >
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 20, textAlign: "center" }}>
                Filter
              </Text>

              {[
                { key: "all", label: "All", icon: "message-circle" },
                { key: "unread", label: "Unread", icon: "circle" },
                { key: "unanswered", label: "Unanswered", icon: "clock" },
                { key: "verified", label: "Verified", icon: "check-circle" },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => {
                    // Handle filter selection
                    setShowFilterModal(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                >
                  <Feather name={filter.icon as any} size={20} color="#000" />
                  <Text style={{ marginLeft: 12, fontSize: 16, color: "#000" }}>
                    {filter.label}
                  </Text>
                  <View style={{ marginLeft: "auto" }}>
                    <Feather name="chevron-down" size={16} color="#8E8E93" />
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={{
                  alignItems: "center",
                  paddingVertical: 16,
                  marginTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#F2F2F7",
                }}
              >
                <Text style={{ fontSize: 16, color: "#8E8E93" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Chat Modal */}
        <Modal visible={isChatOpen} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
            {/* Chat Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: "#E5E5E5",
              }}
            >
              <TouchableOpacity onPress={closeChat} style={{ marginRight: 16 }}>
                <Feather name="arrow-left" size={24} color="#000" />
              </TouchableOpacity>
              
              {selectedConversation && (
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Image
                    source={{ uri: getConversationImage(selectedConversation) }}
                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#000" }}>
                      {getConversationTitle(selectedConversation)}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#8E8E93" }}>
                      {getConversationSubtitle(selectedConversation)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity style={{ marginLeft: 8 }}>
                    <Feather name="more-horizontal" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <KeyboardAvoidingView 
              style={{ flex: 1 }} 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              {/* Messages */}
              <FlatList
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingVertical: 16 }}
                showsVerticalScrollIndicator={false}
                inverted={false}
              />

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, color: "#8E8E93", fontStyle: "italic" }}>
                    Someone is typing...
                  </Text>
                </View>
              )}

              {/* Message Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onSendMedia={handleSendMedia}
                isSending={isSending}
                replyTo={replyTo}
                onClearReply={clearReply}
                onTyping={handleTyping}
              />
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* New Chat Options Modal */}
        <Modal visible={showNewChatOptions} transparent animationType="slide">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => setShowNewChatOptions(false)}
          >
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 20, textAlign: "center" }}>
                Start a new chat
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setShowNewChatOptions(false);
                  // Focus search input
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                }}
              >
                <Feather name="user" size={20} color="#007AFF" />
                <Text style={{ marginLeft: 12, fontSize: 16, color: "#000" }}>Direct Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowNewChatOptions(false);
                  setShowGroupModal(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                }}
              >
                <Feather name="users" size={20} color="#007AFF" />
                <Text style={{ marginLeft: 12, fontSize: 16, color: "#000" }}>Group Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowNewChatOptions(false)}
                style={{
                  alignItems: "center",
                  paddingVertical: 16,
                  marginTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#F2F2F7",
                }}
              >
                <Text style={{ fontSize: 16, color: "#8E8E93" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Messaging Settings Modal */}
        <MessagingSettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Group Chat Modal */}
        <GroupChatModal
          visible={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      </SafeAreaView>
    </>
  );
};

export default MessagesScreen;