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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";



//Code Related to the integration
import { getAnnouncements, getBanners } from "../../../utils/queries/settings";
import { createAnnouncement, createBanner, updateAnnouncement, updateBanner, deleteAnnouncement, deleteBanner } from "../../../utils/mutations/settings";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingToken } from "../../../utils/tokenStorage";
import { useAuth } from "../../../contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";


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
  const { user, token: authToken } = useAuth();
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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

  // Get token for API calls
  const token = authToken || onboardingToken;

  // Load onboarding token on component mount
  React.useEffect(() => {
    const loadOnboardingToken = async () => {
      try {
        const token = await getOnboardingToken();
        setOnboardingToken(token);
      } catch (error) {
        console.error("Error loading onboarding token:", error);
      }
    };
    
    if (!authToken) {
      loadOnboardingToken();
    }
  }, [authToken]);

  // Fetch announcements using React Query
  const {
    data: announcementsData,
    isLoading: announcementsLoading,
    isError: announcementsError,
    refetch: refetchAnnouncements,
  } = useQuery({
    queryKey: ["announcements", token],
    queryFn: () => getAnnouncements(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch banners using React Query
  const {
    data: bannersData,
    isLoading: bannersLoading,
    isError: bannersError,
    refetch: refetchBanners,
  } = useQuery({
    queryKey: ["banners", token],
    queryFn: () => getBanners(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract data from API responses
  const announcements = announcementsData?.data || [];
  const banners = bannersData?.data || [];

  // Announcement mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: ({ payload }) => createAnnouncement(payload, token),
    onSuccess: () => {
      refetchAnnouncements();
    },
    onError: (error) => {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAnnouncement(id, payload, token),
    onSuccess: () => {
      refetchAnnouncements();
    },
    onError: (error) => {
      console.error('Error updating announcement:', error);
      Alert.alert('Error', 'Failed to update announcement');
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: ({ id }) => deleteAnnouncement(id, token),
    onSuccess: () => {
      refetchAnnouncements();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting announcement:', error);
      Alert.alert('Error', 'Failed to delete announcement');
    },
  });

  // Banner mutations
  const createBannerMutation = useMutation({
    mutationFn: ({ payload }) => createBanner(payload, token),
    onSuccess: () => {
      refetchBanners();
    },
    onError: (error) => {
      console.error('Error creating banner:', error);
      Alert.alert('Error', 'Failed to create banner');
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, payload }) => updateBanner(id, payload, token),
    onSuccess: () => {
      refetchBanners();
    },
    onError: (error) => {
      console.error('Error updating banner:', error);
      Alert.alert('Error', 'Failed to update banner');
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: ({ id }) => deleteBanner(id, token),
    onSuccess: () => {
      refetchBanners();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting banner:', error);
      Alert.alert('Error', 'Failed to delete banner');
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (tab === "push") {
        await refetchAnnouncements();
      } else {
        await refetchBanners();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);

  const openCreateAnnouncement = (record = null) => {
    setEditing(record);
    setCreateOpen(true);
  };

  const openCreateBanner = (record = null) => {
    setEditingBanner(record);
    setBannerOpen(true);
  };

  const handleDelete = (item, type) => {
    setItemToDelete({ item, type });
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'announcement') {
        deleteAnnouncementMutation.mutate({ id: itemToDelete.item.id });
      } else {
        deleteBannerMutation.mutate({ id: itemToDelete.item.id });
      }
    }
  };

  const onSaveAnnouncement = (payload) => {
    if (editing) {
      updateAnnouncementMutation.mutate({ 
        id: editing.id, 
        payload: { message: payload.text } 
      });
    } else {
      createAnnouncementMutation.mutate({ 
        payload: { message: payload.text } 
      });
    }
    setCreateOpen(false);
    setEditing(null);
  };

  const onSaveBanner = (payload) => {
    if (editingBanner) {
      updateBannerMutation.mutate({ 
        id: editingBanner.id, 
        payload: payload 
      });
    } else {
      createBannerMutation.mutate({ payload });
    }
    setBannerOpen(false);
    setEditingBanner(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} style={[styles.hIcon, { borderColor: C.line }]}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>Announcements/Banners</ThemedText>
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
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {tab === "push" ? (
          announcementsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                Loading announcements...
              </ThemedText>
            </View>
          ) : announcementsError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={C.primary} />
              <ThemedText style={[styles.errorText, { color: C.text }]}>
                Failed to load announcements
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: C.primary }]}
                onPress={() => refetchAnnouncements()}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : announcements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color={C.sub} />
              <ThemedText style={[styles.emptyText, { color: C.text }]}>
                No announcements yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: C.sub }]}>
                Create your first announcement to get started
              </ThemedText>
            </View>
          ) : (
            announcements.map((a) => (
              <AnnouncementCard
                key={a.id}
                C={C}
                data={a}
                onEdit={() => openCreateAnnouncement(a)}
                onDelete={() => handleDelete(a, 'announcement')}
              />
            ))
          )
        ) : (
          bannersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                Loading banners...
              </ThemedText>
            </View>
          ) : bannersError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={C.primary} />
              <ThemedText style={[styles.errorText, { color: C.text }]}>
                Failed to load banners
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: C.primary }]}
                onPress={() => refetchBanners()}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : banners.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="image-outline" size={48} color={C.sub} />
              <ThemedText style={[styles.emptyText, { color: C.text }]}>
                No banners yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: C.sub }]}>
                Create your first banner to get started
              </ThemedText>
            </View>
          ) : (
            banners.map((b) => (
              <BannerCard
                key={b.id}
                C={C}
                data={b}
                onEdit={() => openCreateBanner(b)}
                onDelete={() => handleDelete(b, 'banner')}
              />
            ))
          )
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
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSave={onSaveAnnouncement}
        initialText={editing?.message || ""}
        editing={!!editing}
        C={C}
        isLoading={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
      />

      <CreateBannerModal
        visible={bannerOpen}
        onClose={() => {
          setBannerOpen(false);
          setEditingBanner(null);
        }}
        onSave={onSaveBanner}
        initialData={editingBanner}
        C={C}
        isLoading={createBannerMutation.isPending || updateBannerMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: C.card }]}>
            <Ionicons name="warning-outline" size={48} color={C.primary} />
            <ThemedText style={[styles.deleteModalTitle, { color: C.text }]}>
              Delete {itemToDelete?.type === 'announcement' ? 'Announcement' : 'Banner'}?
            </ThemedText>
            <ThemedText style={[styles.deleteModalText, { color: C.sub }]}>
              This action cannot be undone. Are you sure you want to delete this {itemToDelete?.type === 'announcement' ? 'announcement' : 'banner'}?
            </ThemedText>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { borderColor: C.line }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <ThemedText style={[styles.cancelButtonText, { color: C.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteButton, { backgroundColor: C.primary }]}
                onPress={confirmDelete}
                disabled={deleteAnnouncementMutation.isPending || deleteBannerMutation.isPending}
              >
                {deleteAnnouncementMutation.isPending || deleteBannerMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ───────────── Push Announcement Card & Modal ───────────── */
function AnnouncementCard({ C, data, onEdit, onDelete }) {
  const createdDate = new Date(data.created_at);
  
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" }]}>
      <View style={[styles.msgBox, { borderColor: C.line, backgroundColor: "#fff" }]}>
        <ThemedText style={{ color: C.text }}>{data.message}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Date Created</ThemedText>
        <ThemedText style={styles.kvValue}>{fmt(createdDate)}</ThemedText>
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

function CreateAnnouncementModal({ visible, onClose, onSave, initialText, editing, C, isLoading }) {
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
              editable={!isLoading}
            />
            <ThemedText style={styles.counterText}>{`${text.length}/${MAX}`}</ThemedText>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[
              styles.primaryBtn, 
              { 
                backgroundColor: C.primary,
                opacity: (!text.trim() || isLoading) ? 0.6 : 1
              }
            ]}
            onPress={() => onSave({ text })}
            disabled={!text.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                {editing ? "Update" : "Create"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────── Banner Card & Modal ───────────── */
function BannerCard({ C, data, onEdit, onDelete }) {
  const createdDate = new Date(data.created_at);
  
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" }]}>
      <View style={styles.bannerWrap}>
        <Image source={{ uri: data.image_url }} style={styles.bannerImage} />
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Date Created</ThemedText>
        <ThemedText style={styles.kvValue}>{fmt(createdDate)}</ThemedText>
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

function CreateBannerModal({ visible, onClose, onSave, initialData, C, isLoading }) {
  const [imageUri, setImageUri] = useState(initialData?.image_url || "");
  const [link, setLink] = useState(initialData?.link || "");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setImageUri(initialData?.image_url || "");
    setLink(initialData?.link || "");
    setImageFile(null);
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
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      setImageFile(res.assets[0]);
    }
  };

  const handleSave = () => {
    if (imageFile) {
      // Create FormData for new image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageFile.uri,
        type: 'image/jpeg',
        name: 'banner.jpg',
      });
      formData.append('link', link);
      onSave(formData);
    } else {
      // For editing without new image, just send the link
      onSave({ link });
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>
            {initialData ? "Edit Banner" : "New Banner"}
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={pickBanner}
            style={[styles.bannerPicker, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}
            disabled={isLoading}
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
              editable={!isLoading}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[
              styles.primaryBtn, 
              { 
                backgroundColor: C.primary,
                opacity: (!imageUri || !link.trim() || isLoading) ? 0.6 : 1
              }
            ]}
            onPress={handleSave}
            disabled={!imageUri || !link.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                {initialData ? "Update" : "Create"}
              </ThemedText>
            )}
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

  /* Loading and Error States */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  /* Delete Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModal: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  deleteModalText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
