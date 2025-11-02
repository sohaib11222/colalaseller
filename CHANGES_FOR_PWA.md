# Changes Implemented in Seller App (Mobile) - For PWA Implementation

This document lists all changes implemented in the seller mobile app that need to be replicated in the PWA version.

---

## 1. Video FAQ Accordion Design

**File:** `screens/mainscreens/settingsscreens/FAQsScreen.jsx`

### Changes:
- Changed video cards from overlay design to accordion format
- Title is always visible and clickable
- Clicking title expands/collapses to show description
- Description appears below title when expanded
- Chevron icon (up/down) indicates expanded state

### Implementation Guide:
1. Replace video card overlay with accordion structure
2. Add `expandedVideoId` state to track which video is expanded
3. Make title clickable to toggle expansion
4. Show description conditionally when `expandedVideoId === video.id`
5. Add chevron icon that changes based on expanded state

### UI Structure:
```
[Video Thumbnail] (tappable to play)
[Title with Chevron Icon] (tappable to expand/collapse)
[Description] (shown when expanded)
```

---

## 2. Video Thumbnail Extraction from Video Files

**Files:**
- `components/VideoThumbnailExtractor.jsx` (new)
- `screens/mainscreens/settingsscreens/FAQsScreen.jsx`

### Changes:
- Created `VideoThumbnailExtractor` component to extract thumbnails from video files
- Uses `expo-av`'s `Video.getThumbnailAsync()` to extract frame at 1 second
- YouTube videos continue to use YouTube thumbnail API
- Direct video files (MP4, etc.) get thumbnails extracted automatically
- Shows placeholder with "Loading Preview..." while extracting

### Implementation Guide:
1. For YouTube videos: Use `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg`
2. For direct video files: Use browser's video element to capture thumbnail or backend service
3. Show placeholder while thumbnail is being extracted
4. Cache thumbnails to avoid re-extraction

### API Endpoint:
- `GET /api/admin/knowledge-base?type=seller`

---

## 3. Shop Upgrade Screen - Current Level Display

**File:** `screens/mainscreens/UpgradeStoreScreen.jsx`

### Changes:
- When all levels are complete (`isOnboardingComplete === true`), current level is shown as Level 3
- Previously would not show current level badge when complete

### Implementation Guide:
```javascript
// Logic to apply:
let currentLevel = progressData?.level || 1;
const isOnboardingComplete = progressSteps.every(step => step.status === "done");

if (isOnboardingComplete) {
  currentLevel = 3;
}
```

---

## 4. Level Benefits Modal in Store Registration

**File:** `screens/authscreens/RegisterScreen.jsx`

### Changes:
- Added "View Benefits" button in registration screen header
- Created `LevelBenefitsModal` component
- Shows benefits specific to current registration level (1, 2, or 3)
- Modal displays 5 benefits per level with checkmark icons

### Benefits by Level:

**Level 1:**
- Store Setup - Create your store profile with basic information
- Basic Features - Access essential store management tools
- Profile Customization - Add logo, banner, and store details
- Category Selection - Choose your product categories
- Social Media Links - Connect your social media profiles

**Level 2:**
- Business Verification - Verify your business credentials
- Enhanced Features - Access advanced store management tools
- Trust Badge - Display verified badge on your store
- Document Upload - Secure document management
- Business Credibility - Build customer trust

**Level 3:**
- Full Store Features - Access all platform features
- Advanced Analytics - Track your store performance
- Premium Support - Priority customer support
- Physical Store Verification - Verify store location
- Complete Store Setup - Fully functional store ready to sell

### Implementation Guide:
1. Add "View Benefits" button next to "Need Help?" in registration header
2. Create modal component with level-based benefits
3. Pass current `level` (1, 2, or 3) to modal
4. Display benefits in scrollable list with checkmark icons
5. Show modal when "View Benefits" is clicked

---

## 5. Delivery Fee Display Logic for Orders

**File:** `screens/mainscreens/orderscreen/SingleOrderDetailsScreen.jsx`

### Changes:
- **Pending orders:** Delivery fee is NOT displayed at all
- **Accepted orders:** Delivery fee uses `detail.shipping_fee` from API instead of hardcoded value
- Applied in both main order details view and "Full Details" modal

### API Field:
```json
{
  "shipping_fee": "0.00"  // Use this field from API
}
```

### Implementation Guide:
1. **Pending Orders:**
   - Check if order status is `pending` or `pending_acceptance`
   - Do NOT show delivery fee row in order summary

2. **Accepted Orders:**
   - Use `detail.shipping_fee` from API response
   - Only display if `shipping_fee > 0`
   - Format as currency (e.g., `₦10,000`)

### Code Logic:
```javascript
const isPending = orderStatus === "pending" || orderStatus === "pending_acceptance";
const fee = isPending ? null : (detail?.shipping_fee ? Number(detail.shipping_fee) : 0);

// In UI:
{!isPending && fee !== null && fee > 0 && (
  <InfoRow left="Delivery fee" right={currency(fee)} />
)}
```

---

## 6. Order Details Expanded by Default

**File:** `screens/mainscreens/orderscreen/SingleOrderDetailsScreen.jsx`

### Changes:
- Order details (delivery address, summary) are expanded by default
- User doesn't need to click "Expand" to see details
- Can still collapse/expand manually

### Implementation Guide:
```javascript
const [expanded, setExpanded] = useState(true); // Default to true
```

---

## 7. Additional Features Previously Implemented

### A. Inventory Screen
- **File:** `screens/mainscreens/settingsscreens/InventoryScreen.jsx`
- **API:** `GET /api/seller/inventory`
- Displays product inventory with summary stats and product list

### B. Product Fields (quantity, referral_fee, referral_person_limit)
- **File:** `screens/mainscreens/AddProductScreen.jsx`
- Added three new optional fields:
  - `quantity` (integer, min: 0)
  - `referral_fee` (numeric, min: 0)
  - `referral_person_limit` (integer, min: 1)

### C. Analytics Date Filtering
- **File:** `screens/mainscreens/settingsscreens/AnalyticsScreen.jsx`
- **API:** `GET /api/seller/analytics?period=7|30|90` or `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`
- Functional date filter with options: Today, 7 days, 30 days, 90 days

### D. Boost Icon in Announcements
- **File:** `screens/mainscreens/settingsscreens/AnnouncementsScreen.jsx`
- Added "Boost" icon that opens external URL: `https://ads.colalamall.com/`

### E. Social Links in WebView
- **Files:** 
  - `components/SocialWebView.jsx` (new)
  - `components/StoreProfileModal.jsx`
- Social links now open in WebView instead of external browser

### F. Image Dimension Labels
- **File:** `screens/mainscreens/StoreBuilderScreen.jsx`
- Added dimension text next to upload fields (e.g., "Logo: 200×200", "Banner: 400×200")

### G. Store Opening Hours Background Color
- **Files:**
  - `screens/authscreens/StoreAddressesScreen.jsx`
  - `components/StoreProfileModal.jsx`
- Changed from red to grey (`#F5F6F8`)

### H. Monthly/Yearly Subscription Toggle
- **File:** `screens/mainscreens/settingsscreens/SubscriptionScreen.jsx`
- Added toggle switch for Monthly/Yearly billing
- Yearly amount = monthly amount × 12

### I. Service Details Pricing Display
- **File:** `screens/mainscreens/settingsscreens/ServiceDetailsScreen.jsx`
- Changed from "from-to price" to "Starting from {price}"
- Smaller font for "Starting from" text

---

## API Endpoints Added/Modified

### New Endpoints:
1. `GET /api/seller/inventory` - Inventory data
2. `POST /api/seller/help/request` - Help request form
3. `GET /api/admin/knowledge-base?type=seller` - Video tutorials

### Modified Endpoints:
1. `GET /api/seller/analytics?period=7|30|90` - With date filtering
2. `GET /api/seller/analytics?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` - Date range filter

---

## Notes for PWA Developer

1. **Video Thumbnails:** Since PWA uses web technologies, you can use:
   - YouTube: `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg`
   - Direct videos: Use `<video>` element with `currentTime` to capture thumbnail, or request backend service

2. **Accordion Design:** Use CSS transitions for smooth expand/collapse animation

3. **Delivery Fee Logic:** Ensure pending orders never show delivery fee, even if API returns a value

4. **Level Benefits:** Benefits should match exactly what's shown in mobile app for consistency

5. **Order Details:** Keep expanded by default for better UX

---

## Testing Checklist

- [ ] Video FAQ accordion expands/collapses correctly
- [ ] Video thumbnails load for both YouTube and direct video files
- [ ] Shop upgrade shows Level 3 as current when all complete
- [ ] Level benefits modal displays correct benefits for each level
- [ ] Delivery fee hidden for pending orders
- [ ] Delivery fee shows correct value from API for accepted orders
- [ ] Order details expanded by default
- [ ] All previously implemented features work correctlyan p

---

**Last Updated:** Current session changes (not yet committed)

