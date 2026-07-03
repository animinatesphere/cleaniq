import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const AuthContext = createContext();

export const API_URL = "https://api.cleaniqservices.com/api";

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);

  const register = async (firstName, lastName, email, phone, password) => {
    try {
      const response = await axios.post(`${API_URL}/customer-auth/register`, {
        firstName,
        lastName,
        email,
        phone,
        password,
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

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/customer-auth/login`, {
        email,
        password,
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
      const res = await axios.patch(`${API_URL}/customer-auth/profile`, fields, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  const logout = async () => {
    setIsLoading(true);
    await AsyncStorage.removeItem("customerToken");
    await AsyncStorage.removeItem("customerInfo");
    setUserToken(null);
    setCustomerInfo(null);
    setIsLoading(false);
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
      console.log("AsyncStorage error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLoginState();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        updateProfile,
        isLoading,
        userToken,
        customerInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
