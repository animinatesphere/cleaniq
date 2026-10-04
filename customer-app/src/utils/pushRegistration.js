// This phone's push token on the server: saved after login (and again if Expo issues a new one),
// removed on logout so a logged-out phone stops getting someone's notifications.
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";

const KEY = "@push_token";

export async function savePushToken(pushToken) {
  if (!pushToken) return;
  const auth = await AsyncStorage.getItem("customerToken");
  if (!auth) return;
  try {
    const res = await fetch(`${API_URL}/customer-auth/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
      body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
    });
    if (res.ok) await AsyncStorage.setItem(KEY, pushToken);
  } catch {}
}

// Call BEFORE the login token is cleared (the server needs it to know whose phone this is).
export async function removePushToken() {
  try {
    const [pushToken, auth] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem("customerToken")]);
    if (pushToken && auth) {
      await fetch(`${API_URL}/customer-auth/push-token`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
        body: JSON.stringify({ token: pushToken }),
      });
    }
  } catch {}
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
