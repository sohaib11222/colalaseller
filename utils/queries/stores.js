// utils/queries/stores.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

/**
 * Get store builder data
 * Response shape (example):
 * {
 *   store: { id, store_name, ... },
 *   all_categories: [{ id, title, image_url }, ...]
 * }
 */
export const getStoreBuilder = async (token) =>
  await apiCall(API_ENDPOINTS.STORES.Builder, "GET", undefined, token);
