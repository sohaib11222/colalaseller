// utils/mutations/stores.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

/**
 * Create/Update store via builder
 *
 * `payload` may be:
 *  - JSON: { store_name, store_email, store_phone, theme_color, categories: [ids], ... }
 *  - FormData: same keys + optional files:
 *      .append("profile_image", { uri, name, type })
 *      .append("banner_image", { uri, name, type })
 *
 * NOTE: If sending FormData, make sure `apiCall` does NOT force Content-Type,
 * so the boundary is set automatically.
 */
export const submitStoreBuilder = async (payload, token) =>
  await apiCall(API_ENDPOINTS.STORES.Builder, "POST", payload, token);
