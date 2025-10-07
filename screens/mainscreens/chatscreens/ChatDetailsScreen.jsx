import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ThemedText from '../../../components/ThemedText';
import { useTheme } from '../../../components/ThemeProvider';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getToken } from '../../../utils/tokenStorage';
import * as ChatQueries from '../../../utils/queries/chats';      // getChatDetails(chatId, token)
import * as ChatMutations from '../../../utils/mutations/chats';  // sendMessage(chatId, payload|FormData, token)
import { API_DOMAIN } from '../../../apiConfig';

// ---------- debug helper ----------
const D = (...args) => console.log('[ChatDetails]', ...args);

/* ---------- helpers ---------- */
const toSrc = (v) => (typeof v === 'number' ? v : v ? { uri: String(v) } : undefined);
const absUrl = (maybePath) =>
  !maybePath
    ? null
    : maybePath.startsWith('http')
    ? maybePath
    : `${API_DOMAIN.replace(/\/api$/, '')}${maybePath.startsWith('/') ? '' : '/'}${maybePath}`;

const formatClock = (iso) => {
  if (!iso) return '07:22AM'; // not in response → keep hardcoded when missing
  try {
    const d = new Date(iso);
    let h = d.getHours();
    const m = `${d.getMinutes()}`.padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = ((h + 11) % 12) + 1;
    return `${h}:${m}${ampm}`;
  } catch {
    return '07:22AM';
  }
};

// Map API message -> UI bubble
const mapMsg = (m) => ({
  id: String(m?.id ?? `${m?.created_at ?? ''}-${Math.random()}`),
  text: m?.message ?? '',                                  // API key is "message"
  sender: m?.sender_type === 'store' ? 'me' : 'store',     // store == me (seller)
  time: formatClock(m?.created_at),                        // if missing -> hardcoded
  attachment: m?.attachment || m?.image || null,           // handle both field names
});

/* ---------- Cart summary (renders ONLY if cart prop is provided) ---------- */
function CartSummaryCard({ C, cart }) {
  if (!cart) return null;

  // Expecting something like:
  // {
  //   items: [{ id, title, price, qty, image }, ...],
  //   total: "₦..."
  // }
  const items = Array.isArray(cart.items) ? cart.items : [];

  return (
    <View style={[styles.cartWrap, { borderColor: C.primary + '55', backgroundColor: '#FFF1F1' }]}>
      <View style={styles.cartHeaderRow}>
        <ThemedText style={[styles.cartHeaderText, { color: C.text }]}>
          Items in cart ({items.length})
        </ThemedText>
        <ThemedText style={[styles.cartTotal, { color: C.primary }]}>
          {cart.total ?? ''}
        </ThemedText>
      </View>

      {items.map((it, idx) => (
        <View key={String(it?.id ?? idx)} style={[styles.cartItemRow, { backgroundColor: '#FFE6E6' }]}>
          <Image source={toSrc(it?.image)} style={styles.cartThumb} />
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.cartTitle, { color: C.text }]} numberOfLines={1}>
              {it?.title ?? ''}
            </ThemedText>
            <ThemedText style={[styles.cartPrice, { color: C.primary }]}>
              {it?.price ?? ''}
            </ThemedText>
          </View>
          <ThemedText style={[styles.cartQty, { color: C.text }]}>
            {typeof it?.qty === 'number' ? `Qty : ${it.qty}` : ''}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function ChatDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const qc = useQueryClient();

  const C = useMemo(
    () => ({
      primary: theme?.colors?.primary || '#E53E3E',
      bg: theme?.colors?.background || '#F5F6F8',
      card: '#FFFFFF',
      text: theme?.colors?.text || '#101318',
      sub: '#6C727A',
      lightPink: '#FCDCDC',
    }),
    [theme]
  );

  const chatId = params?.chat_id;
  const routeStore = params?.store || {};

  const [headerH, setHeaderH] = useState(0);
  const [messages, setMessages] = useState([]); // hydrated from API
  const [inputText, setInputText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const listRef = useRef(null);
  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', scrollToEnd);
    const b = Keyboard.addListener('keyboardDidHide', scrollToEnd);
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  console.log("chatId", chatId);
  /* ---------------- Fetch details (robust unwrap + logs) ---------------- */
  const { data: detail, error: detailErr, isLoading: detailLoading } = useQuery({
    queryKey: ['chat', 'detail', chatId],
    enabled: !!chatId,
    queryFn: async () => {
      D('fetch detail:start', { chatId });
      const token = await getToken();
      const res = await ChatQueries.getChatDetails(chatId, token);
      try {
        D('fetch detail:raw (short)', {
          hasData: !!res?.data,
          keys: res ? Object.keys(res || {}) : null,
          dataKeys: res?.data ? Object.keys(res.data || {}) : null,
        });
        const preview = JSON.stringify(res?.data ?? res).slice(0, 1500);
        D('fetch detail:raw preview', preview);
      } catch {}

      // Accept res | res.data | res.data.data
      const root = res?.data?.data ?? res?.data ?? res ?? {};
      const payload = {
        messages: Array.isArray(root?.messages)
          ? root.messages
          : Array.isArray(root?.data?.messages)
          ? root.data.messages
          : [],
        user: root?.user ?? root?.data?.user ?? null,
        dispute: root?.dispute ?? root?.data?.dispute ?? null,

        // NEW: try to find cart in common places, else undefined → component won’t render
        cart:
          root?.cart ??
          root?.data?.cart ??
          undefined,
      };
      D('fetch detail:unwrapped', {
        msgCount: payload.messages.length,
        hasUser: !!payload.user,
        hasDispute: !!payload.dispute,
        hasCart: !!payload.cart,
      });
      return payload;
    },
    staleTime: 10_000,
  });

  // hydrate messages when fetched
  useEffect(() => {
    if (!detailLoading) {
      const mapped = (detail?.messages || []).map(mapMsg);
      D('hydrate messages: mapped', { count: mapped.length, sample: mapped[0] });
      setMessages(mapped);
    }
  }, [detail?.messages, detailLoading]);

  if (detailErr) {
    D('fetch detail:error', detailErr);
  }

  // prefer avatar/name from route; if missing, take from details.user
  const fallbackName =
    routeStore?.name ||
    detail?.user?.full_name ||
    detail?.user?.user_name ||
    'Store';
  const fallbackAvatar =
    routeStore?.profileImage ||
    absUrl(detail?.user?.profile_picture) ||
    null;

  const avatarSrc = toSrc(fallbackAvatar);
  const store = { ...routeStore, name: fallbackName, profileImage: fallbackAvatar };

  /* ---------------- Send message (FormData + optimistic + logs) ---------------- */
  const sendMut = useMutation({
    mutationFn: async ({ text, imageUri: imgUri }) => {
      const token = await getToken();
      const fd = new FormData();
      fd.append('message', text);

      if (imgUri) {
        fd.append('image', {
          uri: imgUri,
          type: 'image/jpeg',
          name: 'chat_attachment.jpg',
        });
      }

      D('send:request', {
        chatId,
        fields: imgUri ? ['message', 'image'] : ['message'],
        messageLen: text.length,
        hasImage: !!imgUri,
      });

      // Debug FormData contents
      console.log('FormData contents:');
      for (let [key, value] of fd.entries()) {
        console.log(`${key}:`, value);
      }

      const res = await ChatMutations.sendMessage(chatId, fd, token);

      try {
        const preview = JSON.stringify(res?.data ?? res).slice(0, 1200);
        D('send:response preview', preview);
      } catch {}
      return res;
    },
    onMutate: async ({ text, imageUri: imgUri }) => {
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        text,
        sender: 'me',
        time: formatClock(new Date().toISOString()),
        attachment: imgUri,
      };
      D('send:onMutate -> optimistic add', optimistic);

      setMessages((prev) => {
        const next = [...prev, optimistic];
        D('send:onMutate -> UI count', { prev: prev.length, next: next.length });
        return next;
      });
      setInputText('');
      setImageUri(null);
      scrollToEnd();

      // Also reflect in cache (shape similar to backend)
      qc.setQueryData(['chat', 'detail', chatId], (old) => {
        const base = old || { messages: [], user: null, dispute: null, cart: undefined };
        const nextMsgs = [
          ...(base.messages || []),
          {
            id: optimistic.id,
            message: optimistic.text,
            sender_type: 'store',
            created_at: new Date().toISOString(),
            attachment: optimistic.attachment,
          },
        ];
        D('send:onMutate -> cache add', { cachePrev: (base.messages || []).length, cacheNext: nextMsgs.length });
        return { ...base, messages: nextMsgs };
      });

      return { optimisticId: optimistic.id };
    },
    onError: (err, _vars, ctx) => {
      D('send:onError', err?.message || err);
      if (ctx?.optimisticId) {
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== ctx.optimisticId);
          D('send:onError -> remove optimistic UI', { prev: prev.length, next: next.length });
          return next;
        });
        qc.setQueryData(['chat', 'detail', chatId], (old) => {
          if (!old) return old;
          const nextMsgs = (old.messages || []).filter((m) => String(m.id) !== String(ctx.optimisticId));
          D('send:onError -> remove optimistic cache', { cachePrev: (old.messages || []).length, cacheNext: nextMsgs.length });
          return { ...old, messages: nextMsgs };
        });
      }
    },
    onSuccess: (res, _vars, ctx) => {
      // Unwrap server message (single object)
      const raw = res?.data?.data ?? res?.data ?? res;
      const real = raw ? mapMsg(raw) : null;
      D('send:onSuccess -> mapped', { real, hadOptimistic: !!ctx?.optimisticId });

      // Replace optimistic in UI
      if (real && ctx?.optimisticId) {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === ctx.optimisticId ? real : m));
          D('send:onSuccess -> replace in UI', { prev: prev.length, next: next.length });
          return next;
        });
      } else if (real) {
        setMessages((prev) => [...prev, real]);
      }

      // Replace optimistic in cache
      qc.setQueryData(['chat', 'detail', chatId], (old) => {
        const base = old || { messages: [], user: null, dispute: null, cart: undefined };
        const oldMsgs = base.messages || [];
        const replaced = oldMsgs.map((m) =>
          String(m.id) === String(ctx?.optimisticId) ? raw : m
        );
        const found = oldMsgs.some((m) => String(m.id) === String(ctx?.optimisticId));
        const nextMsgs = found ? replaced : [...oldMsgs, raw];
        D('send:onSuccess -> cache merge', { cachePrev: oldMsgs.length, cacheNext: nextMsgs.length, replaced: found });
        return { ...base, messages: nextMsgs };
      });

      scrollToEnd();
    },
  });

  const handleSend = () => {
    const v = inputText.trim();
    if ((!v && !imageUri) || !chatId) {
      D('send:blocked', { hasText: !!v, hasImage: !!imageUri, hasChatId: !!chatId });
      return;
    }
    sendMut.mutate({ text: v || (imageUri ? '📎 Image' : ''), imageUri });
  };

  const KAV_OFFSET = Platform.OS === 'ios' ? insets.top + headerH : 0;

  const renderMessage = ({ item }) => {
    if (item.type === 'dispute') return null; // not in response -> keep hidden
    const mine = item.sender === 'me';
    return (
      <View
        style={[
          styles.bubble,
          mine
            ? [styles.bubbleRight, { backgroundColor: C.primary }]
            : [styles.bubbleLeft, { backgroundColor: C.lightPink }],
        ]}
      >
        <ThemedText style={[styles.msg, { color: mine ? '#fff' : '#000' }]}>
          {item.text || (item.attachment ? '📎 Image' : 'Message')}
        </ThemedText>
        {item.attachment && (
          <TouchableOpacity
            onPress={() => {
              const imageUrl = item.attachment.startsWith('http') 
                ? item.attachment 
                : `${API_DOMAIN.replace('/api', '')}/storage/${item.attachment}`;
              setPreviewImage(imageUrl);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ 
                uri: item.attachment.startsWith('http') 
                  ? item.attachment 
                  : `${API_DOMAIN.replace('/api', '')}/storage/${item.attachment}` 
              }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        <ThemedText style={[styles.time, { color: mine ? '#fff' : '#000' }]}>
          {item.time || '07:22AM'}
        </ThemedText>
      </View>
    );
  };

  // Log every render batch size for clarity
  useEffect(() => {
    D('FlatList data size', messages.length);
  }, [messages.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={KAV_OFFSET}
      >
        {/* Header (no gradient, one cart icon) */}
        <View
          style={[styles.header, { backgroundColor: '#fff' }]}
          onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        >
          <TouchableOpacity style={styles.hIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <View className="center" style={styles.headerCenter}>
            <Image source={toSrc(store?.profileImage)} style={styles.avatar} />
            <View>
              <ThemedText style={[styles.storeName, { color: C.text }]}>
                {store?.name || 'Store'}
              </ThemedText>
              {/* Not provided by API → keep hardcoded */}
              <ThemedText style={[styles.lastSeen, { color: C.sub }]}>Last seen 2 mins ago</ThemedText>
            </View>
          </View>

          {/* <TouchableOpacity
            style={styles.hIcon}
            onPress={() => {
              // navigate to cart screen if available
            }}
          >
            <Image source={require('../../../assets/cart-black.png')} style={styles.iconImg} />
          </TouchableOpacity> */}
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 + insets.bottom }}
          ListHeaderComponent={
            // ← Only render cart if backend sends it
            <CartSummaryCard C={C} cart={detail?.cart} />
          }
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={renderMessage}
          onContentSizeChange={scrollToEnd}
          style={{ flex: 1 }}
        />

        {/* Composer */}
        <View style={[styles.composer, { marginBottom: 10 + insets.bottom, borderColor: '#ddd' }]}>
          <TouchableOpacity onPress={pickImage} disabled={sendMut.isPending}>
            <Ionicons name="attach" size={20} color="#777" />
          </TouchableOpacity>
          
          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={[styles.removeImage, { backgroundColor: C.primary }]}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          <TextInput
            style={[styles.input, { color: C.text }]}
            placeholder="Type a message"
            placeholderTextColor="#777"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity onPress={handleSend} disabled={(!inputText.trim() && !imageUri) || sendMut.isPending}>
            {sendMut.isPending ? (
              <Ionicons name="hourglass-outline" size={20} color="#777" />
            ) : (
              <Ionicons name="send" size={20} color={(inputText.trim() || imageUri) ? C.primary : "#777"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => setPreviewImage(null)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setPreviewImage(null)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: previewImage }}
                style={styles.previewModalImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- styles (UI unchanged) ---------- */
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hIcon: { padding: 6, borderColor: '#ddd', borderWidth: 1, borderRadius: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginHorizontal: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  storeName: { fontSize: 16, fontWeight: '400' },
  lastSeen: { fontSize: 11 },

  bubble: { maxWidth: '76%', padding: 12, borderRadius: 20, marginVertical: 5 },
  bubbleLeft: { alignSelf: 'flex-start', borderTopLeftRadius: 6 },
  bubbleRight: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  msg: { fontSize: 13 },
  time: { fontSize: 10, textAlign: 'right', marginTop: 6 },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.3,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: Platform.OS === 'ios' ? 8 : 10, marginHorizontal: 10, maxHeight: 100 },

  /* image preview and attachment styles */
  imagePreview: {
    position: 'relative',
    marginRight: 8,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },

  /* image preview modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalImage: {
    width: '100%',
    height: '100%',
    maxWidth: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.8,
  },

  /* cart summary */
  cartWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartHeaderText: { fontSize: 13, fontWeight: '600' },
  cartTotal: { fontSize: 12, fontWeight: '700' },

  cartItemRow: {
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cartThumb: { width: 44, height: 44, borderRadius: 8, marginRight: 10 },
  cartTitle: { fontSize: 13, fontWeight: '500' },
  cartPrice: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  cartQty: { fontSize: 12 },
});
