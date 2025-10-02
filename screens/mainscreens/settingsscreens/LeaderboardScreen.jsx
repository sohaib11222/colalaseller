import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useNavigation } from "@react-navigation/native";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BG = require("../../../assets/leaderboard.png");
const { width, height } = Dimensions.get("window");

const ALL_TABS = ["Today", "weekly", "Monthly", "All Time"];

// ---------- Data ----------
const TOP3 = [
  { id: "2", name: "Vee Stores",   score: 180, avatar: require("../../../assets/Ellipse 93.png") },
  { id: "1", name: "Sasha Stores", score: 200, avatar: require("../../../assets/Ellipse 94.png") },
  { id: "3", name: "Dan Stores",   score: 150, avatar: require("../../../assets/Ellipse 95.png") },
];

const OTHERS = [
  { id: "4", name: "Kevin Stores",       score: 100, avatar: "https://i.pravatar.cc/160?img=5"  },
  { id: "5", name: "Rabby Stores",       score: 70,  avatar: "https://i.pravatar.cc/160?img=8"  },
  { id: "6", name: "Dann Stores",        score: 350, avatar: "https://i.pravatar.cc/160?img=22" },
  { id: "7", name: "Don Stores",         score: 400, avatar: "https://i.pravatar.cc/160?img=40" },
  { id: "8", name: "Scent villa stores", score: 500, avatar: "https://i.pravatar.cc/160?img=60" },
];

// ---------- Avatar primitives ----------
const resolveSource = (src) => {
  // src can be a local require() (number) or a remote string
  if (typeof src === "number") return src;
  if (typeof src === "string") return { uri: src };
  return null;
};

const PodiumAvatar = ({ src, size = 84 }) => {
  // thick white ring + soft drop shadow (for top-3)
  const ring = size + 14;
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={[
          styles.podiumRing,
          { width: ring, height: ring, borderRadius: ring / 2 },
        ]}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          <Image source={resolveSource(src)} style={{ width: "100%", height: "100%" }} />
        </View>
      </View>
    </View>
  );
};

const ListAvatar = ({ src, size = 44 }) => {
  // thinner ring for rows
  const ring = size + 8;
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={[
          styles.listRing,
          { width: ring, height: ring, borderRadius: ring / 2 },
        ]}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          <Image source={resolveSource(src)} style={{ width: "100%", height: "100%" }} />
        </View>
      </View>
    </View>
  );
};

const HEADER_H = 56;

export default function LeaderboardScreen() {
  // ----- Tabs -----
  const navigation = useNavigation();

  const [order, setOrder] = useState(ALL_TABS); // left → right
  const scaleMap = useRef(
    ALL_TABS.reduce(
      (acc, k) => ({ ...acc, [k]: new Animated.Value(k === "Today" ? 1.25 : 1) }),
      {}
    )
  ).current;

  const animateScales = (newActive, oldActive) => {
    Animated.parallel([
      Animated.timing(scaleMap[oldActive], {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(scaleMap[newActive], {
        toValue: 1.25,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressFilter = (label) => {
    if (label === order[0]) return;
    const oldActive = order[0];
    const iSel = order.indexOf(label);
    const next = [...order];
    [next[0], next[iSel]] = [next[iSel], next[0]];

    LayoutAnimation.configureNext(
      LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    animateScales(label, oldActive);
    setOrder(next);
  };

  const top3 = useMemo(() => TOP3, []);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* Full-screen BG */}
      <ImageBackground source={BG} resizeMode="cover" style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 20 }]}>
       <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#E21F62" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Seller Leaderboard</ThemedText>
        <Pressable
          style={[styles.headerBtn, { right: 16, left: undefined }]}
          onPress={() => navigation.navigate('ChatNavigator', { screen: 'Help' })}
        >
          <Ionicons name="help" size={22} color="#E21F62" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow}>
          {order.map((label, idx) => {
            const isTodaySlot = idx === 0;
            return (
              <Pressable key={label} onPress={() => onPressFilter(label)} hitSlop={8}>
                <Animated.Text
                  style={[
                    styles.tabText,
                    isTodaySlot ? styles.tabActive : styles.tabInactive,
                    { transform: [{ scale: scaleMap[label] }] },
                  ]}
                >
                  {label}
                </Animated.Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Podium area */}
      <View style={styles.podiumZone}>
        {/* 2nd */}
        <View style={[styles.side, { left: width * 0.12, bottom: 129 }]}>
          <PodiumAvatar src={top3[0].avatar} size={72} />
          <ThemedText style={styles.sideName} numberOfLines={1}>{top3[0].name}</ThemedText>
          <ThemedText style={styles.sideScore}>{top3[0].score}</ThemedText>
        </View>

        {/* 1st */}
        <View style={[styles.centerBlock, { bottom: 193 }]}>
          <PodiumAvatar src={top3[1].avatar} size={90} />
          <ThemedText style={styles.centerName} numberOfLines={1}>{top3[1].name}</ThemedText>
          <ThemedText style={styles.centerScore}>{top3[1].score}</ThemedText>
        </View>

        {/* 3rd */}
        <View style={[styles.side, { right: width * 0.12, bottom: 77, alignItems: "flex-end" }]}>
          <PodiumAvatar src={top3[2].avatar} size={72} />
          <ThemedText style={styles.sideName} numberOfLines={1}>{top3[2].name}</ThemedText>
          <ThemedText style={styles.sideScore}>{top3[2].score}</ThemedText>
        </View>
      </View>

      {/* List */}
      <View style={styles.listWrap}>
        <FlatList
          data={OTHERS}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <ThemedText style={styles.rank}>{index + 4}</ThemedText>
              <View style={styles.rowCenter}>
                <ListAvatar src={item.avatar} size={44} />
                <ThemedText style={styles.rowName} numberOfLines={1}>{item.name}</ThemedText>
              </View>
              <ThemedText style={styles.rowScore}>{item.score}</ThemedText>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// const HEADER_H = 56;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#7a0040" },

  // Header
  header: {
    height: HEADER_H,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  headerBtn: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    top: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // Tabs
  tabsWrap: { paddingHorizontal: 20, marginTop: 17 },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabText: { color: "#fff" },
  tabActive: { fontSize: 28, fontWeight: "900" },
  tabInactive: { fontSize: 16, fontWeight: "600", opacity: 0.65 },

  // Podium avatar rings (thicker + shadow)
  podiumRing: {
    backgroundColor: "#971E50",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#971E50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },

  // List avatar rings (thinner)
  listRing: {
    backgroundColor: "#fff",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.08)",
  },

  // Podium zone (tuned to your PNG)
  podiumZone: { height: height * 0.47, justifyContent: "flex-end" },
  centerBlock: { position: "absolute", alignSelf: "center", alignItems: "center" },
  centerName: { marginTop: 8, color: "#fff", fontWeight: "700", fontSize: 12 },
  centerScore: { color: "#fff", fontWeight: "900", marginTop: 2, fontSize: 14 },

  side: { position: "absolute", alignItems: "flex-start" },
  sideName: { marginTop: 6, color: "#fff", fontWeight: "700", fontSize: 12 },
  sideScore: { color: "#fff", fontWeight: "900", marginTop: 2, alignSelf: "center", fontSize: 14 },

  // List
  listWrap: {
    flex: 1,
    marginTop: 6,
    backgroundColor: "#fff",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  rank: { width: 28, fontWeight: "700", color: "#000" },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600", color: "#222" },
  rowScore: { fontSize: 15, fontWeight: "800", color: "#E21F62" },
});
