import React from "react";
import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";
import { Phone, MessageCircle, Mail, HelpCircle, FileText } from "lucide-react-native";
import { Screen, ScreenHeader, BigTitle, MenuRow, G } from "./common";
import { themed } from "../../theme/dark";

// Contact us / Help centre.
export default function HelpScreen({ navigation }) {
  return (
    <Screen>
      <ScreenHeader title="Help" navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <BigTitle sub="We're here Monday to Saturday. Message us any time.">Contact us</BigTitle>
        <MenuRow icon={MessageCircle} label="WhatsApp Cleaniq" sub="+44 7846 726428" onPress={() => Linking.openURL("https://wa.me/447846726428")} />
        <MenuRow icon={Phone} label="Call Cleaniq" sub="+44 7846 726428" onPress={() => Linking.openURL("tel:+447846726428")} />
        <MenuRow icon={Mail} label="Email" sub="info@cleaniqservices.com" onPress={() => Linking.openURL("mailto:info@cleaniqservices.com")} />
        <Text style={st.h2}>Help centre</Text>
        <MenuRow icon={HelpCircle} label="Questions from cleaners" sub="Pay, jobs, hours and applying" onPress={() => Linking.openURL("https://www.cleaniqservices.com/recruitment#faq")} />
        <MenuRow icon={FileText} label="Terms and conditions" onPress={() => Linking.openURL("https://www.cleaniqservices.com/terms")} last />
      </ScrollView>
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  h2: { fontSize: 20, fontWeight: "900", color: G.text, marginTop: 28 },
}));
