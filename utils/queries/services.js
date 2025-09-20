import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Onboarding progress
export const getProgress = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.Progress, "GET", undefined, token);

// Store overview
export const getStoreOverview = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.StoreOverview, "GET", undefined, token);

// Get onboarding level details
export const getLevelDetail = async (level, token) =>
  await apiCall(API_ENDPOINTS.SELLER.LevelDetail(level), "GET", undefined, token);

// Lists
export const getAddresses = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.Addresses, "GET", undefined, token);

export const getDeliveries = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.Deliveries, "GET", undefined, token);

export const getSocialLinks = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.SocialLinks, "GET", undefined, token);

export const getStoreCategories = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.StoreCategories, "GET", undefined, token);

export const getCatalogCategories = async (token) =>
  await apiCall(API_ENDPOINTS.SELLER.CatalogCategories, "GET", undefined, token);
