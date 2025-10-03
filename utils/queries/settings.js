
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Onboarding progress
export const getFAQs = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.FAQs, "GET", undefined, token);

export const getEscrowWallet = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Escrow_Wallet, "GET", undefined, token);

export const getEscrowHistory = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Escrow_History, "GET", undefined, token);

export const getBalance = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Balance, "GET", undefined, token);

export const getTransactionHistory = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Transaction_History, "GET", undefined, token);

export const getNotifications = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Notifications, "GET", undefined, token);

export const getAnnouncements = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.List_Of_Announcements, "GET", undefined, token);

export const getBanners = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.List_Of_Banners, "GET", undefined, token);

export const getCoupons = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.List_Of_Coupons, "GET", undefined, token);

export const getPlans = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Get_All_Plans, "GET", undefined, token);

export const getSubscriptionStatus = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Get_Subcription_Status, "GET", undefined, token);

export const getCards = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.List_Of_Cards, "GET", undefined, token);

export const getReviews = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.List_Of_Reviews, "GET", undefined, token);
