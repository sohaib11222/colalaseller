// screens/settings/SettingsScreen.jsx
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '../../../components/ThemedText';
import { useTheme } from '../../../components/ThemeProvider';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme?.colors?.primary || '#E53E3E',
      bg: theme?.colors?.background || '#F5F6F8',
      white: theme?.colors?.card || '#FFFFFF',
      text: theme?.colors?.text || '#101318',
      sub: theme?.colors?.muted || '#6C727A',
      border: '#ECEDEF',
      light: '#F8F9FB',
      danger: '#F04438',
      success: '#22C55E',
    }),
    [theme]
  );

  const cartCount = 2;
  const notifCount = 3;

  // Main section (match screenshot)
  const menuMain = [
    { key: 'myProducts', label: 'My Products', img: require('../../../assets/Vector.png'), leftColor: '#E53E3E' },
    { key: 'analytics', label: 'Analytics', img: require('../../../assets/Vector (1).png'), leftColor: '#4C3EE5' },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      img: require('../../../assets/Vector (2).png'),
      leftColor: '#22A06B',
      badgeText: 'Subscription Active',
      badgeColor: '#22C55E',
    },
    { key: 'promoted', label: 'Promoted Products', img: require('../../../assets/Vector (3).png'), leftColor: '#E5863E' },
    { key: 'coupons', label: 'Manage Coupons/ Points', img: require('../../../assets/Vector (4).png'), leftColor: '#F59E0B' },
    { key: 'announcements', label: 'Announcements', img: require('../../../assets/Vector (5).png'), leftColor: '#0EA5E9' },
    { key: 'reviews', label: 'Reviews', img: require('../../../assets/Star copy 2.png'), leftColor: '#4C3EE5' },
    { key: 'referrals', label: 'Referrals', img: require('../../../assets/Users.png'), leftColor: '#8B5CF6' },
    { key: 'support', label: 'Support', img: require('../../../assets/Question.png'), leftColor: '#3EC9E5' },
    { key: 'faqs', label: 'FAQs', img: require('../../../assets/Vector (6).png'), leftColor: '#9CA3AF' },
  ];

  // Others (match screenshot)
  const menuOthers = [
    { key: 'sellerLeaderboard', label: 'Seller Leaderboard', img: require('../../../assets/Vector (5).png'), leftColor: '#0EA5E9' },
    { key: 'savedCards', label: 'Saved Cards', img: require('../../../assets/Vector (1).png'), leftColor: '#4C3EE5' },
    { key: 'accessControl', label: 'Account Access Control', img: require('../../../assets/Vector (2).png'), leftColor: '#22A06B' },
  ];

  const onPressRow = (key) => {
    // Wire up to your settings navigator screens
    const map = {
      myProducts: ['SettingsNavigator', { screen: 'MyProducts' }],
      analytics: ['SettingsNavigator', { screen: 'Analytics' }],
      subscriptions: ['SettingsNavigator', { screen: 'Subscriptions' }],
      promoted: ['SettingsNavigator', { screen: 'PromotedProducts' }],
      coupons: ['SettingsNavigator', { screen: 'ManageCoupons' }],
      announcements: ['SettingsNavigator', { screen: 'Announcements' }],
      reviews: ['SettingsNavigator', { screen: 'MyReviews' }],
      referrals: ['SettingsNavigator', { screen: 'Referrals' }],
      support: ['SettingsNavigator', { screen: 'Support' }],
      faqs: ['SettingsNavigator', { screen: 'FAQs' }],

      sellerLeaderboard: ['SettingsNavigator', { screen: 'SellerLeaderboard' }],
      savedCards: ['SettingsNavigator', { screen: 'SavedCards' }],
      accessControl: ['SettingsNavigator', { screen: 'AccountAccessControl' }],

      wallet: ['SettingsNavigator', { screen: 'ShoppingWallet' }],
      holdingWallet: ['SettingsNavigator', { screen: 'EscrowWallet' }],
      editProfile: ['SettingsNavigator', { screen: 'EditProfile' }],
      shopUpgrade: ['SettingsNavigator', { screen: 'ShopUpgrade' }],
    };

    const route = map[key];
    if (route) navigation.navigate(route[0], route[1]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      {/* RED TOP */}
      <View style={[styles.redTop, { backgroundColor: C.primary }]}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <ThemedText font="oleo" style={[styles.headerTitle, { color: C.white }]}>
            Settings
          </ThemedText>
          <View style={styles.headerIcons}>
            <HeaderIconCircle>
              <Ionicons name="cart-outline" size={18} color={C.primary} />
              {cartCount > 0 && (
                <View style={[styles.headerBadge, { backgroundColor: C.primary, borderColor: C.white }]}>
                  <ThemedText style={styles.headerBadgeText}>{cartCount}</ThemedText>
                </View>
              )}
            </HeaderIconCircle>
            <HeaderIconCircle>
              <Ionicons name="notifications-outline" size={18} color={C.primary} />
              {notifCount > 0 && (
                <View style={[styles.headerBadge, { backgroundColor: C.primary, borderColor: C.white }]}>
                  <ThemedText style={styles.headerBadgeText}>{notifCount}</ThemedText>
                </View>
              )}
            </HeaderIconCircle>
          </View>
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=8' }} style={[styles.profileImg, { borderColor: '#ffffff66' }]} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <ThemedText style={[styles.name, { color: C.white }]}>Sasha Stores</ThemedText>
              <View style={styles.verifyPill}>
                <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.locationRow}>
              <ThemedText style={[styles.locationText, { color: C.white }]}>Lagos, Nigeria</ThemedText>
              <Ionicons name="caret-down" size={12} color={C.white} />
            </View>
          </View>
        </View>

        {/* Wallet card (top + bottom bar as one piece) */}
        <View style={[styles.walletCard, { backgroundColor: C.white }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.walletLabel, { color: C.sub }]}>Main Wallet</ThemedText>
            <ThemedText style={[styles.walletAmount, { color: C.text }]}>₦50,000</ThemedText>
          </View>
          <TouchableOpacity style={[styles.viewWalletBtn, { backgroundColor: C.primary }]} onPress={() => onPressRow('wallet')}>
            <ThemedText style={styles.viewWalletText}>View Wallet</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.holdingBar, { backgroundColor: '#FF6B6B' }]} onPress={() => onPressRow('holdingWallet')}>
          <ThemedText style={styles.holdingText}>
            ₦50,000 locked in holding wallet <ThemedText style={{ color: '#640505', fontSize: 13 }}>· Click to view</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Shop Upgrade */}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.primary }]} onPress={() => onPressRow('shopUpgrade')}>
          <ThemedText style={styles.primaryBtnText}>Shop Upgrade</ThemedText>
        </TouchableOpacity>

        {/* Main options */}
        <View style={{ marginTop: 12 }}>
          {menuMain.map((item) => (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              onPress={() => onPressRow(item.key)}
              badgeText={item.badgeText}
              badgeColor={item.badgeColor || C.success}
              C={C}
            />
          ))}
        </View>

        {/* Others */}
        <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>Others</ThemedText>
        <View>
          {menuOthers.map((item) => (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              onPress={() => onPressRow(item.key)}
              C={C}
            />
          ))}
        </View>

        {/* Logout */}
        <OptionPillCard
          label="Logout"
          img={require('../../../assets/Vector (6).png')}
          leftColor="#fff"
          onPress={() => {}}
          textColor={C.danger}
          C={C}
        />

        {/* Delete Account */}
        <TouchableOpacity style={[styles.disabledBtn, { borderColor: C.border, backgroundColor: C.light }]} onPress={() => {}}>
          <ThemedText style={styles.disabledText}>Delete Account</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------------- components ---------------- */
const HeaderIconCircle = ({ children, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.headerIconCircle}>
    {children}
  </TouchableOpacity>
);

const OptionPillCard = ({
  label,
  img,
  onPress,
  leftColor,
  textColor = '#101318',
  badgeText,
  badgeColor = '#22C55E',
  C,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.pillWrap}>
      {/* Left colored rail */}
      <View style={[styles.pillLeft, { backgroundColor: leftColor }]}>
        <Image source={img} style={styles.pillIcon} resizeMode="contain" />
      </View>

      {/* White card body */}
      <View style={[styles.pillBody, { backgroundColor: C.white, borderColor: C.border }]}>
        <ThemedText style={[styles.pillLabel, { color: textColor }]} numberOfLines={1}>
          {label}
        </ThemedText>

        {/* Optional right badge (e.g., Subscriptions Active) */}
        {badgeText ? (
          <View style={[styles.badgePill, { backgroundColor: badgeColor + '22', borderColor: badgeColor }]}>
            <ThemedText style={[styles.badgePillText, { color: badgeColor }]}>{badgeText}</ThemedText>
          </View>
        ) : null}

        <Ionicons name="chevron-forward" size={18} color="#B0B6BE" />
      </View>
    </TouchableOpacity>
  );
};

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  /* Red top */
  redTop: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 8 : 2,
    paddingBottom: 6,
  },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '400' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerBadge: {
    position: 'absolute',
    right: -2,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
  },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  /* Profile */
  profileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  profileImg: { width: 48, height: 48, borderRadius: 24, marginRight: 12, borderWidth: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16.5, fontWeight: '800' },
  verifyPill: { marginLeft: 8, backgroundColor: '#FACC15', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { fontSize: 12, marginRight: 4, opacity: 0.95 },

  /* Wallet card + holding bar */
  walletCard: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletLabel: { fontSize: 12, marginBottom: 4, opacity: 0.9, paddingBottom: 15 },
  walletAmount: { fontSize: 26, fontWeight: '900', letterSpacing: 0.2, paddingBottom: 25 },
  viewWalletBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 45 },
  viewWalletText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  holdingBar: {
    opacity: 0.95,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: -10,
    zIndex: 1,
  },
  holdingText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },

  /* Primary button */
  primaryBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '400' },

  /* Pill option card */
  pillWrap: {
    position: 'relative',
    height: 64,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 74,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    paddingLeft: 15,
    justifyContent: 'center',
  },
  pillIcon: { width: 24, height: 24 },
  pillBody: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 50,
    right: 0,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    zIndex: 1,
  },
  pillLabel: { flex: 1, fontSize: 16, fontWeight: '500' },

  badgePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgePillText: { fontSize: 10, fontWeight: '700' },

  /* Section title */
  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    marginHorizontal: 18,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Delete account */
  disabledBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  disabledText: { color: '#A1A8B0', fontWeight: '700' },
});

export default SettingsScreen;
