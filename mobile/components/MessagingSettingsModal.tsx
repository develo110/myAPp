import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMessagingSettings } from "../hooks/useMessagingSettings";

interface MessagingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const MessagingSettingsModal: React.FC<MessagingSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { settings, isLoading, updateSettings, isUpdating } = useMessagingSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const updates = { [key]: value };
      await updateSettings(updates);
      setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
    } catch (error) {
      console.error("Error updating setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const handleNestedUpdateSetting = async (parentKey: string, childKey: string, value: any) => {
    try {
      const updates = {
        [parentKey]: {
          ...localSettings?.[parentKey as keyof typeof localSettings],
          [childKey]: value,
        },
      };
      await updateSettings(updates);
      setLocalSettings(prev => prev ? {
        ...prev,
        [parentKey]: {
          ...prev[parentKey as keyof typeof prev],
          [childKey]: value,
        },
      } : null);
    } catch (error) {
      console.error("Error updating nested setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  if (isLoading || !localSettings) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#1DA1F2" />
            <Text style={{ marginTop: 16, color: "#657786" }}>Loading settings...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const whoCanMessageOptions = [
    { value: "everyone", label: "Everyone" },
    { value: "followers", label: "People you follow" },
    { value: "following", label: "People who follow you" },
    { value: "mutual_followers", label: "People you follow each other" },
    { value: "no_one", label: "No one" },
  ];

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "auto", label: "Auto" },
  ];

  const renderSettingRow = (
    title: string,
    subtitle?: string,
    value?: boolean,
    onToggle?: (value: boolean) => void,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !onToggle}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: "black", fontWeight: "500" }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 14, color: "#657786", marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onToggle && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: "#E1E8ED", true: "#1DA1F2" }}
            thumbColor="white"
          />
        )
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string) => (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: "#F7F9FA",
        borderBottomWidth: 1,
        borderBottomColor: "#E1E8ED",
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#657786", textTransform: "uppercase" }}>
        {title}
      </Text>
    </View>
  );

  const showWhoCanMessagePicker = () => {
    Alert.alert(
      "Who can message you",
      "Choose who can send you messages",
      whoCanMessageOptions.map(option => ({
        text: option.label,
        onPress: () => handleUpdateSetting("whoCanMessage", option.value),
        style: localSettings.whoCanMessage === option.value ? "default" : "cancel",
      }))
    );
  };

  const showThemePicker = () => {
    Alert.alert(
      "Theme",
      "Choose your preferred theme",
      themeOptions.map(option => ({
        text: option.label,
        onPress: () => handleUpdateSetting("theme", option.value),
        style: localSettings.theme === option.value ? "default" : "cancel",
      }))
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
          <TouchableOpacity onPress={onClose} style={{ marginRight: 16 }}>
            <Feather name="x" size={24} color="#1DA1F2" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "black", flex: 1 }}>
            Messaging Settings
          </Text>
          {isUpdating && (
            <ActivityIndicator size="small" color="#1DA1F2" />
          )}
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Privacy Settings */}
          {renderSectionHeader("Privacy")}
          
          {renderSettingRow(
            "Who can message you",
            whoCanMessageOptions.find(opt => opt.value === localSettings.whoCanMessage)?.label,
            undefined,
            undefined,
            showWhoCanMessagePicker,
            <Feather name="chevron-right" size={20} color="#657786" />
          )}

          {renderSettingRow(
            "Allow message requests",
            "Let people who can't message you send requests",
            localSettings.allowMessageRequests,
            (value) => handleUpdateSetting("allowMessageRequests", value)
          )}

          {/* Status Settings */}
          {renderSectionHeader("Status")}

          {renderSettingRow(
            "Read receipts",
            "Let people know when you've read their messages",
            localSettings.readReceipts,
            (value) => handleUpdateSetting("readReceipts", value)
          )}

          {renderSettingRow(
            "Show online status",
            "Let people see when you're active",
            localSettings.showOnlineStatus,
            (value) => handleUpdateSetting("showOnlineStatus", value)
          )}

          {renderSettingRow(
            "Show typing indicator",
            "Let people see when you're typing",
            localSettings.showTypingIndicator,
            (value) => handleUpdateSetting("showTypingIndicator", value)
          )}

          {/* Notification Settings */}
          {renderSectionHeader("Notifications")}

          {renderSettingRow(
            "Messages",
            "Get notified about new messages",
            localSettings.notifications.messages,
            (value) => handleNestedUpdateSetting("notifications", "messages", value)
          )}

          {renderSettingRow(
            "Message requests",
            "Get notified about message requests",
            localSettings.notifications.messageRequests,
            (value) => handleNestedUpdateSetting("notifications", "messageRequests", value)
          )}

          {renderSettingRow(
            "Group messages",
            "Get notified about group messages",
            localSettings.notifications.groupMessages,
            (value) => handleNestedUpdateSetting("notifications", "groupMessages", value)
          )}

          {renderSettingRow(
            "Reactions",
            "Get notified when someone reacts to your messages",
            localSettings.notifications.reactions,
            (value) => handleNestedUpdateSetting("notifications", "reactions", value)
          )}

          {/* Auto-delete Settings */}
          {renderSectionHeader("Auto-delete")}

          {renderSettingRow(
            "Auto-delete messages",
            localSettings.autoDeleteMessages.enabled 
              ? `Delete messages after ${localSettings.autoDeleteMessages.duration} days`
              : "Messages are kept forever",
            localSettings.autoDeleteMessages.enabled,
            (value) => handleNestedUpdateSetting("autoDeleteMessages", "enabled", value)
          )}

          {/* Appearance Settings */}
          {renderSectionHeader("Appearance")}

          {renderSettingRow(
            "Theme",
            themeOptions.find(opt => opt.value === localSettings.theme)?.label,
            undefined,
            undefined,
            showThemePicker,
            <Feather name="chevron-right" size={20} color="#657786" />
          )}

          {/* Blocked Users */}
          {renderSectionHeader("Blocked Users")}

          {renderSettingRow(
            "Blocked users",
            `${localSettings.blockedUsers.length} blocked`,
            undefined,
            undefined,
            () => {
              // TODO: Navigate to blocked users screen
              Alert.alert("Coming Soon", "Blocked users management will be available soon");
            },
            <Feather name="chevron-right" size={20} color="#657786" />
          )}

          {/* Bottom spacing */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default MessagingSettingsModal;