import React from "react";
import { View, Text } from "react-native";

interface NotificationBadgeProps {
  count: number;
  size?: "small" | "medium" | "large";
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = "medium",
}) => {
  if (count === 0) return null;

  const sizeClasses = {
    small: "w-4 h-4 text-xs",
    medium: "w-5 h-5 text-xs",
    large: "w-6 h-6 text-sm",
  };

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <View
      className={`${sizeClasses[size]} bg-red-500 rounded-full items-center justify-center absolute -top-1 -right-1`}
    >
      <Text className="text-white font-bold text-xs">{displayCount}</Text>
    </View>
  );
};