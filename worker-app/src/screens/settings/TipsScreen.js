import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Linking } from "react-native";
import axios from "axios";
import { API_URL } from "../../context/AuthContext";
import { Screen, ScreenHeader, Loading, G } from "./common";
import { themed, ts } from "../../theme/dark";

// Tips and advice: Cleaniq's cleaning guides (the website blog), opened on the website.
const ORIGIN = API_URL.replace(/\/api\/?$/, "");
const SITE = "https://www.cleaniqservices.com";
const imageUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${ORIGIN}/${String(p).replace(/^\/+/, "")}`);
const slug = (post) => `${post._id}-${String(post.title || "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "")}`;

export default function TipsScreen({ navigation }) {
  const [posts, setPosts] = useState(null);
  useEffect(() => {
    axios.get(`${API_URL}/blog`, { params: { limit: 20, page: 1 } })
      .then((r) => setPosts(r.data?.posts || []))
      .catch(() => setPosts([]));
  }, []);
  return (
    <Screen>
      <ScreenHeader title="Tips and advice" navigation={navigation} />
      {posts === null ? <Loading /> : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p._id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={st.empty}>No tips yet.</Text>}
          renderItem={({ item: p, index }) => (
            <TouchableOpacity style={st.card} onPress={() => Linking.openURL(`${SITE}/blog/${slug(p)}`)} activeOpacity={0.85}>
              {imageUrl(p.image) ? <Image source={{ uri: imageUrl(p.image) }} style={st.img} /> : <View style={[st.img, ts({ backgroundColor: G.greenPale })]} />}
              <View style={st.tags}>
                {index < 2 && <Text style={st.tag}>New</Text>}
                <Text style={st.tag}>Cleaning tips</Text>
              </View>
              <Text style={st.title} numberOfLines={2}>{p.title}</Text>
              {!!p.description && <Text style={st.desc} numberOfLines={2}>{p.description}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  card: { marginBottom: 26 },
  img: { width: "100%", height: 180, borderRadius: 18 },
  tags: { flexDirection: "row", gap: 6, marginTop: 10 },
  tag: { backgroundColor: G.soft, fontSize: 12, fontWeight: "800", color: G.text, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  title: { fontSize: 18, fontWeight: "900", color: G.text, marginTop: 8 },
  desc: { fontSize: 14, color: G.sub, marginTop: 4, lineHeight: 20 },
  empty: { textAlign: "center", color: G.mute, marginTop: 40 },
}));
