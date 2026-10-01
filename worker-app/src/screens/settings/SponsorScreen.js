import React, { useContext } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from "react-native";
import { Users } from "lucide-react-native";
import { AuthContext } from "../../context/AuthContext";
import { Screen, ScreenHeader, BigTitle, G } from "./common";
import { tc, themed } from "../../theme/dark";

// Sponsor a cleaner: share Cleaniq's Join the Team page with a friend.
export default function SponsorScreen({ navigation }) {
  const { workerInfo } = useContext(AuthContext);
  const link = `https://www.cleaniqservices.com/recruitment?ref=${encodeURIComponent(workerInfo?.workerId || "")}`;
  const share = () => Share.share({
    message: `I clean with Cleaniq in Manchester — flexible hours and jobs near you. Apply here: ${link}`,
  }).catch(() => {});
  return (
    <Screen>
      <ScreenHeader title="Sponsor a cleaner" navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={st.icon}><Users size={34} color={tc(G.green)} /></View>
        <BigTitle sub="Know someone who'd be a great cleaner? Send them your link. They choose their own hours and jobs near them.">
          Invite a friend to clean with Cleaniq
        </BigTitle>
        <View style={st.linkBox}><Text style={st.link} numberOfLines={2}>{link}</Text></View>
        <TouchableOpacity style={st.btn} onPress={share}><Text style={st.btnTxt}>Share my link</Text></TouchableOpacity>
        <Text style={st.small}>Tell the Cleaniq team who you invited so we can thank you.</Text>
      </ScrollView>
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  icon: { width: 70, height: 70, borderRadius: 35, backgroundColor: G.greenPale, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  linkBox: { backgroundColor: G.soft, borderRadius: 14, padding: 14, marginBottom: 14 },
  link: { fontSize: 14, color: G.text, fontWeight: "600" },
  btn: { backgroundColor: G.green, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "900" },
  small: { fontSize: 13, color: G.sub, marginTop: 12, textAlign: "center" },
}));
