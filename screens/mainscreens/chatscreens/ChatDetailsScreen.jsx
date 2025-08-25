// screens/ChatDetailsScreen.js
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ThemedText from '../../../components/ThemedText';
import { useTheme } from '../../../components/ThemeProvider';

/* ---------- helpers ---------- */
const toSrc = (v) => (typeof v === 'number' ? v : v ? { uri: String(v) } : undefined);

/* ---------- demo cart data (replace with real data) ---------- */
const CART = {
  items: [
    {
      id: 'ci1',
      title: 'Iphone 16 pro max - Black',
      price: '₦2,500,000',
      qty: 1,
      image:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200&auto=format&fit=crop',
    },
    {
      id: 'ci2',
      title: 'Iphone 16 pro max - Black',
      price: '₦2,500,000',
      qty: 1,
      image:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200&auto=format&fit=crop',
    },
  ],
  total: '₦5,000,000',
};

function CartSummaryCard({ C }) {
  return (
    <View style={[styles.cartWrap, { borderColor: C.primary + '55', backgroundColor: '#FFF1F1' }]}>
      <View style={styles.cartHeaderRow}>
        <ThemedText style={[styles.cartHeaderText, { color: C.text }]}>
          Items in cart ({CART.items.length})
        </ThemedText>
        <ThemedText style={[styles.cartTotal, { color: C.primary }]}>{CART.total}</ThemedText>
      </View>

      {CART.items.map((it) => (
        <View key={it.id} style={[styles.cartItemRow, { backgroundColor: '#FFE6E6' }]}>
          <Image source={toSrc(it.image)} style={styles.cartThumb} />
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.cartTitle, { color: C.text }]} numberOfLines={1}>
              {it.title}
            </ThemedText>
            <ThemedText style={[styles.cartPrice, { color: C.primary }]}>{it.price}</ThemedText>
          </View>
          <ThemedText style={[styles.cartQty, { color: C.text }]}>Qty : {it.qty}</ThemedText>
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

  const store = params?.store || {};
  const avatarSrc = toSrc(store?.profileImage);

  const [headerH, setHeaderH] = useState(0);
  const [messages, setMessages] = useState([
    { id: 1, text: 'How will i get the product delivered', sender: 'me', time: '07:22AM' },
    { id: 2, text: 'Thank you for purchasing from us', sender: 'store', time: '07:22AM' },
    { id: 3, text: 'I will arrange a dispatch rider soon and i will contact you', sender: 'store', time: '07:22AM' },
    { id: 4, text: 'Okay i will be expecting.', sender: 'me', time: '07:29AM' },
  ]);
  const [inputText, setInputText] = useState('');

  const listRef = useRef(null);
  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', scrollToEnd);
    const b = Keyboard.addListener('keyboardDidHide', scrollToEnd);
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const handleSend = () => {
    const v = inputText.trim();
    if (!v) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    setMessages((prev) => [...prev, { id: Date.now(), text: v, sender: 'me', time }]);
    setInputText('');
    scrollToEnd();
  };

  const KAV_OFFSET = Platform.OS === 'ios' ? insets.top + headerH : 0;

  const renderMessage = ({ item }) => {
    if (item.type === 'dispute') {
      // If you later re-add disputes, they will render here.
      return null;
    }
    const mine = item.sender === 'me';
    return (
      <View
        style={[
          styles.bubble,
          mine ? [styles.bubbleRight, { backgroundColor: C.primary }] : [styles.bubbleLeft, { backgroundColor: C.lightPink }],
        ]}
      >
        <ThemedText style={[styles.msg, { color: mine ? '#fff' : '#000' }]}>{item.text}</ThemedText>
        <ThemedText style={[styles.time, { color: mine ? '#fff' : '#000' }]}>{item.time}</ThemedText>
      </View>
    );
  };

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

          <View style={styles.headerCenter}>
            <Image source={avatarSrc} style={styles.avatar} />
            <View>
              <ThemedText style={[styles.storeName, { color: C.text }]}>{store?.name || 'Store'}</ThemedText>
              <ThemedText style={[styles.lastSeen, { color: C.sub }]}>Last seen 2 mins ago</ThemedText>
            </View>
          </View>

          <TouchableOpacity style={styles.hIcon} onPress={() => { /* navigate to cart screen if available */ }}>
            <Ionicons name="cart-outline" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 + insets.bottom }}
          ListHeaderComponent={<CartSummaryCard C={C} />}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={renderMessage}
          onContentSizeChange={scrollToEnd}
          style={{ flex: 1 }}
        />

        {/* Composer */}
        <View style={[styles.composer, { marginBottom: 10 + insets.bottom, borderColor: '#ddd' }]}>
          <TouchableOpacity>
            <Ionicons name="attach" size={20} color="#777" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: C.text }]}
            placeholder="Type a message"
            placeholderTextColor="#777"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={handleSend}>
            <Ionicons name="send" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
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
  input: { flex: 1, fontSize: 14, paddingVertical: Platform.OS === 'ios' ? 8 : 10, marginHorizontal: 10 },

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
