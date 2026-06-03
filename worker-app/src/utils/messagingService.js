/**
 * Messaging API Service
 * Handles all worker-customer messaging operations
 * - Send messages from worker to customer
 * - Fetch message history
 * - Send email notifications
 * - Create in-app notifications
 */

import axios from "axios";
import { API_URL } from "../context/AuthContext";

const messagingService = {
  /**
   * Send a message from worker to customer
   * - Saves message to database
   * - Sends email notification to customer
   * - Creates in-app notification
   * @param {string} bookingId - Booking ID
   * @param {string} customerId - Customer ID
   * @param {string} workerId - Worker ID
   * @param {string} workerName - Worker name
   * @param {string} messageText - Message content
   * @returns {Promise} Message object with timestamps
   */
  async sendMessage(bookingId, customerId, workerId, workerName, messageText) {
    try {
      const response = await axios.post(
        `${API_URL}/workers/bookings/${bookingId}/messages`,
        {
          senderId: workerId,
          senderType: "worker",
          senderName: workerName,
          message: messageText,
          customerId,
        },
      );

      // The response should include the message and confirm email/notification were sent
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  /**
   * Fetch all messages for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Array of message objects
   */
  async getMessages(bookingId) {
    try {
      const response = await axios.get(
        `${API_URL}/workers/bookings/${bookingId}/messages`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   * @param {string} bookingId - Booking ID
   * @param {string} workerId - Worker ID
   * @returns {Promise} Success response
   */
  async markMessagesAsRead(bookingId, workerId) {
    try {
      const response = await axios.put(
        `${API_URL}/workers/bookings/${bookingId}/messages/read`,
        { workerId },
      );
      return response.data;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  /**
   * Get unread message count for worker
   * @param {string} workerId - Worker ID
   * @returns {Promise} Count of unread messages
   */
  async getUnreadMessageCount(workerId) {
    try {
      const response = await axios.get(
        `${API_URL}/workers/${workerId}/unread-messages-count`,
      );
      return response.data.count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  },

  /**
   * Get all conversations for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise} Array of conversation objects
   */
  async getConversations(workerId) {
    try {
      const response = await axios.get(
        `${API_URL}/workers/${workerId}/conversations`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },
};

export default messagingService;
