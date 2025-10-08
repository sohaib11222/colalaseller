// screens/AccessControlScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Platform,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

// API Integration
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { addStoreUser } from "../../../utils/mutations/stores";
import { getStoreUsers } from "../../../utils/queries/stores";

/* ----------------------- MOCK ----------------------- */
const AV =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop";

const INITIAL = [
  { id: "1", email: "abcdef@gmail.com", role: "Admin", avatar: AV },
  { id: "2", email: "abcdef@gmail.com", role: "Admin", avatar: AV },
  { id: "3", email: "abcdef@gmail.com", role: "Admin", avatar: AV },
];

/* ----------------------- SCREEN ----------------------- */
export default function AccessControlScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#E53E3E",
      bg: theme.colors?.background || "#F5F6F8",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#101318",
      sub: theme.colors?.muted || "#6C727A",
      line: theme.colors?.line || "#ECEDEF",
    }),
    [theme]
  );

  const [showAdd, setShowAdd] = useState(false);

  // Fetch store users
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["storeUsers", token],
    queryFn: async () => {
      console.log("Fetching store users with token:", token ? "Token exists" : "No token");
      try {
        const result = await getStoreUsers(token);
        console.log("Store users API response:", result);
        return result;
      } catch (error) {
        console.error("Error fetching store users:", error);
        throw error;
      }
    },
    enabled: !!token,
    retry: 1,
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (payload) => addStoreUser(payload, token),
    onSuccess: (data) => {
      console.log("User added successfully:", data);
      if (data.status === "success") {
        Alert.alert("Success", "User added to store successfully!");
        // Invalidate and refetch users list
        queryClient.invalidateQueries({ queryKey: ["storeUsers"] });
        setShowAdd(false);
      }
    },
    onError: (error) => {
      console.error("Add user error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add user. Please try again.";
      Alert.alert("Error", errorMessage);
    },
  });

  // Get users from API or fallback to empty array
  const users = usersData?.data || [];
  
  // Check if error is specifically about no store association
  const isNoStoreError = usersError && (
    usersError?.response?.data?.message?.includes("not associated with any store") ||
    usersError?.message?.includes("not associated with any store")
  );
  
  // Debug logging
  console.log("AccessControlScreen Debug:");
  console.log("- usersLoading:", usersLoading);
  console.log("- usersError:", usersError);
  console.log("- usersData:", usersData);
  console.log("- users array:", users);
  console.log("- isNoStoreError:", isNoStoreError);

  const removeUser = (id) => {
    // Note: This is a placeholder - you'll need to implement delete user API
    Alert.alert("Delete User", "Delete user functionality not implemented yet.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.card, borderBottomColor: C.line },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home")
            }
            style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>
            Access Control
          </ThemedText>

          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      {/* Body */}
      {usersLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={{ color: C.sub, marginTop: 10 }}>
            Loading users...
          </ThemedText>
        </View>
      ) : isNoStoreError ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="storefront-outline" size={48} color={C.sub} />
          <ThemedText style={{ color: C.text, marginTop: 10, textAlign: "center", fontSize: 18, fontWeight: "600" }}>
            No Store Associated
          </ThemedText>
          <ThemedText style={{ color: C.sub, marginTop: 8, textAlign: "center", fontSize: 14 }}>
            You need to create or be associated with a store to manage users.
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("StoreBuilder");
            }}
            style={{
              marginTop: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: C.primary,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Create Store</ThemedText>
          </TouchableOpacity>
        </View>
      ) : usersError ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
          <ThemedText style={{ color: C.sub, marginTop: 10, textAlign: "center" }}>
            Failed to load users. Please try again.
          </ThemedText>
          <ThemedText style={{ color: C.sub, marginTop: 5, textAlign: "center", fontSize: 12 }}>
            Error: {usersError?.message || "Unknown error"}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              queryClient.invalidateQueries({ queryKey: ["storeUsers"] });
            }}
            style={{
              marginTop: 10,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: C.primary,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ color: "#fff" }}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListHeaderComponent={
            <View style={[styles.infoWrap, { backgroundColor: "#EEF1F6" }]}>
              <ThemedText style={{ color: C.sub, fontSize: 12 }}>
                Grant users access to manage parts of your account. Input the
                user's email and you can add a unique password for each user.
              </ThemedText>

              <ThemedText style={[styles.sectionTitle, { color: C.text, marginTop: 14 }]}>
                Users ({users.length})
              </ThemedText>
            </View>
          }
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
              <Ionicons name="people-outline" size={48} color={C.sub} />
              <ThemedText style={{ color: C.sub, marginTop: 10, textAlign: "center" }}>
                No users found
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.userRow,
                { backgroundColor: C.card, borderColor: C.line },
              ]}
            >
              <Image 
                source={{ uri: item.profile_picture || AV }} 
                style={styles.avatar} 
              />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: C.text }}>{item.name || item.email}</ThemedText>
                <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                  {item.email}
                </ThemedText>
                <ThemedText style={{ color: C.primary, fontSize: 12, marginTop: 2 }}>
                  {item.is_owner ? "Owner" : "User"}
                </ThemedText>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <SquareBtn
                  C={C}
                  onPress={() => {
                    setShowAdd(true);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color={C.text} />
                </SquareBtn>
                <SquareBtn C={C} onPress={() => removeUser(item.id)}>
                  <Ionicons name="trash-outline" size={16} color={C.text} />
                </SquareBtn>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add user CTA - Only show when we have successful data and not in error states */}
      {!isNoStoreError && !usersError && usersData && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowAdd(true)}
          style={[styles.primaryBtn, { backgroundColor: C.primary }]}
        >
          <ThemedText style={styles.primaryBtnTxt}>Add new User</ThemedText>
        </TouchableOpacity>
      )}

      {/* --------------- Full-screen ADD USER modal --------------- */}
      <AddUserModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(payload) => {
          addUserMutation.mutate(payload);
        }}
        C={C}
        isLoading={addUserMutation.isPending}
      />
    </SafeAreaView>
  );
}

/* ----------------------- MODAL ----------------------- */
function AddUserModal({ visible, onClose, onSave, C, isLoading }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState("");
  const [roleSheet, setRoleSheet] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Top bar */}
        <View
          style={[
            styles.header,
            { backgroundColor: C.card, borderBottomColor: C.line },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
            >
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>

            <ThemedText style={[styles.headerTitle, { color: C.text }]}>
              Add User
            </ThemedText>

            <View style={{ width: 40, height: 40 }} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <Input
            placeholder="User Name"
            value={name}
            onChangeText={setName}
            C={C}
          />
          <Input
            placeholder="User Email Address"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            C={C}
          />
          <Input
            placeholder="User Password"
            secureTextEntry
            value={pwd}
            onChangeText={setPwd}
            C={C}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.selectRow, { backgroundColor: C.card, borderColor: C.line }]}
            onPress={() => setRoleSheet(true)}
          >
            <ThemedText
              style={{ color: role ? C.text : C.sub, fontSize: 14 }}
              numberOfLines={1}
            >
              {role || "Select Role"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={C.sub} />
          </TouchableOpacity>

          {/* Roles explanation */}
          <RoleBlock
            title="Admin"
            desc="Anyone with the admin role has access to"
            items={["Feature 1", "Feature 2", "Feature 3", "Feature 4"]}
            C={C}
          />
          <RoleBlock
            title="Role 2"
            desc="Anyone with the Role 2 role has access to"
            items={["Feature 1", "Feature 2", "Feature 3", "Feature 4"]}
            C={C}
          />
        </ScrollView>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!name || !email || !pwd || !role || isLoading}
          style={[
            styles.primaryBtn, 
            { 
              backgroundColor: (!name || !email || !pwd || !role || isLoading) ? "#6B7280" : C.primary,
              opacity: isLoading ? 0.7 : 1
            }
          ]}
          onPress={() => {
            if (!name || !email || !pwd || !role) {
              Alert.alert("Error", "Please fill in all fields");
              return;
            }
            onSave({ name, email, password: pwd, role });
          }}
        >
          {isLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={styles.primaryBtnTxt}>Adding User...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.primaryBtnTxt}>Save User</ThemedText>
          )}
        </TouchableOpacity>

        {/* Role picker sheet */}
        <BottomSheet visible={roleSheet} onClose={() => setRoleSheet(false)} C={C} title="Select Role">
          {["admin", "user"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.sheetItem, { backgroundColor: "#EDEFF3" }]}
              onPress={() => {
                setRole(r);
                setRoleSheet(false);
              }}
            >
              <ThemedText style={{ color: C.text }}>{r.charAt(0).toUpperCase() + r.slice(1)}</ThemedText>
            </TouchableOpacity>
          ))}
        </BottomSheet>
      </SafeAreaView>
    </Modal>
  );
}

/* ----------------------- TINY PARTS ----------------------- */
function Input({ C, ...props }) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={C.sub}
      style={[
        styles.input,
        { backgroundColor: C.card, borderColor: C.line, color: C.text },
      ]}
    />
  );
}

function RoleBlock({ title, desc, items, C }) {
  return (
    <View style={{ marginTop: 18 }}>
      <ThemedText style={{ color: C.text, fontWeight: "700" }}>{title}</ThemedText>
      <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>{desc}</ThemedText>
      <View style={{ marginTop: 8 }}>
        {items.map((t, i) => (
          <View key={`${title}-${i}`} style={{ flexDirection: "row", marginBottom: 6 }}>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: C.text,
                marginTop: 7,
                marginRight: 8,
              }}
            />
            <ThemedText style={{ color: C.text }}>{t}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function SquareBtn({ children, onPress, C }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.squareBtn,
        { backgroundColor: C.card, borderColor: C.line },
      ]}
      activeOpacity={0.9}
    >
      {children}
    </TouchableOpacity>
  );
}

function BottomSheet({ visible, onClose, title, C, children }) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetWrap, { backgroundColor: C.bg }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={{ fontSize: 18, fontStyle: "italic", color: C.text }}>
              {title}
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={{ borderWidth: 1.2, borderColor: C.text, borderRadius: 16, padding: 4 }}
            >
              <Ionicons name="close" size={16} color={C.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ paddingHorizontal: 16 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ----------------------- STYLES ----------------------- */
function shadow(e = 6) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 35,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex:5
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },

  infoWrap: {
    paddingVertical: 12,
  },
  sectionTitle: { fontWeight: "600" },

  userRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    ...shadow(2),
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },

  squareBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtn: {
    marginHorizontal: 16,
    marginBottom: 18,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(6),
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "600" },

  /* modal form */
  input: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  selectRow: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* bottom sheet */
  sheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheetWrap: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 16, maxHeight: "85%" },
  sheetHandle: {
    width: 100,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#C9CED6",
    alignSelf: "center",
    marginTop: 6,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
});
