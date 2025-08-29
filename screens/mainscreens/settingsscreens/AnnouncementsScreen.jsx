// screens/my/AnnouncementsScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

/* helpers */
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => {
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const yy = String(d.getFullYear()).slice(-2);
  let hr = d.getHours();
  const min = pad(d.getMinutes());
  const am = hr < 12 ? "AM" : "PM";
  hr = hr % 12 || 12;
  return `${mm}-${dd}-${yy}/${pad(hr)}:${min}${am}`;
};

/* ───────────────────────── Main Screen ───────────────────────── */
export default function AnnouncementsScreen({ navigation }) {
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#EF4444",
      bg: theme.colors?.background || "#F6F7FB",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#111827",
      sub: theme.colors?.muted || "#6B7280",
      line: theme.colors?.line || "#E5E7EB",
    }),
    [theme]
  );

  const [tab, setTab] = useState("push"); // 'push' | 'banners'

  /* Push announcements */
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [announcements, setAnnouncements] = useState([
    {
      id: "a1",
      text: "Get 10% discount when you use the code NEW123",
      createdAt: new Date(),
      impressions: 25,
    },
  ]);

  const onSaveAnnouncement = (payload) => {
    if (editing) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, text: payload.text } : a))
      );
    } else {
      setAnnouncements((prev) => [
        { id: String(Date.now()), text: payload.text, createdAt: new Date(), impressions: 0 },
        ...prev,
      ]);
    }
  };

  /* Banners */
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [banners, setBanners] = useState([
    {
      id: "b1",
      image:
        "https://images.unsplash.com/photo-1585386959984-a41552231605?q=80&w=1200&auto=format&fit=crop",
      link: "https://www.colola.com/sashastores",
      createdAt: new Date(),
      impressions: 25,
    },
    {
      id: "b2",
      image:
        "https://images.unsplash.com/photo-1603575449299-0e7551f1cb3d?q=80&w=1200&auto=format&fit=crop",
      link: "https://www.colola.com/sashastores",
      createdAt: new Date(),
      impressions: 25,
    },
  ]);

  const onSaveBanner = (payload) => {
    if (editingBanner) {
      setBanners((prev) =>
        prev.map((b) =>
          b.id === editingBanner.id ? { ...b, image: payload.image, link: payload.link } : b
        )
      );
    } else {
      setBanners((prev) => [
        {
          id: String(Date.now()),
          image: payload.image,
          link: payload.link,
          createdAt: new Date(),
          impressions: 0,
        },
        ...prev,
      ]);
    }
  };

  const openCreateAnnouncement = (record = null) => {
    setEditing(record);
    setCreateOpen(true);
  };
  const openCreateBanner = (record = null) => {
    setEditingBanner(record);
    setBannerOpen(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} style={[styles.hIcon, { borderColor: C.line }]}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>Coupons/Points</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => setTab("push")}
          style={[
            styles.tab,
            {
              backgroundColor: tab === "push" ? C.primary : C.card,
              borderColor: tab === "push" ? C.primary : C.line,
            },
          ]}
        >
          <ThemedText style={{ color: tab === "push" ? "#fff" : C.text, fontWeight: "800" }}>
            Push Announcements
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("banners")}
          style={[
            styles.tab,
            {
              backgroundColor: tab === "banners" ? C.primary : C.card,
              borderColor: tab === "banners" ? C.primary : C.line,
            },
          ]}
        >
          <ThemedText style={{ color: tab === "banners" ? "#fff" : C.text, fontWeight: "800" }}>
            Banners
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {tab === "push" ? (
          announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              C={C}
              data={a}
              onEdit={() => openCreateAnnouncement(a)}
              onDelete={() => setAnnouncements((prev) => prev.filter((x) => x.id !== a.id))}
            />
          ))
        ) : (
          banners.map((b) => (
            <BannerCard
              key={b.id}
              C={C}
              data={b}
              onEdit={() => openCreateBanner(b)}
              onDelete={() => setBanners((prev) => prev.filter((x) => x.id !== b.id))}
            />
          ))
        )}
      </ScrollView>

      {/* Footer action */}
      <View style={[styles.footer, { backgroundColor: C.bg }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: C.primary }]}
          onPress={() => (tab === "push" ? openCreateAnnouncement(null) : openCreateBanner(null))}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Create New</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CreateAnnouncementModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(payload) => {
          onSaveAnnouncement(payload);
          setCreateOpen(false);
        }}
        initialText={editing?.text || ""}
        editing={!!editing}
        C={C}
      />

      <CreateBannerModal
        visible={bannerOpen}
        onClose={() => setBannerOpen(false)}
        onSave={(payload) => {
          onSaveBanner(payload);
          setBannerOpen(false);
        }}
        initialData={editingBanner}
        C={C}
      />
    </SafeAreaView>
  );
}

/* ───────────── Push Announcement Card & Modal ───────────── */
function AnnouncementCard({ C, data, onEdit, onDelete }) {
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" }]}>
      <View style={[styles.msgBox, { borderColor: C.line, backgroundColor: "#fff" }]}>
        <ThemedText style={{ color: C.text }}>{data.text}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Date Created</ThemedText>
        <ThemedText style={styles.kvValue}>{fmt(data.createdAt)}</ThemedText>
      </View>
      <View style={[styles.row, { marginBottom: 8 }]}>
        <ThemedText style={styles.kvLabel}>Impressions</ThemedText>
        <ThemedText style={styles.kvValue}>{data.impressions}</ThemedText>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <SmallIconBtn C={C} icon="create-outline" onPress={onEdit} />
        <SmallIconBtn C={C} icon="trash-outline" danger onPress={onDelete} />
      </View>
    </View>
  );
}

function CreateAnnouncementModal({ visible, onClose, onSave, initialText, editing, C }) {
  const [text, setText] = useState(initialText || "");
  const MAX = 200;
  useEffect(() => setText(initialText || ""), [initialText, visible]);

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>
            {editing ? "Edit Announcement" : "New Announcement"}
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.textAreaWrap, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}>
            <TextInput
              placeholder="Type Announcement"
              placeholderTextColor="#9AA0A6"
              style={styles.textArea}
              multiline
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX))}
              maxLength={MAX}
            />
            <ThemedText style={styles.counterText}>{`${text.length}/${MAX}`}</ThemedText>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: C.primary }]}
            onPress={() => onSave({ text })}
            disabled={!text.trim()}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────── Banner Card & Modal ───────────── */
function BannerCard({ C, data, onEdit, onDelete }) {
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" }]}>
      <View style={styles.bannerWrap}>
        <Image source={{ uri: data.image }} style={styles.bannerImage} />
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Date Created</ThemedText>
        <ThemedText style={styles.kvValue}>{fmt(data.createdAt)}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Impressions</ThemedText>
        <ThemedText style={styles.kvValue}>{data.impressions}</ThemedText>
      </View>
      <View style={[styles.row, { marginBottom: 8 }]}>
        <ThemedText style={styles.kvLabel}>Link</ThemedText>
        <TouchableOpacity onPress={() => Linking.openURL(data.link)} activeOpacity={0.8}>
          <ThemedText style={{ color: "#E53935" }} numberOfLines={1}>
            {data.link}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <SmallIconBtn C={C} icon="create-outline" onPress={onEdit} />
        <SmallIconBtn C={C} icon="trash-outline" danger onPress={onDelete} />
      </View>
    </View>
  );
}

function CreateBannerModal({ visible, onClose, onSave, initialData, C }) {
  const [imageUri, setImageUri] = useState(initialData?.image || "");
  const [link, setLink] = useState(initialData?.link || "");

  useEffect(() => {
    setImageUri(initialData?.image || "");
    setLink(initialData?.link || "");
  }, [initialData, visible]);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const pickBanner = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setImageUri(res.assets[0].uri);
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
        <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>New Banner</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={pickBanner}
            style={[styles.bannerPicker, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%", borderRadius: 14 }} />
            ) : (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="cloud-upload-outline" size={28} color="#9AA0A6" />
                <ThemedText style={{ color: "#9AA0A6", marginTop: 8 }}>Upload new Banner</ThemedText>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.inputWrap, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}>
            <TextInput
              placeholder="Banner Link"
              placeholderTextColor="#9AA0A6"
              value={link}
              onChangeText={setLink}
              style={{ flex: 1, color: "#111", fontSize: 15, paddingVertical: Platform.OS === "ios" ? 14 : 10 }}
              autoCapitalize="none"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: C.primary }]}
            onPress={() => onSave({ image: imageUri, link })}
            disabled={!imageUri || !link.trim()}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────── Shared bits ───────────── */
function SmallIconBtn({ C, icon, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.smallBtn,
        { borderColor: danger ? "#FEE2E2" : C.line, backgroundColor: danger ? "#FFF1F2" : "#fff" },
      ]}
    >
      <Ionicons name={icon} size={16} color={danger ? "#DC2626" : C.text} />
    </TouchableOpacity>
  );
}

/* ───────────── Styles ───────────── */
const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },

  /* Cards */
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  msgBox: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  kvLabel: { color: "#6B7280", fontSize: 12 },
  kvValue: { color: "#111", fontWeight: "700", fontSize: 12 },

  smallBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  bannerWrap: {
    borderRadius: 12,
    overflow: "hidden",
    height: 170,
    backgroundColor: "#EEE",
    marginBottom: 10,
  },
  bannerImage: { width: "100%", height: "100%" },

  /* modal text area */
  textAreaWrap: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 160,
  },
  textArea: {
    flex: 1,
    color: "#111",
    fontSize: 15,
    textAlignVertical: "top",
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
  },
  counterText: { color: "#9AA0A6", alignSelf: "flex-end" },

  /* banner create */
  bannerPicker: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  /* footer button */
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14 },
  primaryBtn: { height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
