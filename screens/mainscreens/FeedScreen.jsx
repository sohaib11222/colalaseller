// screens/FeedScreen.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";

/* -------------------- MOCK DATA -------------------- */
const ALL_POSTS = [
  {
    id: "1",
    store: "Sasha Stores",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    location: "Lagos, Nigeria",
    timeAgo: "20 min ago",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
    ],
    caption: "Get this phone at a cheap price for a limited period",
    likes: 500,
    comments: 26,
    shares: 26,
  },
  {
    id: "2",
    store: "Vee Stores",
    avatar:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop",
    location: "Lagos, Nigeria",
    timeAgo: "20 min ago",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    caption: "Weekend discount on accessories only!",
    likes: 128,
    comments: 12,
    shares: 8,
  },
];

// pretend the first item is “mine”
const MY_POSTS = ALL_POSTS.slice(0, 1);

/* -------------------- CREATE POST (full screen) -------------------- */
function CreatePostModal({ visible, onClose, onPost }) {
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme.colors.primary || "#EF534E",
      text: "#101318",
      sub: "#6C727A",
      line: "#E9EBEF",
      card: "#FFFFFF",
      pill: "#F1F2F5",
      bg: "#F7F8FA",
    }),
    [theme]
  );

  const [text, setText] = useState("");
  const [images, setImages] = useState([
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600&auto=format&fit=crop",
  ]);

  // fake gallery thumbs
  const GALLERY = [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526178612928-82a3f1153d44?q=80&w=600&auto=format&fit=crop",
  ];

  const addImage = (uri) => {
    setImages((prev) => (prev.includes(uri) ? prev : [...prev, uri]));
  };
  const removeImage = (uri) => {
    setImages((prev) => prev.filter((u) => u !== uri));
  };



  const submit = () => {
    onPost?.({
      id: String(Date.now()),
      store: "Sasha Stores",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
      location: "Lagos, Nigeria",
      timeAgo: "now",
      images: images.length ? images : undefined,
      image: images.length ? undefined : null,
      caption: text || "Shared a new post",
      likes: 0,
      comments: 0,
      shares: 0,
    });
    onClose?.();
    setText("");
    setImages([]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <View style={[stylesCP.header, { borderBottomColor: C.line }]}>
          <TouchableOpacity onPress={onClose} style={stylesCP.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={[stylesCP.title, { color: C.text }]}>Create Post</ThemedText>
          <TouchableOpacity onPress={submit} style={[stylesCP.postBtn, { backgroundColor: C.primary }]}>
            <ThemedText style={stylesCP.postBtnTxt}>Post</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Composer card */}
          <View style={[stylesCP.card, { borderColor: C.line }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
                }}
                style={stylesCP.avatar}
              />
              <TextInput
                placeholder="What is on your mind"
                placeholderTextColor={C.sub}
                value={text}
                onChangeText={setText}
                multiline
                style={[stylesCP.input, { color: C.text }]}
              />
            </View>

            {/* Selected images grid */}
            {!!images.length && (
              <View style={stylesCP.grid}>
                {images.map((uri) => (
                  <View key={uri} style={stylesCP.gridItem}>
                    <Image source={{ uri }} style={stylesCP.gridImg} />
                    <TouchableOpacity onPress={() => removeImage(uri)} style={[stylesCP.closeChip, { backgroundColor: "#00000088" }]}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Mini gallery row (tap to add) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={[stylesCP.thumbAdd, { borderColor: C.line }]}>
                <Ionicons name="image-outline" size={20} color={C.sub} />
              </TouchableOpacity>
              {GALLERY.map((uri) => (
                <TouchableOpacity key={uri} onPress={() => addImage(uri)}>
                  <Image source={{ uri }} style={stylesCP.thumb} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const stylesCP = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 6, borderRadius: 20 },
  title: { flex: 1, textAlign: "center", fontWeight: "700", fontSize: 16 },
  postBtn: { paddingHorizontal: 14, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  postBtnTxt: { color: "#fff", fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 14, padding: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  input: { flex: 1, minHeight: 38 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "48%", aspectRatio: 1, borderRadius: 12, overflow: "hidden", position: "relative" },
  gridImg: { width: "100%", height: "100%" },
  closeChip: { position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  thumbAdd: { width: 56, height: 56, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  thumb: { width: 56, height: 56, borderRadius: 12 },
});

/* -------------------- FEED HEADER -------------------- */
function FeedHeader({ C }) {
  return (
    <View style={[styles.header, { backgroundColor: C.primary }]}>
      <View style={styles.headerTopRow}>
        <ThemedText font="oleo" style={styles.headerTitle}>Social Feed</ThemedText>
        <View style={styles.headerIcons}>

          <View style={styles.iconRow}>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ChatNavigator", {
                  screen: "Notification",
                })
              }
              style={[styles.iconButton, styles.iconPill]}
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
            >
              <Image
                source={require("../../assets/bell-icon.png")}
                style={styles.iconImg}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search any product, shop or category"
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
        <Ionicons name="camera-outline" size={22} color="#444" style={styles.cameraIcon} />
      </View>
    </View>
  );
}

/* -------------------- POST CARD -------------------- */
function PostCard({ item, onOpenComments, onOpenOptions, C }) {
  const [liked, setLiked] = useState(false);
  const likeCount = liked ? (item.likes || 0) + 1 : item.likes || 0;

  const images = item.images?.length ? item.images : [item.image].filter(Boolean);
  const [activeIdx, setActiveIdx] = useState(0);
  const [carouselW, setCarouselW] = useState(0);

  const onCarouselScroll = (e) => {
    if (!carouselW) return;
    setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / carouselW));
  };

  return (
    <View style={styles.postCard}>
      {/* Top */}
      <View style={styles.postTop}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.storeName}>{item.store}</ThemedText>
          <ThemedText style={styles.metaText}>
            {item.location} · {item.timeAgo}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={() => onOpenOptions(item)}>
          <Ionicons name="ellipsis-vertical" size={18} color="#6C727A" />
        </TouchableOpacity>
      </View>

      {/* Media */}
      {!!images.length && (
        <View style={styles.carouselWrap} onLayout={(e) => setCarouselW(e.nativeEvent.layout.width)}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
          >
            {images.map((uri, idx) => (
              <Image key={`${item.id}-img-${idx}`} source={{ uri }} style={[styles.postImage, { width: carouselW || "100%" }]} />
            ))}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View key={`dot-${i}`} style={[styles.dot, i === activeIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Caption */}
      {item.caption ? (
        <View style={styles.captionPill}>
          <ThemedText style={styles.captionText}>{item.caption}</ThemedText>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setLiked((p) => !p)}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={25} color={liked ? C.primary : "#101318"} />
            <ThemedText style={styles.actionCount}>{likeCount}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenComments(item)}>
            <Ionicons name="chatbubble-outline" size={25} color="#101318" />
            <ThemedText style={styles.actionCount}>{item.comments || 0}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="arrow-redo-outline" size={25} color="#101318" />
            <ThemedText style={styles.actionCount}>{item.shares || 0}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity style={[styles.visitBtn, { backgroundColor: C.primary }]}>
            <ThemedText style={styles.visitBtnText}>Visit Store</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 10 }}>
            <Image source={require("../../assets/DownloadSimple.png")} style={{ width: 30, height: 30 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* -------------------- COMMENTS SHEET (same as your earlier) -------------------- */
function CommentsSheet({ visible, onClose }) {
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const currentUser = {
    name: "Sasha Stores",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
  };
  const [comments, setComments] = useState([
    {
      id: "c1",
      user: "Adam Chris",
      time: "1 min",
      avatar:
        "https://images.unsplash.com/photo-1502767089025-6572583495b0?q=80&w=200&auto=format&fit=crop",
      body: "This product looks really nice, do you deliver nationwide ?",
      likes: 30,
      replies: [
        {
          id: "r1",
          user: currentUser.name,
          time: "1 min",
          avatar: currentUser.avatar,
          body: "We do deliver nationwide.",
          mentionOf: "Adam Chris",
        },
      ],
    },
  ]);

  const startReply = (c) => {
    setReplyTo({ commentId: c.id, username: c.user });
    setText(`@${c.user} `);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const clearReply = () => {
    setReplyTo(null);
    setText("");
    inputRef.current?.focus();
  };
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (replyTo) {
      const newReply = {
        id: `r-${Date.now()}`,
        user: currentUser.name,
        time: "1 min",
        avatar: currentUser.avatar,
        body: trimmed.replace(new RegExp(`^@${replyTo.username}\\s*`), ""),
        mentionOf: replyTo.username,
      };
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyTo.commentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
        )
      );
      setReplyTo(null);
      setText("");
    } else {
      const newComment = {
        id: `c-${Date.now()}`,
        user: currentUser.name,
        time: "1 min",
        avatar: currentUser.avatar,
        body: trimmed,
        likes: 0,
        replies: [],
      };
      setComments((prev) => [...prev, newComment]);
      setText("");
    }
  };

  const ReplyBlock = ({ reply }) => (
    <View style={styles.replyContainer}>
      <Image source={{ uri: reply.avatar }} style={styles.commentAvatar} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ThemedText style={styles.commentName}>{reply.user}</ThemedText>
          <ThemedText style={styles.commentTime}>  {reply.time}</ThemedText>
        </View>
        <ThemedText style={styles.commentBody}>
          {reply.mentionOf ? (
            <>
              <ThemedText style={styles.mentionText}>@{reply.mentionOf} </ThemedText>
              {reply.body}
            </>
          ) : (
            reply.body
          )}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Comments</ThemedText>
            <TouchableOpacity
              style={{ borderColor: "#000", borderWidth: 1.4, borderRadius: 20, padding: 2, alignItems: "center" }}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#101318" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {comments.map((c) => (
              <View key={c.id} style={{ paddingBottom: 4 }}>
                <View style={styles.commentRow}>
                  <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <ThemedText style={styles.commentName}>{c.user}</ThemedText>
                      <ThemedText style={styles.commentTime}>  {c.time}</ThemedText>
                    </View>
                    <ThemedText style={styles.commentBody}>{c.body}</ThemedText>

                    <View style={styles.commentMetaRow}>
                      <TouchableOpacity onPress={() => startReply(c)}>
                        <ThemedText style={styles.replyText}>Reply</ThemedText>
                      </TouchableOpacity>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#101318" />
                        <ThemedText style={styles.commentLikeCount}>  {c.likes}</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {c.replies?.length ? (
                  <View style={styles.repliesWrap}>
                    {c.replies.map((r) => (
                      <ReplyBlock key={r.id} reply={r} />
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          {replyTo ? (
            <View style={styles.replyingChip}>
              <ThemedText style={styles.replyingText}>Replying to {replyTo.username}</ThemedText>
              <TouchableOpacity onPress={clearReply} style={{ padding: 6 }}>
                <Ionicons name="close-circle" size={18} color="#6C727A" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={replyTo ? `Reply to ${replyTo.username}` : "Type a message"}
              placeholderTextColor="#6C727A"
              style={styles.input}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={20} color="#101318" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OptionsSheet({ visible, onClose }) {
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme.colors.primary || "#EF534E",
      text: "#101318",
      sub: "#6C727A",
    }),
    [theme]
  );

  const Row = ({ icon, label, danger, onPress }) => (
    <TouchableOpacity
      style={[styles.optionRow, danger && styles.optionRowDanger]}
      onPress={onPress}
    >
      <View style={styles.optionLeft}>
        {icon}
        <ThemedText style={[styles.optionLabel, danger && { color: C.primary }]}>
          {label}
        </ThemedText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? C.primary : C.sub}
      />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: "#F9F9F9" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Options</ThemedText>
            <TouchableOpacity
              style={{ borderColor: "#000", borderWidth: 1.4, borderRadius: 20, padding: 2 }}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <Row
            icon={<Ionicons name="share-outline" size={20} color={C.text} />}
            label="Share this post"
            onPress={onClose}
          />
          <Row
            icon={<Ionicons name="person-add-outline" size={20} color={C.text} />}
            label="Follow User"
            onPress={onClose}
          />
          <Row
            icon={<Ionicons name="eye-off-outline" size={20} color={C.text} />}
            label="Hide Post"
            onPress={onClose}
          />
          <Row
            icon={<Ionicons name="warning-outline" size={20} color={C.primary} />}
            label="Report Post"
            danger
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}


/* -------------------- MAIN SCREEN -------------------- */
export default function FeedScreen() {
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme.colors.primary || "#EF534E",
      bg: "#F5F6F8",
      card: "#FFFFFF",
      text: "#101318",
      sub: "#6C727A",
      line: "#E9EBEF",
      pill: "#F1F2F5",
    }),
    [theme]
  );

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [tab, setTab] = useState("my"); // 'my' | 'all'
  const [posts, setPosts] = useState(ALL_POSTS);

  const openComments = (post) => {
    setActivePost(post);
    setCommentsVisible(true);
  };
  const openOptions = (post) => {
    setActivePost(post);
    setOptionsVisible(true);
  };

  const data = tab === "my" ? MY_POSTS : posts;

  return (
    <View style={[styles.screen, { backgroundColor: "#fff" }]}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        ListHeaderComponent={
          <>
            <FeedHeader C={C} />

            {/* Tabs under header */}
            <View style={styles.tabsWrap}>
              <TouchableOpacity
                onPress={() => setTab("my")}
                style={[styles.tabBtn, tab === "my" && { backgroundColor: C.primary }]}
              >
                <ThemedText style={[styles.tabTxt, tab === "my" && { color: "#fff" }]}>My Posts</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTab("all")}
                style={[
                  styles.tabBtn,
                  { backgroundColor: "#fff", borderWidth: 1, borderColor: "#EEE" },
                  tab === "all" && { borderColor: C.primary, backgroundColor: C.primary },
                ]}
              >
                <ThemedText style={[styles.tabTxt, { color: tab === "all" ? "#fff" : "#6C727A", }]}>
                  All Posts
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <PostCard item={item} onOpenComments={openComments} onOpenOptions={openOptions} C={C} />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setCreateVisible(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Sheets / Modals */}
      <CommentsSheet visible={commentsVisible} onClose={() => setCommentsVisible(false)} />
      <OptionsSheet visible={optionsVisible} onClose={() => setOptionsVisible(false)} />
      <CreatePostModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onPost={(post) => setPosts((p) => [post, ...p])}
      />
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1 },

  /* Header */
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "600" },
  headerIcons: { flexDirection: "row" },
  icon: { backgroundColor: "#fff", padding: 6, borderRadius: 30, marginLeft: 8 },

  searchContainer: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  cameraIcon: { marginLeft: 8 },

  /* Tabs under header */
  tabsWrap: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 12 },
  tabBtn: { flex: 1, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tabTxt: { fontWeight: "700" },

  /* Post card */
  postCard: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  postTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  storeName: { fontSize: 14, fontWeight: "700", color: "#101318" },
  metaText: { fontSize: 12, color: "#6C727A", marginTop: 2 },

  carouselWrap: { borderRadius: 14, overflow: "hidden", backgroundColor: "#E9EBEF" },
  postImage: { height: 300, resizeMode: "cover", borderTopRightRadius: 30, borderTopLeftRadius: 30 },

  dotsRow: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#bbb", opacity: 0.6 },
  dotActive: { backgroundColor: "#EF534E", opacity: 1, width: 8, height: 8, borderRadius: 4, marginTop: -1 },

  captionPill: { marginTop: 10, backgroundColor: "#F1F2F5", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 15 },
  captionText: { color: "#101318", fontSize: 13 },

  actionsRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionsLeft: { flexDirection: "row", alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  actionCount: { marginLeft: 6, fontSize: 12, color: "#101318" },
  actionsRight: { flexDirection: "row", alignItems: "center" },
  visitBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  visitBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  /* Comments / options shared styles */
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHandle: { alignSelf: "center", width: 68, height: 6, borderRadius: 999, backgroundColor: "#D8DCE2", marginBottom: 6 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#101318" },

  commentRow: { flexDirection: "row", paddingVertical: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentName: { fontWeight: "700", color: "#101318" },
  commentTime: { color: "#6C727A", fontSize: 12 },
  commentBody: { color: "#101318", marginTop: 2 },
  commentMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, justifyContent: "space-between", paddingRight: 14 },
  replyText: { color: "#6C727A" },
  commentLikeCount: { color: "#101318", fontSize: 12 },

  repliesWrap: { marginLeft: 44, marginTop: 6 },
  replyContainer: { flexDirection: "row", marginTop: 10 },
  mentionText: { color: "#EF534E", fontWeight: "600" },

  replyingChip: { alignSelf: "flex-start", marginTop: 8, backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 },
  replyingText: { color: "#6C727A", fontSize: 12 },

  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F2F5", borderRadius: 16, paddingLeft: 14, marginTop: 12, marginBottom: 6 },
  input: { flex: 1, height: 46, fontSize: 14, color: "#101318" },
  sendBtn: { width: 44, height: 46, alignItems: "center", justifyContent: "center" },

  /* FAB */
  fab: {
    position: "absolute",
    right: 18,
    bottom: 85,
    width: 56,
    height: 56,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
   iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
});
