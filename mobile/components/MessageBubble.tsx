import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { Message } from "../hooks/useMessages";

interface MessageBubbleProps {
  message: Message;
  onReaction: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string, deleteFor?: string) => void;
  onReply: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReaction,
  onDelete,
  onReply,
}) => {
  const { userId } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const isFromCurrentUser = message.sender._id === userId;
  const isExpired = message.isGhost && message.expiresAt && new Date() > new Date(message.expiresAt);
  
  if (message.deleted || isExpired) {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isFromCurrentUser ? "flex-end" : "flex-start",
          marginBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: "#F7F9FA",
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#657786", fontStyle: "italic" }}>
            {message.deleted ? "This message was deleted" : "This message has expired"}
          </Text>
        </View>
      </View>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLongPress = () => {
    setShowOptions(true);
  };

  const handleReaction = (emoji: string) => {
    onReaction(message._id, emoji);
    setShowReactions(false);
  };

  const handleDelete = (deleteFor: string) => {
    Alert.alert(
      "Delete Message",
      `Are you sure you want to delete this message ${deleteFor === "everyone" ? "for everyone" : "for you"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDelete(message._id, deleteFor);
            setShowOptions(false);
          },
        },
      ]
    );
  };

  const renderMedia = () => {
    if (!message.media) return null;

    switch (message.media.type) {
      case "image":
        return (
          <Image
            source={{ uri: message.media.url }}
            style={{
              width: 200,
              height: 150,
              borderRadius: 12,
              marginBottom: 8,
            }}
            resizeMode="cover"
          />
        );
      case "video":
        return (
          <View
            style={{
              width: 200,
              height: 150,
              borderRadius: 12,
              backgroundColor: "#000",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Feather name="play" size={40} color="white" />
            <Text style={{ color: "white", fontSize: 12, marginTop: 8 }}>
              Video ({Math.round((message.media.duration || 0) / 60)}:{String(Math.round((message.media.duration || 0) % 60)).padStart(2, '0')})
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderSharedPost = () => {
    if (!message.sharedPost) return null;

    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E1E8ED",
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          backgroundColor: "white",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Image
            source={{ uri: message.sharedPost.user.profilePicture || "https://via.placeholder.com/30" }}
            style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
          />
          <Text style={{ fontWeight: "600", color: "black" }}>
            {message.sharedPost.user.firstName} {message.sharedPost.user.lastName}
          </Text>
          <Text style={{ color: "#657786", marginLeft: 4 }}>
            @{message.sharedPost.user.username}
          </Text>
        </View>
        <Text style={{ color: "black" }}>{message.sharedPost.content}</Text>
        {message.sharedPost.image && (
          <Image
            source={{ uri: message.sharedPost.image }}
            style={{
              width: "100%",
              height: 120,
              borderRadius: 8,
              marginTop: 8,
            }}
            resizeMode="cover"
          />
        )}
      </View>
    );
  };

  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <View
        style={{
          borderLeftWidth: 3,
          borderLeftColor: "#1DA1F2",
          paddingLeft: 8,
          marginBottom: 8,
          backgroundColor: "rgba(29, 161, 242, 0.1)",
          borderRadius: 4,
          padding: 8,
        }}
      >
        <Text style={{ fontSize: 12, color: "#657786" }}>Replying to</Text>
        <Text style={{ fontSize: 14, color: "black" }} numberOfLines={2}>
          {message.replyTo.content}
        </Text>
      </View>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Group reactions by emoji
    const groupedReactions = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof message.reactions>);

    return (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 4,
        }}
      >
        {Object.entries(groupedReactions).map(([emoji, reactions]) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => handleReaction(emoji)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: reactions.some(r => r.user === userId) ? "#E8F5FE" : "#F7F9FA",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginRight: 4,
              marginTop: 4,
              borderWidth: reactions.some(r => r.user === userId) ? 1 : 0,
              borderColor: "#1DA1F2",
            }}
          >
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            <Text
              style={{
                fontSize: 12,
                marginLeft: 4,
                color: reactions.some(r => r.user === userId) ? "#1DA1F2" : "#657786",
              }}
            >
              {reactions.length}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        onLongPress={handleLongPress}
        style={{
          flexDirection: "row",
          justifyContent: isFromCurrentUser ? "flex-end" : "flex-start",
          marginBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: isFromCurrentUser ? "#1DA1F2" : "#F7F9FA",
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          {renderReplyTo()}
          {renderSharedPost()}
          {renderMedia()}
          
          {message.content && (
            <Text
              style={{
                color: isFromCurrentUser ? "white" : "black",
                fontSize: 16,
              }}
            >
              {message.content}
            </Text>
          )}
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <Text
              style={{
                color: isFromCurrentUser ? "rgba(255,255,255,0.7)" : "#657786",
                fontSize: 12,
              }}
            >
              {formatTime(message.createdAt)}
              {message.isGhost && " 👻"}
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowReactions(true)}
              style={{ marginLeft: 8 }}
            >
              <Feather 
                name="smile" 
                size={16} 
                color={isFromCurrentUser ? "rgba(255,255,255,0.7)" : "#657786"} 
              />
            </TouchableOpacity>
          </View>
          
          {renderReactions()}
        </View>
      </TouchableOpacity>

      {/* Reaction Picker Modal */}
      <Modal visible={showReactions} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowReactions(false)}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥"].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReaction(emoji)}
                style={{
                  padding: 12,
                  margin: 4,
                  borderRadius: 12,
                  backgroundColor: "#F7F9FA",
                }}
              >
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Message Options Modal */}
      <Modal visible={showOptions} transparent animationType="slide">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowOptions(false)}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                onReply(message);
                setShowOptions(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
              }}
            >
              <Feather name="corner-up-left" size={20} color="#1DA1F2" />
              <Text style={{ marginLeft: 12, fontSize: 16, color: "black" }}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete("me")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
              }}
            >
              <Feather name="trash-2" size={20} color="#F91880" />
              <Text style={{ marginLeft: 12, fontSize: 16, color: "black" }}>Delete for me</Text>
            </TouchableOpacity>

            {isFromCurrentUser && (
              <TouchableOpacity
                onPress={() => handleDelete("everyone")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                }}
              >
                <Feather name="trash-2" size={20} color="#F91880" />
                <Text style={{ marginLeft: 12, fontSize: 16, color: "black" }}>Delete for everyone</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowOptions(false)}
              style={{
                alignItems: "center",
                paddingVertical: 16,
                marginTop: 8,
                borderTopWidth: 1,
                borderTopColor: "#E1E8ED",
              }}
            >
              <Text style={{ fontSize: 16, color: "#657786" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default MessageBubble;