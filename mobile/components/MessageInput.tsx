import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Message } from "../hooks/useMessages";

interface MessageInputProps {
  onSendMessage: (content: string, options?: {
    replyToId?: string;
    isGhost?: boolean;
    ghostDuration?: number;
  }) => void;
  onSendMedia: (media: any, messageType: string, content?: string) => void;
  isSending: boolean;
  replyTo?: Message | null;
  onClearReply: () => void;
  onTyping: (isTyping: boolean) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendMedia,
  isSending,
  replyTo,
  onClearReply,
  onTyping,
}) => {
  const [message, setMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [ghostDuration, setGhostDuration] = useState(86400); // 24 hours
  const inputRef = useRef<TextInput>(null);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const options: any = {};
    if (replyTo) options.replyToId = replyTo._id;
    if (isGhost) {
      options.isGhost = true;
      options.ghostDuration = ghostDuration;
    }

    onSendMessage(message.trim(), options);
    setMessage("");
    setIsGhost(false);
    onClearReply();
  };

  const handleMessageChange = (text: string) => {
    setMessage(text);
    onTyping(text.length > 0);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to send images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const media = {
        uri: asset.uri,
        type: "image/jpeg",
        name: "image.jpg",
      };
      onSendMedia(media, "image", message.trim() || undefined);
      setMessage("");
    }
    setShowOptions(false);
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to send videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const media = {
        uri: asset.uri,
        type: "video/mp4",
        name: "video.mp4",
      };
      onSendMedia(media, "video", message.trim() || undefined);
      setMessage("");
    }
    setShowOptions(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permissions to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const media = {
        uri: asset.uri,
        type: "image/jpeg",
        name: "photo.jpg",
      };
      onSendMedia(media, "image", message.trim() || undefined);
      setMessage("");
    }
    setShowOptions(false);
  };

  const ghostDurations = [
    { label: "5 seconds", value: 5 },
    { label: "10 seconds", value: 10 },
    { label: "30 seconds", value: 30 },
    { label: "1 minute", value: 60 },
    { label: "5 minutes", value: 300 },
    { label: "1 hour", value: 3600 },
    { label: "24 hours", value: 86400 },
  ];

  return (
    <>
      {/* Reply Preview */}
      {replyTo && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#F7F9FA",
            borderTopWidth: 1,
            borderTopColor: "#E1E8ED",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#657786" }}>
              Replying to {replyTo.sender.firstName}
            </Text>
            <Text style={{ fontSize: 14, color: "black" }} numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onClearReply}>
            <Feather name="x" size={20} color="#657786" />
          </TouchableOpacity>
        </View>
      )}

      {/* Ghost Message Indicator */}
      {isGhost && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#FFF3E0",
            borderTopWidth: 1,
            borderTopColor: "#FFE0B2",
          }}
        >
          <Text style={{ fontSize: 12, color: "#F57C00" }}>
            👻 Ghost message - expires in {ghostDurations.find(d => d.value === ghostDuration)?.label}
          </Text>
          <TouchableOpacity
            onPress={() => setIsGhost(false)}
            style={{ marginLeft: "auto" }}
          >
            <Feather name="x" size={16} color="#F57C00" />
          </TouchableOpacity>
        </View>
      )}

      {/* Message Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: "#E1E8ED",
          backgroundColor: "white",
        }}
      >
        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={{
            padding: 8,
            marginRight: 8,
          }}
        >
          <Feather name="plus" size={24} color="#1DA1F2" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          placeholder="Start a message"
          value={message}
          onChangeText={handleMessageChange}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#E1E8ED",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 16,
            maxHeight: 100,
          }}
          placeholderTextColor="#657786"
          multiline
          maxLength={280}
        />

        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!message.trim() || isSending}
          style={{
            backgroundColor: message.trim() ? "#1DA1F2" : "#E1E8ED",
            borderRadius: 20,
            padding: 10,
            marginLeft: 8,
          }}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Options Modal */}
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
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 20, textAlign: "center" }}>
              Message Options
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Media Options */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12, color: "black" }}>
                  Media
                </Text>
                
                <TouchableOpacity
                  onPress={takePhoto}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Feather name="camera" size={20} color="#1DA1F2" />
                  <Text style={{ marginLeft: 12, fontSize: 16, color: "black" }}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Feather name="image" size={20} color="#1DA1F2" />
                  <Text style={{ marginLeft: 12, fontSize: 16, color: "black" }}>Photo Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickVideo}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Feather name="video" size={20} color="#1DA1F2" />
                  <Text style={{ marginLeft: 12, fontSize: 16, color: "black" }}>Video</Text>
                </TouchableOpacity>
              </View>

              {/* Ghost Message */}
              <View style={{ marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => {
                    setIsGhost(!isGhost);
                    if (!isGhost) {
                      setShowOptions(false);
                      inputRef.current?.focus();
                    }
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 8 }}>👻</Text>
                  <Text style={{ fontSize: 16, color: "black", flex: 1 }}>
                    Ghost Message {isGhost ? "(Enabled)" : ""}
                  </Text>
                  <Feather 
                    name={isGhost ? "check-circle" : "circle"} 
                    size={20} 
                    color={isGhost ? "#1DA1F2" : "#657786"} 
                  />
                </TouchableOpacity>

                {isGhost && (
                  <View style={{ marginLeft: 28, marginTop: 8 }}>
                    <Text style={{ fontSize: 14, color: "#657786", marginBottom: 8 }}>
                      Expires after:
                    </Text>
                    {ghostDurations.map((duration) => (
                      <TouchableOpacity
                        key={duration.value}
                        onPress={() => setGhostDuration(duration.value)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 8,
                        }}
                      >
                        <Feather
                          name={ghostDuration === duration.value ? "check-circle" : "circle"}
                          size={16}
                          color={ghostDuration === duration.value ? "#1DA1F2" : "#657786"}
                        />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontSize: 14,
                            color: ghostDuration === duration.value ? "#1DA1F2" : "black",
                          }}
                        >
                          {duration.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

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

export default MessageInput;