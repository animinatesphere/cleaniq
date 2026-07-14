import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { resetToLogin } from "../utils/navigationRef";

export const AuthContext = createContext();

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

      if (!token || !worker) throw new Error("Invalid login response from server");

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
    try {
      await AsyncStorage.multiRemove(["workerToken", "workerInfo"]);
    } catch (e) {
      console.log("Logout storage error:", e);
    } finally {
      setUserToken(null);
      setWorkerInfo(null);
      resetToLogin();
    }
  };

  const checkLoginState = async () => {
    try {
      const token = await AsyncStorage.getItem("workerToken");
      const info  = await AsyncStorage.getItem("workerInfo");

      // AsyncStorage can return the literal string "undefined" when a value was
      // stored as undefined — guard against that before JSON.parse.
      const validToken = token && token !== "undefined" ? token : null;
      const validInfo  = info  && info  !== "undefined" ? info  : null;

      if (validToken && validInfo) {
        setUserToken(validToken);
        setWorkerInfo(JSON.parse(validInfo));
      } else if (!validToken || !validInfo) {
        // Clear any corrupt/partial data so next login starts clean
        await AsyncStorage.multiRemove(["workerToken", "workerInfo"]).catch(() => {});
      }
    } catch (e) {
      console.log("AsyncStorage error:", e);
      await AsyncStorage.multiRemove(["workerToken", "workerInfo"]).catch(() => {});
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
