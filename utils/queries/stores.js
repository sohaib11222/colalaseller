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

// Get Store Users
export const getStoreUsers = async (token) => {
  console.log("getStoreUsers called with token:", token ? "Token exists" : "No token");
  console.log("API endpoint:", API_ENDPOINTS.STORES.Users);
  try {
    const result = await apiCall(API_ENDPOINTS.STORES.Users, "GET", undefined, token);
    console.log("getStoreUsers API result:", result);
    return result;
  } catch (error) {
    console.error("getStoreUsers API error:", error);
    throw error;
  }
};