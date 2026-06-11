/**
 * Notification Service
 * Handles real-time notification fetching with sound alerts
 * - Polls backend for new notifications periodically
 * - Plays sound when notification arrives (like messenger)
 * - Schedules local notifications with sound
 * - Tracks last notification to avoid duplicates
 */

import axios from "axios";
import { API_URL } from "../context/AuthContext";

// Safely import expo-notifications — skip in Expo Go SDK 53+
let Notifications = null;
try {
  const Constants = require("expo-constants").default;
  const isExpoGo = Constants.appOwnership === "expo";

  if (!isExpoGo) {
    Notifications = require("expo-notifications");
  } else {
    console.log(
      "🛡️ notificationService: Skipping expo-notifications in Expo Go (SDK 53+)",
    );
  }
} catch (err) {
  console.log(
    "notificationService: expo-notifications not available:",
    err.message,
  );
}

class NotificationService {
  constructor() {
    this.pollInterval = null;
    this.lastNotificationIds = new Set();
    this.pollingActive = false;
    this.Notifications = Notifications;
  }

  /**
   * Start notification polling service
   * @param {string} workerId - Worker ID to fetch notifications for
   * @param {number} pollIntervalMs - Polling interval in milliseconds (default: 10 seconds)
   */
  startPolling(workerId, pollIntervalMs = 10000) {
    if (this.pollingActive) {
      console.log("Polling already active");
      return;
    }

    this.pollingActive = true;
    console.log(
      `Starting notification polling for worker: ${workerId} (interval: ${pollIntervalMs}ms)`,
    );

    // Initial check
    this.fetchAndHandleNotifications(workerId);

    // Set up recurring polling
    this.pollInterval = setInterval(() => {
      this.fetchAndHandleNotifications(workerId);
    }, pollIntervalMs);
  }

  /**
   * Stop notification polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      this.pollingActive = false;
      console.log("Notification polling stopped");
    }
  }

  /**
   * Fetch notifications from backend and handle new ones
   * @param {string} workerId - Worker ID
   */
  async fetchAndHandleNotifications(workerId) {
    try {
      const response = await axios.get(`${API_URL}/notifications/${workerId}`);
      const notifications = response.data || [];

      // Check for new notifications
      for (const notification of notifications) {
        if (!this.lastNotificationIds.has(notification._id)) {
          this.lastNotificationIds.add(notification._id);
          console.log("New notification received:", notification.title);

          // Show local notification with sound
          await this.showNotificationWithSound(notification);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
    }
  }

  /**
   * Show local notification with sound (like messenger)
   * @param {Object} notification - Notification object from backend
   */
  async showNotificationWithSound(notification) {
    try {
      if (!this.Notifications) {
        console.log("Notifications not available in this client");
        return;
      }

      // Schedule local notification
      await this.Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "New Notification",
          body: notification.message || "",
          data: {
            notificationId: notification._id,
            type: notification.type,
          },
          // iOS specific
          sound: true,
          badge: 1,
          // Android specific
          android: {
            sound: true,
            priority: "high",
            vibrate: [0, 250, 250, 250],
          },
        },
        trigger: null, // Show immediately
      });

      console.log("Local notification scheduled");
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  /**
   * Manually trigger a test notification (for debugging)
   */
  async testNotification() {
    try {
      const testNotif = {
        _id: `test-${Date.now()}`,
        title: "Test Notification",
        message: "This is a test notification with sound",
        type: "info",
      };

      await this.showNotificationWithSound(testNotif);
      console.log("Test notification sent");
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }

  /**
   * Get count of notifications stored locally
   */
  getStoredNotificationCount() {
    return this.lastNotificationIds.size;
  }

  /**
   * Clear stored notification IDs (useful when logging out)
   */
  clearStoredNotifications() {
    this.lastNotificationIds.clear();
    console.log("Cleared stored notification IDs");
  }
}

// Export singleton instance
export default new NotificationService();
