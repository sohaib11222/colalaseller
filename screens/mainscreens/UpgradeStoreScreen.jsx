// screens/my/UpgradeStoreScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";

/* ────────────────────────────────────────────────────────────────────────────
   MAIN SCREEN
   ──────────────────────────────────────────────────────────────────────────── */
export default function UpgradeStoreScreen({ navigation }) {
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

  const levels = [
    { level: 1, completion: 100, requirements: ["Level requirements 1", "Level requirement 2"], benefits: ["Benefit 1", "Benefit 2"], current: true },
    { level: 2, completion: 80,  requirements: ["Level requirements 1", "Level requirement 2"], benefits: ["Benefit 1", "Benefit 2"] },
    { level: 3, completion: 80,  requirements: ["Level requirements 1", "Level requirement 2"], benefits: ["Benefit 1", "Benefit 2"] },
  ];

  const [lv1Open, setLv1Open] = useState(false);
  const [lv2Open, setLv2Open] = useState(false);
  const [lv3Open, setLv3Open] = useState(false);

  // timeline centered through dots
  const PAGE_PAD = 16;
  const TL_COL = 56;
  const LINE_LEFT = PAGE_PAD + TL_COL / 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} style={[styles.hIcon, { borderColor: C.line }]}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>Upgrade Store</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {/* List + timeline */}
      <View style={{ flex: 1 }}>
        <View pointerEvents="none" style={[styles.longLine, { backgroundColor: C.line, left: LINE_LEFT }]} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: PAGE_PAD, paddingBottom: 40 }}>
          {levels.map((lv) => {
            const filled = lv.completion >= 100;

            const CardBody = (
              <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <ThemedText style={{ fontWeight: "800", color: C.text, fontSize: 15 }}>{`Level ${lv.level}`}</ThemedText>
                  {lv.current ? (
                    <View style={[styles.badge, { backgroundColor: C.primary + "22", borderColor: C.primary }]}>
                      <ThemedText style={{ color: C.primary, fontWeight: "800", fontSize: 11 }}>Current Level</ThemedText>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, justifyContent: "space-between" }}>
                  <View>
                    <ThemedText style={{ color: C.sub, fontSize: 12 }}>Percentage Completion</ThemedText>
                    <ThemedText style={{ color: C.primary, fontWeight: "800", marginTop: 2 }}>{lv.completion}%</ThemedText>
                  </View>
                  <View style={[styles.percentBubble, { borderColor: C.primary }]}>
                    <ThemedText style={{ color: C.primary, fontWeight: "800", fontSize: 12 }}>{lv.completion}%</ThemedText>
                  </View>
                </View>

                <View style={{ marginTop: 14 }}>
                  <ThemedText style={{ color: C.text, fontWeight: "800" }}>Level Requirements</ThemedText>
                  {lv.requirements.map((t, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                      <Ionicons name="checkmark" size={16} color={C.primary} />
                      <ThemedText style={{ color: C.sub, marginLeft: 8 }}>{t}</ThemedText>
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 14 }}>
                  <ThemedText style={{ color: C.text, fontWeight: "800" }}>Level Benefits</ThemedText>
                  {lv.benefits.map((t, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                      <Ionicons name="checkmark" size={16} color={C.primary} />
                      <ThemedText style={{ color: C.sub, marginLeft: 8 }}>{t}</ThemedText>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.cta, { backgroundColor: C.primary }]}
                  onPress={() => {
                    if (lv.level === 1) setLv1Open(true);
                    if (lv.level === 2) setLv2Open(true);
                    if (lv.level === 3) setLv3Open(true);
                  }}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                    {lv.level === 1 ? "View Details" : `Upgrade to level ${lv.level}`}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );

            return (
              <View key={lv.level} style={{ flexDirection: "row", marginBottom: 18 }}>
                {/* timeline column */}
                <View style={{ width: TL_COL, alignItems: "center" }}>
                  <View
                    style={[
                      styles.stepDot,
                      filled ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.card, borderColor: C.primary },
                    ]}
                  >
                    <ThemedText style={{ color: filled ? "#fff" : C.primary, fontWeight: "800" }}>{lv.level}</ThemedText>
                  </View>
                </View>
                <View style={{ flex: 1 }}>{CardBody}</View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Full-screen modals for each level */}
      <LevelOneModal
        visible={lv1Open}
        onClose={() => setLv1Open(false)}
        onOpenLevel2={() => {
          setLv1Open(false);
          setLv2Open(true);
        }}
        C={C}
      />
      <LevelTwoModal
        visible={lv2Open}
        onClose={() => setLv2Open(false)}
        onOpenLevel3={() => {
          setLv2Open(false);
          setLv3Open(true);
        }}
        C={C}
      />
      <LevelThreeModal visible={lv3Open} onClose={() => setLv3Open(false)} C={C} />
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LEVEL 1  (3 phases + change-password bottom sheets + category picker)
   ──────────────────────────────────────────────────────────────────────────── */
function LevelOneModal({ visible, onClose, onOpenLevel2, C }) {
  const [showPhone, setShowPhone] = useState(true);
  const [step, setStep] = useState(1); // 1=form, 2=uploads, 3=categories

  // change-password flow (bottom sheets)
  const [cpEmail, setCpEmail] = useState(false);
  const [cpCode, setCpCode] = useState(false);
  const [cpNew, setCpNew] = useState(false);

  // uploads (phase 2)
  const [avatar, setAvatar] = useState("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=60");
  const [banner, setBanner] = useState("https://images.unsplash.com/photo-1521335629791-ce4aec67dd53?w=1200&q=60");

  // Phase 3: categories + socials
  const [selectedCats, setSelectedCats] = useState(["Electronics", "Phones"]);
  const [catPicker, setCatPicker] = useState(false);
  const [links, setLinks] = useState({ whatsapp: "", instagram: "", facebook: "", x: "", tiktok: "", linkedin: "" });

  const pickImage = async (mode = "avatar") => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        mode === "avatar" ? setAvatar(uri) : setBanner(uri);
      }
    } catch {}
  };

  useEffect(() => { if (!visible) setStep(1); }, [visible]);

  const SmallStepDot = ({ n }) => {
    const active = n <= step;
    return (
      <View style={[styles.smallStep, active ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.card, borderColor: "#C4C4C4" }]}>
        <ThemedText style={{ color: active ? "#fff" : "#6B7280", fontWeight: "800" }}>{n}</ThemedText>
      </View>
    );
  };

  return (
    <Modal visible={visible} presentationStyle="fullScreen" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}><Ionicons name="chevron-back" size={20} color={C.text} /></TouchableOpacity>
          <ThemedText style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>Level 1</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* Progress header */}
          <View style={[styles.levelBox, { borderColor: C.primary + "66", backgroundColor: C.card }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <ThemedText style={{ color: C.text, fontWeight: "800" }}>Level 1</ThemedText>
              <TouchableOpacity><ThemedText style={{ color: C.primary, fontWeight: "800" }}>View Benefits</ThemedText></TouchableOpacity>
            </View>
            <View style={{ height: 30, justifyContent: "center" }}>
              <View style={{ height: 3, backgroundColor: "#E5E7EB", borderRadius: 999 }} />
              <View style={{ position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
                {[1, 2, 3].map((n) => <SmallStepDot key={n} n={n} />)}
              </View>
            </View>
          </View>

          {step === 1 && (
            <>
              <InputBox C={C} placeholder="Sasha Stores" />
              <InputBox C={C} placeholder="sashastores@gmail.com" right={<VerifyPill C={C} />} />
              <InputBox C={C} placeholder="070312345678" />
              <SelectRow C={C} label="Lagos" />
              <SelectRow C={C} label="Change Password" onPress={() => setCpEmail(true)} />
              <ToggleRow C={C} label="Show Phone on profile" value={showPhone} onValueChange={setShowPhone} />
              <InputBox C={C} placeholder="Referral Code (Optional)" />

              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={[styles.btnX, { backgroundColor: "#000" }]}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save & Exit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnX, { backgroundColor: C.primary }]} onPress={() => setStep(2)}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <ThemedText style={{ color: C.text, marginTop: 4 }}>Upload a profile picture for your store</ThemedText>
              <TouchableOpacity onPress={() => pickImage("avatar")} style={{ alignSelf: "center", marginVertical: 12 }}>
                <Image source={{ uri: avatar }} style={{ width: 120, height: 120, borderRadius: 60 }} />
              </TouchableOpacity>
              <ThemedText style={{ color: C.text, marginTop: 6 }}>Upload a banner for your store</ThemedText>
              <TouchableOpacity onPress={() => pickImage("banner")} activeOpacity={0.9} style={{ marginTop: 10 }}>
                <Image source={{ uri: banner }} style={{ width: "100%", height: 140, borderRadius: 16 }} />
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26 }}>
                <TouchableOpacity onPress={() => setStep(1)} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: C.primary }]} onPress={() => setStep(3)}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <ThemedText style={{ color: C.text, marginTop: 4 }}>Add Category</ThemedText>
              <SelectRow C={C} label="Select Category" onPress={() => setCatPicker(true)} />
              {/* chips */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                {selectedCats.map((c) => (
                  <View key={c} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFE7E7" }}>
                    <ThemedText style={{ color: C.primary, fontWeight: "700" }}>{c}</ThemedText>
                  </View>
                ))}
              </View>

              <ThemedText style={{ color: C.text, marginTop: 18 }}>Add Social Links</ThemedText>
              {["whatsapp","instagram","facebook","x","tiktok","linkedin"].map((k)=>(
                <View key={k} style={[styles.inputBox, { backgroundColor: C.card, borderColor: "#E5E7EB" }]}>
                  <TextInput placeholder={`Add ${k === "x" ? "X(formerly twitter)" : k} link`} placeholderTextColor="#9CA3AF" style={{ flex: 1, color: C.text }} />
                </View>
              ))}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 }}>
                <TouchableOpacity onPress={() => setStep(2)} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "#EDEEEF", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: C.primary }]} onPress={onOpenLevel2}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed to Level 2</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: "#000" }]}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save & Exit</ThemedText>
                </TouchableOpacity>
              </View>

              <CategoryPickerSheet
                C={C}
                visible={catPicker}
                onClose={() => setCatPicker(false)}
                selected={selectedCats}
                onApply={(arr) => { setSelectedCats(arr); setCatPicker(false); }}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Change Password bottom sheets */}
      <ChangePasswordEmailSheet C={C} visible={cpEmail} onClose={() => setCpEmail(false)} onProceed={() => { setCpEmail(false); setCpCode(true); }} />
      <ChangePasswordCodeSheet  C={C} visible={cpCode} onClose={() => setCpCode(false)} onProceed={() => { setCpCode(false); setCpNew(true); }} />
      <ChangePasswordNewSheet   C={C} visible={cpNew}  onClose={() => setCpNew(false)}  onProceed={() => setCpNew(false)} />
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LEVEL 2  (2 phases + business type bottom sheet)
   ──────────────────────────────────────────────────────────────────────────── */
function LevelTwoModal({ visible, onClose, onOpenLevel3, C }) {
  const [step, setStep] = useState(1);
  const [bizTypeOpen, setBizTypeOpen] = useState(false);
  const [bizType, setBizType] = useState("");

  const SmallStepDot = ({ n }) => {
    const active = n <= step;
    return (
      <View style={[styles.smallStep, active ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.card, borderColor: "#C4C4C4" }]}>
        <ThemedText style={{ color: active ? "#fff" : "#6B7280", fontWeight: "800" }}>{n}</ThemedText>
      </View>
    );
  };

  const UploadBox = ({ label }) => (
    <TouchableOpacity activeOpacity={0.8} style={{ height: 140, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="camera-outline" size={30} color="#C0C0C0" />
      <ThemedText style={{ color: "#999", marginTop: 8, textAlign: "center" }}>
        {`Upload a clear picture of your ${label}`}
      </ThemedText>
    </TouchableOpacity>
  );

  useEffect(() => { if (!visible) { setStep(1); setBizTypeOpen(false); } }, [visible]);

  return (
    <Modal visible={visible} presentationStyle="fullScreen" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>Level 2</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* Progress header */}
          <View style={[styles.levelBox, { borderColor: C.primary + "66", backgroundColor: C.card }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <ThemedText style={{ color: C.text, fontWeight: "800" }}>Level 2</ThemedText>
              <TouchableOpacity><ThemedText style={{ color: C.primary, fontWeight: "800" }}>View Benefits</ThemedText></TouchableOpacity>
            </View>
            <View style={{ height: 30, justifyContent: "center" }}>
              <View style={{ height: 3, backgroundColor: "#E5E7EB", borderRadius: 999 }} />
              <View style={{ position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
                {[1, 2].map((n) => <SmallStepDot key={n} n={n} />)}
              </View>
            </View>
          </View>

          {step === 1 ? (
            <>
              <InputBox C={C} placeholder="Business Name" />
              <SelectRow C={C} label={bizType ? bizType : "Business Type"} onPress={() => setBizTypeOpen(true)} />
              <InputBox C={C} placeholder="NIN Number" />
              <InputBox C={C} placeholder="CAC Number" />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26 }}>
                <TouchableOpacity onPress={onClose} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "#EDEEEF", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: C.primary }]} onPress={() => setStep(2)}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: "#000" }]}><ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save & Exit</ThemedText></TouchableOpacity>
              </View>

              {/* Business type bottom sheet */}
              <BottomSheet C={C} visible={bizTypeOpen} onClose={() => setBizTypeOpen(false)} title="Business Type">
                {["BN", "LTD"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => { setBizType(t); setBizTypeOpen(false); }}
                    style={{ height: 54, borderRadius: 12, backgroundColor: "#F6F6F6", alignItems: "flex-start", justifyContent: "center", paddingHorizontal: 16, marginBottom: 10 }}
                  >
                    <ThemedText style={{ color: "#111" }}>{t}</ThemedText>
                  </TouchableOpacity>
                ))}
              </BottomSheet>
            </>
          ) : (
            <>
              <ThemedText style={{ color: C.text, marginBottom: 8 }}>Upload a copy of your NIN Slip</ThemedText>
              <UploadBox label="NIN Slip" />
              <ThemedText style={{ color: C.text, marginTop: 16, marginBottom: 8 }}>Upload a copy of your CAC Certificate</ThemedText>
              <UploadBox label="CAC Certificate" />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26 }}>
                <TouchableOpacity onPress={() => setStep(1)} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "#EDEEEF", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: C.primary }]} onPress={onOpenLevel3}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed to level 3</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: "#000" }]}><ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save & Exit</ThemedText></TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LEVEL 3  (2 phases + physical store bottom sheet + color theme switch)
   ──────────────────────────────────────────────────────────────────────────── */
function LevelThreeModal({ visible, onClose, C }) {
  const { setPrimary } = useTheme(); // change app color instantly
  const [step, setStep] = useState(1); // 1 = question + video, 2 = address + pricing + color
  const [physicalOpen, setPhysicalOpen] = useState(false);
  const [physicalAns, setPhysicalAns] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [addrOpen, setAddrOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [delivery, setDelivery] = useState("");
  const COLORS = ["#E53E3E","#0000FF","#800080","#008000","#FFA500","#00FF48","#4C1066","#FBFF00","#FF0066","#374F23"];
  const [brandColor, setBrandColor] = useState(COLORS[0]);

  useEffect(() => { if (!visible) setStep(1); }, [visible]);

  const SmallStepDot = ({ n }) => {
    const active = n <= step;
    return (
      <View style={[styles.smallStep, active ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.card, borderColor: "#C4C4C4" }]}>
        <ThemedText style={{ color: active ? "#fff" : "#6B7280", fontWeight: "800" }}>{n}</ThemedText>
      </View>
    );
  };

  const pickVideo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setVideoUri(res.assets[0].uri);
  };

  return (
    <Modal visible={visible} presentationStyle="fullScreen" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>Level 3</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* Progress header */}
          <View style={[styles.levelBox, { borderColor: C.primary + "66", backgroundColor: C.card }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <ThemedText style={{ color: C.text, fontWeight: "800" }}>Level 3</ThemedText>
              <TouchableOpacity><ThemedText style={{ color: C.primary, fontWeight: "800" }}>View Benefits</ThemedText></TouchableOpacity>
            </View>
            <View style={{ height: 30, justifyContent: "center" }}>
              <View style={{ height: 3, backgroundColor: "#E5E7EB", borderRadius: 999 }} />
              <View style={{ position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
                {[1, 2].map((n) => <SmallStepDot key={n} n={n} />)}
              </View>
            </View>
          </View>

          {step === 1 ? (
            <>
              <SelectRow
                C={C}
                label={physicalAns || "Does your business have a physical store"}
                onPress={() => setPhysicalOpen(true)}
              />

              <ThemedText style={{ color: C.text, marginTop: 10 }}>
                Upload a 1 minute video of your store
              </ThemedText>
              <TouchableOpacity
                style={{ height: 160, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginTop: 8 }}
                onPress={pickVideo}
                activeOpacity={0.9}
              >
                {videoUri ? (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="play-circle-outline" size={32} color="#BDBDBD" />
                    <ThemedText style={{ color: "#8F8F8F", marginTop: 6 }}>Video selected</ThemedText>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="camera-outline" size={30} color="#BDBDBD" />
                    <ThemedText style={{ color: "#8F8F8F", marginTop: 6 }}>Select video to upload</ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26 }}>
                <TouchableOpacity onPress={onClose} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "#EDEEEF", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: C.primary }]} onPress={() => setStep(2)}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: "#000" }]}><ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save & Exit</ThemedText></TouchableOpacity>
              </View>

              {/* Physical store bottom sheet */}
              <BottomSheet C={C} visible={physicalOpen} onClose={() => setPhysicalOpen(false)} title="Business Type">
                {["Yes i have a physical store", "No, i run my business from home"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => { setPhysicalAns(t); setPhysicalOpen(false); }}
                    style={{ height: 54, borderRadius: 12, backgroundColor: "#F6F6F6", alignItems: "flex-start", justifyContent: "center", paddingHorizontal: 16, marginBottom: 10 }}
                  >
                    <ThemedText style={{ color: "#111" }}>{t}</ThemedText>
                  </TouchableOpacity>
                ))}
              </BottomSheet>
            </>
          ) : (
            <>
              <SelectRow C={C} label={address ? "Address added" : "Add Store Address"} onPress={() => setAddrOpen(true)} />
              <SelectRow C={C} label={delivery ? "Delivery pricing set" : "Add Delivery pricing"} onPress={() => setDeliveryOpen(true)} />

              <ThemedText style={{ color: C.text, marginTop: 16 }}>
                Select a color that suits your brand and your store shall be customized as such
              </ThemedText>

              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                {COLORS.map((c) => {
                  const selected = brandColor === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={{ width: 70, height: 70, alignItems: "center", justifyContent: "center" }}
                      onPress={() => { setBrandColor(c); setPrimary(c); }}
                      activeOpacity={0.9}
                    >
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                        {selected && <View style={{ position: "absolute", width: 60, height: 60, borderRadius: 30, borderWidth: 2.5, borderColor: "#000" }} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26 }}>
                <TouchableOpacity onPress={() => setStep(1)} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "#EDEEEF", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGrow, { backgroundColor: C.primary }]}>
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Complete Registration</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Address & Delivery sheets */}
              <BottomSheet C={C} visible={addrOpen} onClose={() => setAddrOpen(false)} title="Store Address">
                <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
                  <TextInput value={address} onChangeText={setAddress} placeholder="Enter store address" placeholderTextColor="#9CA3AF" style={{ flex: 1 }} />
                </View>
              </BottomSheet>
              <BottomSheet C={C} visible={deliveryOpen} onClose={() => setDeliveryOpen(false)} title="Delivery Pricing">
                <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
                  <TextInput value={delivery} onChangeText={setDelivery} placeholder="Enter delivery pricing details" placeholderTextColor="#9CA3AF" style={{ flex: 1 }} />
                </View>
              </BottomSheet>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SHARED BOTTOM SHEET + SUPPORTING COMPONENTS
   ──────────────────────────────────────────────────────────────────────────── */
function BottomSheet({ C, visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetPanel, { backgroundColor: C.card }]}>
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <View style={{ width: 120, height: 8, borderRadius: 999, backgroundColor: "#E5E7EB" }} />
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
            <ThemedText style={{ textAlign: "center", fontWeight: "800", fontSize: 18, color: "#111" }}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.sheetClose}><Ionicons name="close" size={18} color="#111" /></TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

function CategoryPickerSheet({ C, visible, onClose, selected, onApply }) {
  const ALL = ["Electronics", "Phones", "Category 2", "Category 2", "Category 2", "Category 2", "Category 2", "Category 2", "Category 2"];
  const [local, setLocal] = useState(selected || []);
  useEffect(() => { if (visible) setLocal(selected || []); }, [visible, selected]);
  const toggle = (label) => {
    const exists = local.includes(label);
    if (exists) return setLocal(local.filter((x) => x !== label));
    if (local.length >= 5) return;
    setLocal([...local, label]);
  };
  return (
    <BottomSheet C={C} visible={visible} onClose={onClose} title="Select Categories">
      <ThemedText style={{ color: "#6B7280", marginBottom: 12 }}>You can select a maximum of 5 categories</ThemedText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        {local.map((c) => (
          <View key={c} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, backgroundColor: "#FFE7E7" }}>
            <ThemedText style={{ color: C.primary, fontWeight: "800" }}>{c}</ThemedText>
          </View>
        ))}
      </View>
      <ScrollView style={{ maxHeight: 380 }}>
        {ALL.map((label, i) => {
          const s = local.includes(label);
          return (
            <TouchableOpacity
              key={`${label}-${i}`}
              onPress={() => toggle(label)}
              activeOpacity={0.8}
              style={{ height: 54, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, marginBottom: 10, backgroundColor: s ? "#F8F8F8" : "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <ThemedText style={{ color: "#111" }}>{label}</ThemedText>
              <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: s ? C.primary : "#CFCFCF", alignItems: "center", justifyContent: "center", backgroundColor: s ? C.primary : "transparent" }}>
                {s ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity onPress={() => onApply(local)} style={[styles.proceedBtn, { backgroundColor: C.primary, marginTop: 10 }]}>
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Apply</ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}

function ChangePasswordEmailSheet({ C, visible, onClose, onProceed }) {
  return (
    <BottomSheet C={C} visible={visible} onClose={onClose} title="Reset Password">
      <ThemedText style={{ color: "#6B7280", marginBottom: 10 }}>Reset you password via your registered email</ThemedText>
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput placeholder="Enter email address" placeholderTextColor="#9CA3AF" style={{ flex: 1 }} keyboardType="email-address" />
      </View>
      <TouchableOpacity style={[styles.proceedBtn, { backgroundColor: C.primary }]} onPress={onProceed}>
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}
function ChangePasswordCodeSheet({ C, visible, onClose, onProceed }) {
  const [sec, setSec] = useState(59);
  useEffect(() => { if (!visible) return; setSec(59); const t = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000); return () => clearInterval(t); }, [visible]);
  return (
    <BottomSheet C={C} visible={visible} onClose={onClose} title="Reset Password">
      <ThemedText style={{ color: "#6B7280", marginBottom: 10 }}>Enter the code we sent to your email.</ThemedText>
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <TextInput placeholder="Enter Code" placeholderTextColor="#9CA3AF" style={{ flex: 1 }} keyboardType="number-pad" />
        <TouchableOpacity style={styles.pill}><ThemedText style={{ color: C.primary, fontWeight: "800" }}>Paste</ThemedText></TouchableOpacity>
      </View>
      <ThemedText style={{ marginTop: 10 }}>
        You can resend code in <ThemedText style={{ color: C.primary, fontWeight: "800" }}>{`00:${String(sec).padStart(2, "0")}`}</ThemedText>
      </ThemedText>
      <TouchableOpacity style={[styles.proceedBtn, { backgroundColor: C.primary }]} onPress={onProceed}>
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}
function ChangePasswordNewSheet({ C, visible, onClose, onProceed }) {
  const [s1, setS1] = useState(true);
  const [s2, setS2] = useState(true);
  return (
    <BottomSheet C={C} visible={visible} onClose={onClose} title="Reset Password">
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput placeholder="Enter new password" placeholderTextColor="#9CA3AF" secureTextEntry={s1} style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setS1((v) => !v)}><Ionicons name={s1 ? "eye-outline" : "eye-off-outline"} size={20} color="#111" /></TouchableOpacity>
      </View>
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput placeholder="Re-Enter new password" placeholderTextColor="#9CA3AF" secureTextEntry={s2} style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setS2((v) => !v)}><Ionicons name={s2 ? "eye-outline" : "eye-off-outline"} size={20} color="#111" /></TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.proceedBtn, { backgroundColor: C.primary }]} onPress={onProceed}>
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SMALL UI BITS
   ──────────────────────────────────────────────────────────────────────────── */
function InputBox({ C, placeholder, right }) {
  return (
    <View style={[styles.inputBox, { backgroundColor: C.card, borderColor: "#E5E7EB" }]}>
      <TextInput placeholder={placeholder} placeholderTextColor="#9CA3AF" style={{ flex: 1, color: C.text }} />
      {right ?? null}
    </View>
  );
}
const SelectRow = ({ C, label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.inputBox, { backgroundColor: C.card, borderColor: "#E5E7EB" }]}>
    <ThemedText style={{ color: label ? "#111" : "#9CA3AF" }}>{label || "Select"}</ThemedText>
    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);
const ToggleRow = ({ C, label, value, onValueChange }) => (
  <View style={[styles.inputBox, { backgroundColor: C.card, borderColor: "#E5E7EB" }]}>
    <ThemedText style={{ color: C.text }}>{label}</ThemedText>
    <Switch value={value} onValueChange={onValueChange} thumbColor="#fff" trackColor={{ false: "#D1D5DB", true: C.primary }} />
  </View>
);
const VerifyPill = ({ C }) => (
  <TouchableOpacity style={{ height: 30, paddingHorizontal: 12, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.primary + "77", alignItems: "center", justifyContent: "center" }}>
    <ThemedText style={{ color: C.primary, fontWeight: "800", fontSize: 12 }}>Verify</ThemedText>
  </TouchableOpacity>
);

/* ────────────────────────────────────────────────────────────────────────────
   STYLES
   ──────────────────────────────────────────────────────────────────────────── */
const DOT = 36;

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

  longLine: { position: "absolute", top: 0, bottom: 0, width: 2, borderRadius: 999 },
  stepDot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, alignItems: "center", justifyContent: "center" },

  card: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 14,
    shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  percentBubble: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  cta: { height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 16 },

  levelBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  smallStep: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },

  inputBox: {
    height: 54, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
    marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  btnX: { flex: 1, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnGrow: { flex: 1, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  /* bottom-sheet look */
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheetPanel: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "90%" },
  sheetClose: { position: "absolute", right: 12, top: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },

  proceedBtn: { height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 16 },
  pill: { height: 30, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
});
