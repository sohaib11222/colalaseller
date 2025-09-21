import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";


// Start Seller Onboarding
// payload = {
//   store_name: "My Store",
//   store_email: "store1@example.com",
//   store_phone: "+2348012345678",
//   store_location: "Lagos, Nigeria",
//   password: "password123",
//   referral_code: "REF123"
// }
export const startOnboarding = async (payload) =>
  await apiCall(API_ENDPOINTS.AUTH.StartOnboarding, "POST", payload);

// Level 1 - Profile & Media
// payload = FormData with keys: profile_image(file), banner_image(file)
export const uploadProfileMedia = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.ProfileMedia, "POST", payload, token);

// Level 1 - Categories & Social
// payload = { categories: [1, 2], social_links: [{ type: "facebook", url: "https://fb.com/store" }] }
export const setCategoriesSocial = async (payload, token) =>

  await apiCall(API_ENDPOINTS.SELLER.CategoriesSocial, "POST", payload, token);

// Level 2 - Business Details
// payload = { registered_name: "My Store Ltd", business_type: "BN", nin_number: "12345678901", bn_number: "BN123", cac_number: "CAC123" }
export const setBusinessDetails = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.BusinessDetails, "POST", payload, token);

// Level 2 - Documents
// payload = FormData with nin_document(file), cac_document(file)
export const uploadDocuments = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.Documents, "POST", payload, token);

// Level 3 - Physical Store
// payload = FormData with has_physical_store=1, store_video(file)
export const uploadPhysicalStore = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.PhysicalStore, "POST", payload, token);

// Level 3 - Utility Bill
// payload = FormData with utility_bill(file)
export const uploadUtilityBill = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.UtilityBill, "POST", payload, token);

// Level 3 - Address
// payload = { state: "Lagos", local_government: "Ikeja", full_address: "123 Main St", is_main: true, opening_hours: { monday: "9-18" } }
export const setAddress = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.Address, "POST", payload, token);

// Level 3 - Delivery Pricing
// payload = { state: "Lagos", local_government: "Ikeja", variant: "light", price: 1000, is_free: false }
export const setDeliveryPricing = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.DeliveryPricing, "POST", payload, token);

// Level 3 - Theme
// payload = { theme_color: "#FF5733" }
export const setTheme = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SELLER.Theme, "POST", payload, token);

// Submit Onboarding (no body)
export const submitOnboarding = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.Submit, "POST", undefined, token);
