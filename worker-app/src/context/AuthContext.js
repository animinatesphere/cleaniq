import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const AuthContext = createContext();

// Switch to live server after VPS is updated: 'https://api.cleaniqservices.com/api'
export const API_URL = "https://api.cleaniqservices.com/api";

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [workerInfo, setWorkerInfo] = useState(null);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/workers/login`, {
        email,
        password,
      });

      const { token, worker } = response.data;

      await AsyncStorage.setItem("workerToken", token);
      await AsyncStorage.setItem("workerInfo", JSON.stringify(worker));

      setUserToken(token);
      setWorkerInfo(worker);
      return { success: true };
    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.error ||
          "Unable to connect to the server. Check your internet.",
      };
    }
  };

  const updateWorkerInfo = async (updatedData) => {
    try {
      const merged = { ...workerInfo, ...updatedData };
      setWorkerInfo(merged);
      await AsyncStorage.setItem("workerInfo", JSON.stringify(merged));
      return { success: true };
    } catch (error) {
      console.error("Error updating worker info:", error);
      return { success: false };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await AsyncStorage.removeItem("workerToken");
    await AsyncStorage.removeItem("workerInfo");
    setUserToken(null);
    setWorkerInfo(null);
    setIsLoading(false);
  };

  const checkLoginState = async () => {
    try {
      const token = await AsyncStorage.getItem("workerToken");
      const info = await AsyncStorage.getItem("workerInfo");

      if (token && info) {
        setUserToken(token);
        setWorkerInfo(JSON.parse(info));
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
        logout,
        updateWorkerInfo,
        isLoading,
        userToken,
        workerInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
