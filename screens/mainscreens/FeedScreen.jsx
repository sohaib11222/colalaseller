import React, { useMemo, useRef, useState, useEffect } from "react";
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
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";
import { STATIC_COLORS } from "../../components/ThemeProvider";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_DOMAIN } from "../../apiConfig";
import { getToken } from "../../utils/tokenStorage";

import * as PostQueries from "../../utils/queries/posts"; // getPosts, getPostComments
import * as PostMutations from "../../utils/mutations/posts"; // createPost, updatePost, deletePost, likePost, addComment
import { StatusBar } from "expo-status-bar";

/* -------------------- HELPERS -------------------- */
const absUrl = (maybePath) =>
  !maybePath
    ? null
    : maybePath.startsWith("http")
      ? maybePath
      : `${API_DOMAIN.replace(/\/api$/, "")}${maybePath.startsWith("/") ? "" : "/"
      }${maybePath}`;

const timeAgo = (iso) => {
  if (!iso) return "now";
  const s = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  );
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const FALLBACK_AVATAR = require("../../assets/Ellipse 18.png");
const src = (v) => {
  if (typeof v === "number") return v;
  if (v && v !== null && v !== undefined) {
    return { uri: String(v) };
  }
  return FALLBACK_AVATAR;
};

const extFromUri = (uri = "") => {
  const path = uri.split("?")[0];
  const m = path.match(/\.(png|jpe?g|webp|gif|mp4|mov)$/i);
  return m ? m[1].toLowerCase() : "jpg"; // default to jpg
};

const safeFilename = (postId, ext) =>
  `post_${String(postId || "unknown")}_${Date.now()}.${ext}`;



const addQuery = (url, kv) => {
  const [base, qs] = url.split("?");
  const search = new URLSearchParams(qs || "");
  Object.entries(kv).forEach(([k, v]) => search.set(k, String(v)));
  return `${base}?${search.toString()}`;
};

const mapPost = (p) => {
  const storeName = p?.user?.store?.store_name || p?.user?.full_name || "Store";
  const avatar = absUrl(p?.user?.profile_picture) || null;
  const ver = p?.updated_at ? new Date(p.updated_at).getTime() : Date.now();

  // Handle both old and new API response structures
  const mediaUrls = p?.media_urls || p?.media || [];
  const images = mediaUrls
    .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
    .map((m) => {
      const url = m.url || m.path; // Handle both url and path fields
      const u = absUrl(url);
      return u ? addQuery(u, { v: ver }) : null;
    })
    .filter(Boolean);

  return {
    id: String(p.id),
    store: storeName,
    avatar,
    location: "Lagos, Nigeria", // not in API → hardcoded
    timeAgo: timeAgo(p.created_at),
    images: images.length ? images : [],
    image: null, // Always null to avoid confusion
    caption: p.body,
    likes: p.likes_count ?? 0,
    comments: p.comments_count ?? 0,
    shares: p.shares_count ?? 0,
    is_liked: !!p.is_liked,
    _raw: p,
  };
};

/* -------------------- CREATE/EDIT POST (shared) -------------------- */
function CreatePostModal({
  visible,
  onClose,
  onSubmit,
  mode = "create", // "create" | "edit"
  initialCaption = "",
  initialImageUrls = [], // array of absolute URLs
  headerAvatar = null, // optional avatar/url to display in modal header
}) {
  // const { theme } = useTheme();
  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors.primary || "#EF534E",
  //     text: "#101318",
  //     sub: "#6C727A",
  //     line: "#E9EBEF",
  //   }),
  //   [theme]
  // );
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };
  // existing images from server (URLs)
  const [existingUrls, setExistingUrls] = useState(initialImageUrls);
  // newly picked files
  const [newFiles, setNewFiles] = useState([]);
  const [text, setText] = useState(initialCaption || "");

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow photo library access to attach images."
        );
      }
    })();
  }, [visible]);

  // useEffect(() => {
  //   // hydrate when opening edit
  //   if (visible) {
  //     setText(initialCaption || "");
  //     setExistingUrls(initialImageUrls || []);
  //     setNewFiles([]);
  //   }
  // }, [visible, initialCaption, initialImageUrls]);
  useEffect(() => {
    if (!visible) return;
    // Only (re)hydrate when the modal is shown or mode flips create<->edit
    setText(mode === "edit" ? initialCaption || "" : "");
    setExistingUrls(Array.isArray(initialImageUrls) ? initialImageUrls : []);
    setNewFiles([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mode]);

  const pickImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (res.canceled) return;
      const assets = res.assets || [];
      setNewFiles((prev) => [
        ...prev,
        ...assets
          .filter((a) => a.uri)
          .map((a, idx) => ({
            uri: a.uri,
            name: a.fileName || `photo_${Date.now()}_${idx}.jpg`,
            type: a.mimeType || "image/jpeg",
          })),
      ]);
    } catch (e) {
      console.log("pick error", e);
    }
  };

  const removeExistingUrl = (url) =>
    setExistingUrls((prev) => prev.filter((u) => u !== url));

  const removeNewFile = (uri) =>
    setNewFiles((prev) => prev.filter((f) => f.uri !== uri));

  const previews = [
    ...existingUrls.map((u) => ({ kind: "url", key: u, uri: u })),
    ...newFiles.map((f) => ({ kind: "file", key: f.uri, uri: f.uri })),
  ];

  const submit = () => {
    onSubmit?.({
      body: text || "Shared a new post",
      newFiles, // files to upload
      keptUrls: existingUrls, // URLs the user kept
      removedUrls: (initialImageUrls || []).filter(
        (u) => !existingUrls.includes(u)
      ),
    });
    // reset local when closing
    setNewFiles([]);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        {/* Header */}
        <View style={[stylesCP.header, { borderBottomColor: C.line }]}>
          <TouchableOpacity onPress={onClose} style={stylesCP.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={[stylesCP.title, { color: C.text }]}>
            {mode === "edit" ? "Edit Post" : "Create Post"}
          </ThemedText>
          <TouchableOpacity
            onPress={submit}
            style={[stylesCP.postBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={stylesCP.postBtnTxt}>
              {mode === "edit" ? "Save" : "Post"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={[stylesCP.card, { borderColor: C.line }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
            <Image
              source={src(headerAvatar)}
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

            {!!previews.length && (
              <View style={stylesCP.grid}>
                {previews.map((p) => (
                  <View key={p.key} style={stylesCP.gridItem}>
                    <Image source={{ uri: p.uri }} style={stylesCP.gridImg} />
                    <TouchableOpacity
                      onPress={() =>
                        p.kind === "url"
                          ? removeExistingUrl(p.uri)
                          : removeNewFile(p.uri)
                      }
                      style={[
                        stylesCP.closeChip,
                        { backgroundColor: "#00000088" },
                      ]}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
          >
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[stylesCP.thumbAdd, { borderColor: C.line }]}
                onPress={pickImages}
              >
                <Ionicons name="image-outline" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* -------------------- FEED HEADER -------------------- */
function FeedHeader({ C, onNotificationPress, searchQuery, onChangeSearch }) {
  return (
    <View style={[styles.header, { backgroundColor: C.primary }]}>
      <View style={styles.headerTopRow}>
        <ThemedText font="oleo" style={styles.headerTitle}>
          Social Feed
        </ThemedText>
        <View style={styles.headerIcons}>
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={[styles.iconButton, styles.iconPill]}
              onPress={onNotificationPress} // ✅ use prop
            >
              <Image
                source={require("../../assets/bell-icon.png")}
                style={styles.iconImg}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search any product, shop or category"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onChangeSearch}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

/* -------------------- POST CARD -------------------- */
function PostCard({ item, onOpenComments, onOpenOptions, onToggleLike, onDownload, C }) {
  const [liked, setLiked] = useState(!!item.is_liked);
  const [showFullCaption, setShowFullCaption] = useState(false);
  useEffect(() => setLiked(!!item.is_liked), [item.is_liked]);

  const likeCount = liked
    ? (item.likes || 0) + (item.is_liked ? 0 : 1)
    : item.likes || 0;
  const images = item.images || [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [carouselW, setCarouselW] = useState(0);
  
  // Caption handling
  const caption = item.caption || "";
  const shouldTruncate = caption.length > 100;
  const displayCaption = showFullCaption || !shouldTruncate ? caption : caption.substring(0, 100) + "...";

  const onCarouselScroll = (e) => {
    if (!carouselW) return;
    setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / carouselW));
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postTop}>
        {/* <Image source={{ uri: item.avatar }} style={styles.avatar} /> */}
        <Image source={src(item.avatar)} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.storeName}>{item.store}</ThemedText>
          <ThemedText style={styles.metaText}>
            {item.location} • {item.timeAgo}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={() => onOpenOptions(item)}>
          <Ionicons name="ellipsis-vertical" size={18} color="#6C727A" />
        </TouchableOpacity>
      </View>

      {!!images.length && (
        <View
          style={styles.carouselWrap}
          onLayout={(e) => setCarouselW(e.nativeEvent.layout.width)}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
          >
            {images.map((uri, idx) => (
              <Image
                key={`${item.id}-${idx}-${uri}`} // <- include uri in key
                source={{ uri }}
                style={[styles.postImage, { width: carouselW || "100%" }]}
              />
            ))}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={[styles.dot, i === activeIdx && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {caption ? (
        <View style={styles.captionPill}>
          <ThemedText style={styles.captionText}>{displayCaption}</ThemedText>
          {shouldTruncate && (
            <TouchableOpacity
              onPress={() => setShowFullCaption(!showFullCaption)}
              style={{ marginTop: 4 }}
            >
              <ThemedText style={[styles.captionText, { color: C.primary, fontWeight: "600" }]}>
                {showFullCaption ? "Read less" : "Read more"}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              setLiked((p) => !p);
              onToggleLike?.(item.id);
            }}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={25}
              color={liked ? C.primary : "#101318"}
            />
            <ThemedText style={styles.actionCount}>{likeCount}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onOpenComments(item)}
          >
            <Ionicons name="chatbubble-outline" size={25} color="#101318" />
            <ThemedText style={styles.actionCount}>
              {item.comments || 0}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              Alert.alert(
                "Not available in development",
                "This feature will only work in the live application.",
                [{ text: "OK" }]
              )
            }
          >
            <Ionicons name="arrow-redo-outline" size={25} color="#101318" />
            <ThemedText style={styles.actionCount}>
              {item.shares || 0}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={{ marginLeft: 10, opacity: images.length ? 1 : 0.4 }}
            disabled={!images.length}
            onPress={() => {
              const uri = images[activeIdx]; // download the visible one
              onDownload?.(uri, item.id);
            }}
          >
            <Image
              source={require("../../assets/DownloadSimple.png")}
              style={{ width: 30, height: 30 }}
            />
          </TouchableOpacity>        </View>
      </View>
    </View>
  );
}

/* -------------------- COMMENTS (API-WIRED) -------------------- */
function CommentsSheet({ visible, onClose, postId }) {
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["post", "comments", postId],
    queryFn: async () => {
      const token = await getToken();
      const res = await PostQueries.getPostComments(postId, token);
      return res?.data;
    },
    enabled: !!postId && visible,
  });

  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async ({ body, parent_id }) => {
      const token = await getToken();
      return PostMutations.addComment(
        postId,
        { body, ...(parent_id ? { parent_id } : {}) },
        token
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", "comments", postId] });
      qc.invalidateQueries({ queryKey: ["posts", "lists"] });
    },
  });

  const comments = (data?.data || []).map((c) => ({
    id: c.id,
    body: c.body,
    time: timeAgo(c.created_at),
    user: c.user?.full_name || "User",
    // avatar: absUrl(c.user?.profile_picture) || "https://via.placeholder.com/56",
    avatar: absUrl(c.user?.profile_picture) || null,
    replies: c.replies || [],
    _raw: c,
  }));

  const startReply = (c) => {
    setReplyTo({ id: c.id, username: c.user });
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
    const body = replyTo
      ? trimmed.replace(new RegExp(`^@${replyTo.username}\\s*`), "")
      : trimmed;
    add.mutate({ body, parent_id: replyTo?.id });
    setReplyTo(null);
    setText("");
  };

  const ReplyBlock = ({ reply }) => (
    <View style={styles.replyContainer}>
      <Image
        source={src(absUrl(reply.user?.profile_picture))}
        style={styles.commentAvatar}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ThemedText style={styles.commentName}>
            {reply.user?.full_name || "User"}
          </ThemedText>
          <ThemedText style={styles.commentTime}>
            {" "}
            {timeAgo(reply.created_at)}
          </ThemedText>
        </View>
        <ThemedText style={styles.commentBody}>{reply.body}</ThemedText>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Comments</ThemedText>
            <TouchableOpacity
              style={{
                borderColor: "#000",
                borderWidth: 1.4,
                borderRadius: 20,
                padding: 2,
                alignItems: "center",
              }}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#101318" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <ThemedText>Loading…</ThemedText>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={{ paddingBottom: 4 }}>
                  <View style={styles.commentRow}>
                    {/* <Image
                      source={{ uri: c.avatar }}
                      style={styles.commentAvatar}
                    /> */}
                    <Image source={src(c.avatar)} style={styles.commentAvatar} />
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ThemedText style={styles.commentName}>
                          {c.user}
                        </ThemedText>
                        <ThemedText style={styles.commentTime}>
                          {" "}
                          {c.time}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.commentBody}>
                        {c.body}
                      </ThemedText>

                      <View style={styles.commentMetaRow}>
                        <TouchableOpacity onPress={() => startReply(c)}>
                          <ThemedText style={styles.replyText}>
                            Reply
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {!!c.replies?.length && (
                    <View style={styles.repliesWrap}>
                      {c.replies.map((r) => (
                        <ReplyBlock key={r.id} reply={r} />
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          {replyTo ? (
            <View style={styles.replyingChip}>
              <ThemedText style={styles.replyingText}>
                Replying to {replyTo.username}
              </ThemedText>
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
              placeholder={
                replyTo ? `Reply to ${replyTo.username}` : "Type a message"
              }
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

/* -------------------- OPTIONS SHEETS -------------------- */
function OptionsSheetAll({ visible, onClose, onHidePost }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: "#F9F9F9" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={styles.sheetTitle}>
              Options
            </ThemedText>
            <TouchableOpacity
              style={{
                borderColor: "#000",
                borderWidth: 1.4,
                borderRadius: 20,
                padding: 2,
              }}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#101318" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              Alert.alert(
                "Not available in development",
                "This feature will only work in the live application.",
                [{ text: "OK" }]
              );
              onClose?.();
            }}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="share-outline" size={20} color="#101318" />
              <ThemedText style={styles.optionLabel}>
                Share this post
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6C727A" />
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="person-add-outline" size={20} color="#101318" />
              <ThemedText style={styles.optionLabel}>Follow User</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6C727A" />
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              onHidePost?.();
              onClose?.();
            }}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="grid-outline" size={20} color="#101318" />
              <ThemedText style={styles.optionLabel}>Hide Post</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6C727A" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionRow, styles.optionRowDanger]}>
            <View style={styles.optionLeft}>
              <Ionicons name="warning-outline" size={20} color="#EF534E" />
              <ThemedText style={[styles.optionLabel, { color: "#EF534E" }]}>
                Report Post
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF534E" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function OptionsSheetMine({ visible, onClose, onEditPost, onDeletePost }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: "#F9F9F9" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={styles.sheetTitle}>
              Options
            </ThemedText>
            <TouchableOpacity
              style={{
                borderColor: "#000",
                borderWidth: 1.4,
                borderRadius: 20,
                padding: 2,
              }}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#101318" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              Alert.alert(
                "Not available in development",
                "This feature will only work in the live application.",
                [{ text: "OK" }]
              );
              onClose?.();
            }}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="share-outline" size={20} color="#101318" />
              <ThemedText style={styles.optionLabel}>
                Share this post
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6C727A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={onEditPost}>
            <View style={styles.optionLeft}>
              <Ionicons name="pencil-outline" size={20} color="#101318" />
              <ThemedText style={styles.optionLabel}>Edit Post</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6C727A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, styles.optionRowDanger]}
            onPress={onDeletePost}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="trash-outline" size={20} color="#EF534E" />
              <ThemedText style={[styles.optionLabel, { color: "#EF534E" }]}>
                Delete Post
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF534E" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------- DATA HOOKS (in this file) -------------------- */
function useAllAndMyPosts() {
  return useQuery({
    queryKey: ["posts", "lists"],
    queryFn: async () => {
      const token = await getToken();
      const res = await PostQueries.getPosts(token);
      const posts = (res?.data?.posts?.data || []).map(mapPost);
      const myPosts = (res?.data?.myPosts?.data || []).map(mapPost);
      return { posts, myPosts };
    },
    staleTime: 30_000,
  });
}

function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, files = [], visibility = "public" }) => {
      const token = await getToken();
      const fd = new FormData();
      fd.append("body", body);
      fd.append("visibility", visibility);
      files.forEach((f) => fd.append("media[]", f));
      return PostMutations.createPost(fd, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts", "lists"] }),
  });
}

function useUpdatePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body, files = [], visibility = "public", keptUrls = [], removedUrls = [] }) => {
      const token = await getToken();
      const fd = new FormData();
      if (body != null) fd.append("body", String(body));
      fd.append("visibility", String(visibility));
      
      // Add new files
      files.forEach((f) => fd.append("media[]", f));
      
      // Add kept URLs (existing media to keep)
      keptUrls.forEach((url) => fd.append("kept_media[]", url));
      
      // Add removed URLs (existing media to remove)
      removedUrls.forEach((url) => fd.append("removed_media[]", url));
      
      return PostMutations.updatePost(id, fd, token);
    },
    onSuccess: (res, vars) => {
      // 1) Map the updated post from server
      const updatedRaw = res?.data?.data;
      const updated = updatedRaw ? mapPost(updatedRaw) : null;
      if (!updated) {
        // fallback: still refetch if something is off
        qc.invalidateQueries({ queryKey: ["posts", "lists"] });
        return;
      }

      // 2) Patch cache immediately so UI swaps to the new media_urls
      qc.setQueryData(["posts", "lists"], (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        const replace = (arr) =>
          Array.isArray(arr)
            ? arr.map((p) => (p.id === String(vars.id) ? updated : p))
            : [];
        return {
          posts: replace(prev.posts),
          myPosts: replace(prev.myPosts),
        };
      });
    },
    onSettled: () => {
      // keep server as source of truth
      qc.invalidateQueries({ queryKey: ["posts", "lists"] });
    },
  });
}

function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      return PostMutations.deletePost(id, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts", "lists"] }),
  });
}

function useToggleLikeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      const token = await getToken();
      return PostMutations.likePost(postId, token);
    },
    onMutate: async ({ postId }) => {
      await qc.cancelQueries({ queryKey: ["posts", "lists"] });
      const prev = qc.getQueryData(["posts", "lists"]);
      if (prev) {
        const bump = (arr = []) =>
          arr.map((p) =>
            p.id === String(postId)
              ? {
                  ...p,
                  is_liked: !p.is_liked,
                  likes: (p.likes || 0) + (p.is_liked ? -1 : 1),
                }
              : p
          );
        qc.setQueryData(["posts", "lists"], {
          posts: bump(prev.posts),
          myPosts: bump(prev.myPosts),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx?.prev && qc.setQueryData(["posts", "lists"], ctx.prev),
    // Note: intentionally avoid invalidating/refetching here to prevent image reloading
  });
}

/* -------------------- MAIN SCREEN -------------------- */
export default function FeedScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();

  // Handle navigation safely
  const handleNotificationPress = () => {
    try {
      console.log("FeedScreen - handleNotificationPress called");
      console.log("FeedScreen - navigation:", navigation);
      if (navigation && navigation.navigate) {
        console.log("FeedScreen - navigating to Notification");
        // Navigate to ChatNavigator first, then to Notification screen
        navigation.navigate("ChatNavigator", { screen: "Notification" });
      } else {
        console.warn("Navigation not available");
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Debug logging
  console.log("FeedScreen - navigation object:", navigation);
  console.log("FeedScreen - navigation type:", typeof navigation);
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };
  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors.primary || "#EF534E",
  //     bg: "#F5F6F8",
  //     card: "#FFFFFF",
  //     text: "#101318",
  //     sub: "#6C727A",
  //     line: "#E9EBEF",
  //     pill: "#F1F2F5",
  //   }),
  //   [theme]
  // );
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDownload = async (uri, postId) => {
    try {
      if (!uri) {
        Alert.alert("Nothing to download", "This post has no media.");
        return;
      }

      // 1) Photos permission
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow Photos permission to save images."
        );
        return;
      }

      setIsDownloading(true);

      // 2) Pick a local filename
      const ext = extFromUri(uri);
      const local = FileSystem.documentDirectory + safeFilename(postId, ext);

      // 3) Download to local file
      const { uri: localUri, status } = await FileSystem.downloadAsync(uri, local);
      if (status !== 200) {
        throw new Error(`Download failed with status ${status}`);
      }

      // 4) Save to gallery (create album once)
      const asset = await MediaLibrary.createAssetAsync(localUri);
      // Change "SocialFeed" to your app/brand name
      await MediaLibrary.createAlbumAsync("SocialFeed", asset, false);

      Alert.alert("Saved", "Image saved to your gallery.");
    } catch (e) {
      // 🔎 Robust error messages for common cases
      const msg = String(e?.message || e);
      if (/cleartext/i.test(msg) || /CLEARTEXT/i.test(msg)) {
        Alert.alert(
          "Blocked: HTTP image",
          "Android blocks non-HTTPS downloads by default. Serve media over HTTPS or enable cleartext traffic for dev."
        );
      } else if (/Network request failed/i.test(msg)) {
        Alert.alert(
          "Network error",
          "Could not reach the file URL. Check the link or your connection."
        );
      } else if (/denied/i.test(msg) || /not granted/i.test(msg)) {
        Alert.alert(
          "Permission denied",
          "Photos permission is required to save images."
        );
      } else {
        Alert.alert("Download failed", msg);
      }
      console.log("download error:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [tab, setTab] = useState("my"); // 'my' | 'all'
  const [refreshing, setRefreshing] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());

  const { data, isLoading, error, refetch } = useAllAndMyPosts();
  const create = useCreatePost();
  const update = useUpdatePost();
  const remove = useDeletePost();
  const likeMut = useToggleLikeMutation();

  const posts = data?.posts || [];
  const myPosts = data?.myPosts || [];
  const rawList = tab === "my" ? myPosts : posts;
  const listData = rawList
    .filter((p) => !hiddenPostIds.has(String(p.id)))
    .filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const inCaption = (p.caption || "").toLowerCase().includes(q);
      const inStore = (p.store || "").toLowerCase().includes(q);
      return inCaption || inStore;
    });
  const isActivePostMine = useMemo(
    () => (activePost ? myPosts.some((p) => String(p.id) === String(activePost.id)) : false),
    [activePost, myPosts]
  );

  const openComments = (post) => {
    setActivePost(post);
    setCommentsVisible(true);
  };
  const openOptions = (post) => {
    setActivePost(post);
    setOptionsVisible(true);
  };

  const handleHidePost = () => {
    if (!activePost) return;
    setHiddenPostIds((prev) => new Set(prev).add(String(activePost.id)));
    setOptionsVisible(false);
  };

  const handleToggleLike = (postId) => likeMut.mutate({ postId });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing feed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeletePost = async () => {
    setOptionsVisible(false);
    if (!activePost) return;
    await remove.mutateAsync(activePost.id);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ThemedText>Loading…</ThemedText>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ThemedText>Error: {error.message}</ThemedText>
      </View>
    );
  }

  // helper to extract current server images from a post for edit modal
  const getPostImageUrls = (p) => p?.images || [];

  return (
    <View style={[styles.screen, { backgroundColor: "#fff" }]}>
     <StatusBar style="light" />
      <FlatList
        data={listData}
        extraData={listData}
        keyExtractor={(it) => `${it.id}-${it._raw?.updated_at || ""}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
            title="Pull to refresh"
            titleColor={C.sub}
          />
        }
        ListHeaderComponent={
          <>
            <FeedHeader
              C={C}
              onNotificationPress={handleNotificationPress}
              searchQuery={searchQuery}
              onChangeSearch={setSearchQuery}
            />
            <View style={styles.tabsWrap}>
              <TouchableOpacity
                onPress={() => setTab("my")}
                style={[
                  styles.tabBtn,
                  tab === "my" && { backgroundColor: C.primary },
                ]}
              >
                <ThemedText
                  style={[styles.tabTxt, tab === "my" && { color: "#fff" }]}
                >
                  My Posts
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTab("all")}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#EEE",
                  },
                  tab === "all" && {
                    borderColor: C.primary,
                    backgroundColor: C.primary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.tabTxt,
                    { color: tab === "all" ? "#fff" : "#6C727A" },
                  ]}
                >
                  All Posts
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                Loading posts...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color={C.sub} />
              <ThemedText style={[styles.emptyText, { color: C.sub }]}>
                No posts found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: C.sub }]}>
                Pull down to refresh
              </ThemedText>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            onOpenComments={openComments}
            onOpenOptions={openOptions}
            onToggleLike={handleToggleLike}
            onDownload={handleDownload}
            C={C}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }]}
        onPress={() => setCreateVisible(true)}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Comments */}
      <CommentsSheet
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        postId={activePost?.id}
      />

      {/* Options: show Mine sheet if the post belongs to current user */}
      {isActivePostMine ? (
        <OptionsSheetMine
          visible={optionsVisible}
          onClose={() => setOptionsVisible(false)}
          onEditPost={() => {
            setOptionsVisible(false);
            setEditVisible(true);
          }}
          onDeletePost={handleDeletePost}
        />
      ) : (
        <OptionsSheetAll
          visible={optionsVisible}
          onClose={() => setOptionsVisible(false)}
          onHidePost={handleHidePost}
        />
      )}

      {/* Create (new) */}
      <CreatePostModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        mode="create"
        onSubmit={async ({ body, newFiles }) => {
          await create.mutateAsync({ body, files: newFiles });
          setCreateVisible(false);
        }}
      />

      {/* Edit (same modal UI) */}
      <CreatePostModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        mode="edit"
        initialCaption={activePost?.caption}
        initialImageUrls={getPostImageUrls(activePost)}
        headerAvatar={activePost?.avatar}
        onSubmit={async ({ body, newFiles, keptUrls, removedUrls }) => {
          const res = await update.mutateAsync({
            id: activePost.id,
            body,
            files: newFiles,
            keptUrls: keptUrls || [],
            removedUrls: removedUrls || [],
          });
          const updated = res?.data?.data ? mapPost(res.data.data) : null;
          if (updated) {
            setActivePost(updated);
          }
          setEditVisible(false);
        }}
      />
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  headerIcons: { flexDirection: "row" },
  icon: {
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 30,
    marginLeft: 8,
  },

  searchContainer: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    height: 60,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },

  tabsWrap: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  tabBtn: {
    flex: 1,
    height: 42,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTxt: { fontWeight: "700", fontSize: 10 },

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
  avatar: { width: 55, height: 55, borderRadius: 40, marginRight: 10 },
  storeName: { fontSize: 14, fontWeight: "400", color: "#000" },
  metaText: { fontSize: 10, color: "#000000B2", marginTop: 2 },

  carouselWrap: { borderRadius: 14, overflow: "hidden" },
  postImage: {
    height: 390,
    borderRadius: 10,
    resizeMode: "cover",
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
  },

  dotsRow: { marginTop: 8, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#bbb",
    opacity: 0.6,
  },
  dotActive: {
    backgroundColor: "#EF534E",
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -1,
  },

  captionPill: {
    marginTop: 10,
    backgroundColor: "#F1F2F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  captionText: { color: "#000", fontSize: 12 },

  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: { flexDirection: "row", alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  actionCount: { marginLeft: 6, fontSize: 12, color: "#101318" },
  actionsRight: { flexDirection: "row", alignItems: "center" },
  visitBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  visitBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 68,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D8DCE2",
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginLeft: 160,
  },

  optionRow: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent: "space-between",
    elevation: 1,
  },
  optionRowDanger: { backgroundColor: "#FFF8F8" },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionLabel: { fontSize: 15, color: "#000" },

  commentRow: { flexDirection: "row", paddingVertical: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentName: { fontWeight: "700", color: "#101318" },
  commentTime: { color: "#6C727A", fontSize: 12 },
  commentBody: { color: "#101318", marginTop: 2 },
  commentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "space-between",
    paddingRight: 14,
  },

  repliesWrap: { marginLeft: 44, marginTop: 6 },
  replyContainer: { flexDirection: "row", marginTop: 10 },

  replyingChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replyingText: { color: "#6C727A", fontSize: 12 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F2F5",
    borderRadius: 16,
    paddingLeft: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  input: { flex: 1, height: 46, fontSize: 14, color: "#101318" },
  sendBtn: {
    width: 44,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },

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
  iconImg: { width: 22, height: 22, resizeMode: "contain" },

  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});

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
  postBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnTxt: { color: "#fff", fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 14, padding: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  input: { flex: 1, minHeight: 38 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  gridImg: { width: "100%", height: "100%" },
  closeChip: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbAdd: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
