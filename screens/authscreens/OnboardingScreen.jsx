import React, { useMemo } from "react";
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import ThemedText from "../../components/ThemedText";

const { width, height } = Dimensions.get("window");

const features = [
  { id: 1, image: require("../../assets/Rectangle 157.png"), text: "Shop from variety of unique stores nationwide across several categories" },
  { id: 2, image: require("../../assets/Rectangle 157 (1).png"), text: "Chat and communicate easily with stores via the in‑app chat" },
  { id: 3, image: require("../../assets/Rectangle 157 (2).png"), text: "Personalized social feeds to see latest posts from stores across Colala" },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();

  // put the white card roughly mid‑screen regardless of device
  const CARD_TOP = useMemo(() => Math.round(height * 0.44), []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Hero */}
      <Image
        source={require("../../assets/file_00000000574c620aaa90f4573cc5dbf1 1.png")}
        style={styles.hero}
        resizeMode="cover"
      />

      {/* White card */}
      <View style={[styles.card, { top: CARD_TOP }]}>
        <ThemedText font="oleo" style={styles.welcome}>
          Welcome to
        </ThemedText>

        <View style={styles.brandRow}>
          <ThemedText font="oleo" style={styles.brand}>COLALA</ThemedText>
          <ThemedText font="oleo" style={styles.mall}>mall</ThemedText>
        </View>

        <ThemedText style={styles.subtitle}>Why Choose Colala ?</ThemedText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
          style={{ marginBottom: 16 }}
        >
          {features.map(item => (
            <View key={item.id} style={styles.featureCard}>
              <Image source={item.image} style={styles.featureImage} />
              <ThemedText style={styles.featureText}>{item.text}</ThemedText>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.9}
          style={styles.proceedBtn}
        >
          <ThemedText style={styles.proceedText}>Proceed</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 28;
const CARD_PADDING = 20;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height: Math.max(280, height * 0.90),
  },

  card: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F9F9F9",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    padding: CARD_PADDING,
    // subtle lift so it “sits” over the hero
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
    }),
  },

  welcome: {
    fontSize: 18,
    color: "#E53E3E",
    // marginBottom: 2,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },

  brand: {
    fontSize: 80,
    marginTop:10,
    lineHeight: 62,
    color: "#E53E3E",
  },

  mall: {
    marginLeft: 8,
    fontSize: 50,
    color: "#E53E3E",
  },

  subtitle: {
    fontSize: 13,
    color: "#6C727A",
    marginTop: 4,
    marginBottom: 14,
  },

  featureCard: {
    width: width * 0.54,
    backgroundColor: "#ffffff",
    height:243,
    borderRadius: 18,
    marginRight: 14,
    overflow: "hidden", // ensure image has no padding/bleed
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },

  featureImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },

  featureText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlign: "center",
    color: "#101318",
  },

  proceedBtn: {
    marginTop: 6,
    backgroundColor: "#E53E3E",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  proceedText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
