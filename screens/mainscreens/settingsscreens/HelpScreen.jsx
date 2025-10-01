import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  { id: "q1", q: "Question 1", a: "Answer for question 1 goes here." },
  { id: "q2", q: "Question 2", a: "Answer for question 2 goes here." },
  { id: "q3", q: "Question 3", a: "Answer for question 3 goes here." },
  {
    id: "q4",
    q: "How are sellers ranked on Colala ?",
    a: "Sellers are ranked based on several factors that contribute to their overall score.",
  },
];

export default function HelpScreen({ navigation }) {
  const [openId, setOpenId] = useState("q4"); // last one open like your mock

  const toggle = (id) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </Pressable>
        <Text style={styles.title}>How it works ?</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {FAQS.map((item) => {
          const open = openId === item.id;
          return (
            <View key={item.id} style={[styles.card, open && styles.cardOpen]}>
              <Pressable style={styles.row} onPress={() => toggle(item.id)}>
                <Text style={styles.question}>{item.q}</Text>
                <Ionicons name={open ? "remove" : "add"} size={20} color="#222" />
              </Pressable>

              {open && (
                <View style={styles.answerWrap}>
                  <Text style={styles.answer}>{item.a}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7FF" },
  header: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerBtn: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#222" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 22,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    // elevation: 2,
  },
  cardOpen: {
    paddingBottom: 16,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  question: { fontSize: 15, fontWeight: "700", color: "#2a2a2a" },
  answerWrap: { marginTop: 8 },
  answer: { fontSize: 13, color: "#60646C", lineHeight: 18 },
});
