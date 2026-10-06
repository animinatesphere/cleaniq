import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const API_URL = "https://api.cleaniqservices.com/api";

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return { data };
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);

  const register = async (firstName, lastName, email, phone, password) => {
    try {
      const response = await apiFetch(`${API_URL}/customer-auth/register`, {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });
      const { token, customer } = response.data;
      await AsyncStorage.setItem("customerToken", token);
      await AsyncStorage.setItem("customerInfo", JSON.stringify(customer));
      setUserToken(token);
      setCustomerInfo(customer);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Unable to connect to the server. Check your internet.",
      };
    }
  };

  const sendOtp = async (firstName, lastName, email, phone, password, referralCode = "") => {
    try {
      await apiFetch(`${API_URL}/customer-auth/send-otp`, {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, phone, password, referralCode }),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to send verification code. Check your internet.",
      };
    }
  };

  const verifyOtp = async (email, code) => {
    try {
      const response = await apiFetch(`${API_URL}/customer-auth/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      const { token, customer } = response.data;
      await AsyncStorage.setItem("customerToken", token);
      await AsyncStorage.setItem("customerInfo", JSON.stringify(customer));
      setUserToken(token);
      setCustomerInfo(customer);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Incorrect code or it has expired. Please try again.",
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiFetch(`${API_URL}/customer-auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const { token, customer } = response.data;
      await AsyncStorage.setItem("customerToken", token);
      await AsyncStorage.setItem("customerInfo", JSON.stringify(customer));
      setUserToken(token);
      setCustomerInfo(customer);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Unable to connect to the server. Check your internet.",
      };
    }
  };

  const updateProfile = async (fields) => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await apiFetch(`${API_URL}/customer-auth/profile`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(fields),
      });
      const updated = res.data.customer;
      await AsyncStorage.setItem("customerInfo", JSON.stringify(updated));
      setCustomerInfo(updated);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Unable to update profile.",
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await apiFetch(`${API_URL}/customer-auth/forgot-password`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to send reset code." };
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      await apiFetch(`${API_URL}/customer-auth/reset-password`, {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to reset password." };
    }
  };

  const logout = async () => {
    // Stop notifications to this phone in the background (it reads the login token now, before
    // it's removed) — logging out never waits on the internet, so it can't get stuck loading.
    const authToken = await AsyncStorage.getItem("customerToken").catch(() => null);
    require("../utils/pushRegistration").removePushToken(authToken).catch(() => {});
    try {
      await AsyncStorage.multiRemove(["customerToken", "customerInfo"]);
    } catch {}
    setUserToken(null);
    setCustomerInfo(null);
  };

  const checkLoginState = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const info = await AsyncStorage.getItem("customerInfo");
      if (token && info) {
        setUserToken(token);
        setCustomerInfo(JSON.parse(info));
      }
    } catch (e) {
      // ignore storage errors on startup
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLoginState();
  }, []);

  return (
    <AuthContext.Provider
      value={{ login, register, sendOtp, verifyOtp, forgotPassword, resetPassword, logout, updateProfile, isLoading, userToken, customerInfo }}
    >
      {children}
    </AuthContext.Provider>
  );
};
