import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "./AuthContext";
import notificationService from "../utils/notificationService";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children, workerInfo }) => {
  const [notificationUpdate, setNotificationUpdate] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  const updateUnreadCount = useCallback(async () => {
    if (!workerInfo?.id) return;

    try {
      const response = await axios.get(
        `${API_URL}/notifications/${workerInfo.id}`,
      );
      const unread = response.data?.filter((n) => !n.isRead).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching unread count:", error.message);
    }
  }, [workerInfo?.id]);

  // Listen for notification updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger update every 5 seconds for faster notifications
      setNotificationUpdate((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update unread count when notification update changes
  useEffect(() => {
    updateUnreadCount();
  }, [notificationUpdate, updateUnreadCount]);

  const triggerNotificationUpdate = useCallback(() => {
    setNotificationUpdate((prev) => prev + 1);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        triggerNotificationUpdate,
        notificationUpdate,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
