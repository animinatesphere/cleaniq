/**
 * Notification Service
 * Polls the backend every 3 seconds for new notifications.
 * On first poll, seeds existing IDs silently (no alert) so we only
 * show local notifications for genuinely new arrivals.
 */

import axios from "axios";
import { API_URL } from "../context/AuthContext";

// Safely import expo-notifications
let Notifications = null;
try {
  const Constants = require("expo-constants").default;
  const isExpoGo = Constants.appOwnership === "expo";
  if (!isExpoGo) {
    Notifications = require("expo-notifications");
  } else {
    console.log("🛡️ notificationService: Skipping expo-notifications in Expo Go");
  }
} catch (err) {
  console.log("notificationService: expo-notifications not available:", err.message);
}

class NotificationService {
  constructor() {
    this.pollInterval   = null;
    this.seenIds        = new Set();   // IDs already shown as local alerts
    this.seeded         = false;       // true after the first poll seeds existing IDs
    this.pollingActive  = false;
    this.Notifications  = Notifications;
  }

  startPolling(workerId, pollIntervalMs = 3000) {
    if (this.pollingActive) return;
    this.pollingActive = true;
    this.seeded = false;
    console.log(`🔔 Notification polling started for worker ${workerId}`);
    this._poll(workerId);
    this.pollInterval = setInterval(() => this._poll(workerId), pollIntervalMs);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.pollingActive = false;
    console.log("🔕 Notification polling stopped");
  }

  reset() {
    this.seenIds.clear();
    this.seeded = false;
  }

  async _poll(workerId) {
    try {
      const response = await axios.get(`${API_URL}/notifications/${workerId}`);
      const notifications = response.data || [];

      if (!this.seeded) {
        // First poll — seed all existing IDs silently so we don't spam on launch
        notifications.forEach(n => this.seenIds.add(n._id));
        this.seeded = true;
        console.log(`🔔 Seeded ${this.seenIds.size} existing notification IDs`);
        return;
      }

      // Subsequent polls — only act on IDs we haven't seen yet
      for (const n of notifications) {
        if (!this.seenIds.has(n._id)) {
          this.seenIds.add(n._id);
          console.log(`🆕 New notification: ${n.title}`);
          await this._showLocal(n);
        }
      }
    } catch (err) {
      // Silently skip network errors — don't spam the console every 3s
    }
  }

  async _showLocal(notification) {
    try {
      if (!this.Notifications) return;

      const isJob = notification.type === "job";
      const channelId = isJob ? "cleaniq-jobs" : "cleaniq-general";

      await this.Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "Cleaniq Services",
          body:  notification.message || "",
          sound: "default",
          badge: 1,
          data: {
            notificationId: notification._id,
            type: notification.type,
            bookingId: notification.bookingId,
          },
          android: {
            channelId,
            sound:   "default",
            priority: isJob ? "max" : "high",
            vibrate: [0, 250, 250, 250],
            color:   "#0A5C43",
          },
        },
        trigger: null, // show immediately
      });

      console.log(`📣 Local notification shown [${channelId}]: ${notification.title}`);
    } catch (err) {
      console.error("Error showing local notification:", err.message);
    }
  }

  clearStoredNotifications() {
    this.reset();
  }
}

export default new NotificationService();
