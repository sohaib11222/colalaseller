// screens/chat/ChatListScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View, StyleSheet, Image, TouchableOpacity, FlatList,
  TextInput, Platform, SafeAreaView, StatusBar, Modal
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { useNavigation } from "@react-navigation/native";


const CHATS = [
  { id: "1", name: "Adewale Faizah", avatar: "https://i.pravatar.cc/100?img=65", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 1 },
  { id: "2", name: "Adam Wande", avatar: "https://i.pravatar.cc/100?img=47", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 1 },
  { id: "3", name: "Raheem Din", avatar: "https://i.pravatar.cc/100?img=36", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "4", name: "Scent Villa Stores", avatar: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "5", name: "Power Stores", avatar: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "6", name: "Creamlia Stores", avatar: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "7", name: "Dannova Stores", avatar: "https://images.unsplash.com/photo-1521579770471-740fe0cf4be0?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
];

export default function ChatListScreen({ navigation }) {
  // const navigation = useNavigation();
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme?.colors?.primary || "#EF534E",
      bg: theme?.colors?.bg || "#F5F6F8",
      text: theme?.colors?.text || "#101318",
      sub: theme?.colors?.sub || "#6C727A",
      line: theme?.colors?.line || "#ECEEF2",
      card: "#fff",
    }),
    [theme]
  );

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Products");
  const [ddOpen, setDdOpen] = useState(false);

  const data = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return CHATS;
    return CHATS.filter(
      c => c.name.toLowerCase().includes(t) || c.lastMessage.toLowerCase().includes(t)
    );
  }, [q]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: C.card }]}
      onPress={() =>
        navigation.navigate("ChatNavigator", {
          screen: 'ChatDetails',
          params: {
            store: { id: item.id, name: item.name, profileImage: item.avatar },
            chat_id: item.id,
          },
        })
      }
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={{ flex: 1, paddingRight: 10 }}>
        <ThemedText style={[styles.name, { color: C.text }]} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={[styles.preview, { color: C.sub }]} numberOfLines={1}>
          {item.lastMessage}
        </ThemedText>
      </View>
      <View style={styles.rightCol}>
        <ThemedText style={{ fontSize: 10, color: "#9BA0A6" }}>{item.time}</ThemedText>
        {item.unread ? (
          <View style={[styles.badge, { backgroundColor: C.primary }]}>
            <ThemedText style={styles.badgeText}>{item.unread}</ThemedText>
          </View>
        ) : <View style={{ height: 18 }} /> }
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      {/* SOLID header (no gradient) */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View style={styles.headerRow}>
          <ThemedText font="oleo" style={styles.headerTitle}>Chats</ThemedText>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="cart-outline" size={18} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="notifications-outline" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search + dropdown */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: "#fff" }]}>
            <TextInput
              placeholder="Search chat"
              placeholderTextColor="#9BA0A6"
              value={q}
              onChangeText={setQ}
              style={[styles.searchInput, { color: C.text }]}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.camBtn}>
              <MaterialCommunityIcons name="camera-outline" size={20} color={C.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.dropBtn, { borderColor: C.line }]}
            onPress={() => setDdOpen(true)}
            activeOpacity={0.9}
          >
            <ThemedText style={{ color: C.text, fontSize: 14 }}>{filter}</ThemedText>
            <Ionicons name="chevron-down" size={16} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* simple dropdown */}
      <Modal visible={ddOpen} transparent animationType="fade" onRequestClose={() => setDdOpen(false)}>
        <TouchableOpacity style={styles.ddOverlay} activeOpacity={1} onPress={() => setDdOpen(false)} />
        <View style={[styles.ddCard, { borderColor: C.line }]}>
          {["Products", "Stores", "People"].map((opt, i) => (
            <TouchableOpacity
              key={opt}
              style={[styles.ddItem, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}
              onPress={() => { setFilter(opt); setDdOpen(false); }}
            >
              <ThemedText style={{ color: C.text }}>{opt}</ThemedText>
              {filter === opt && <Ionicons name="checkmark" size={16} color={C.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "400" },
  headerIcons: { flexDirection: "row", gap: 10 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: { flex: 1, borderRadius: 15, paddingHorizontal: 10, height: 50, flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, fontSize: 14 },
  camBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  dropBtn: { height: 50, minWidth: 120, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  card: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 15, elevation: 0.3 },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
  name: { fontSize: 14, fontWeight: "700" },
  preview: { fontSize: 12, marginTop: 2 },
  rightCol: { alignItems: "flex-end", gap: 6 },
  badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  ddOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.01)" },
  ddCard: { position: "absolute", top: Platform.OS === "ios" ? 120 : 130, right: 16, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, width: 160, elevation: 3 },
  ddItem: { height: 44, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
