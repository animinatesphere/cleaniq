/**
 * Custom hook for accessing notification functionality
 * Usage: const { unreadCount, refreshNotifications } = useNotifications();
 */

import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }

  return {
    unreadCount: context.unreadCount,
    triggerRefresh: context.triggerNotificationUpdate,
    notificationUpdate: context.notificationUpdate,
  };
};
