
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

export const getNotifications = async (token, page = 1) => {
  const url = `${API_ENDPOINTS.SETTINGS.Notifications}?page=${page}`;
  return await apiCall(url, "GET", undefined, token);
};

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

//Boost
export const getBoostsList = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Boosts_List, "GET", undefined, token);

export const getSingleBoost = async (token, id) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Single_Boost(id), "GET", undefined, token);


//Supports
export const getSupportList = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Support_List, "GET", undefined, token);

export const getSupportDetail = async (token, id) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Support_Detail(id), "GET", undefined, token);


export const getMyPoints = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.My_Points, "GET", undefined, token);

export const getAnalytics = async (token, params = {}) => {
  let url = API_ENDPOINTS.SETTINGS.Analytics;
  
  // Build query string from params
  const queryParams = [];
  if (params.period) {
    queryParams.push(`period=${params.period}`);
  }
  if (params.date_from) {
    queryParams.push(`date_from=${params.date_from}`);
  }
  if (params.date_to) {
    queryParams.push(`date_to=${params.date_to}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  return await apiCall(url, "GET", undefined, token);
};

export const getLoyaltiyPoints = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.loyaltiyPoints, "GET", undefined, token);

export const getLoyaltiySetting = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Get_loyaltiy_Setting, "GET", undefined, token);

export const addUserToStore = async (payload, token) => {
  try {
    const response = await apiCall(API_ENDPOINTS.SELLER.AddUser, "POST", payload, token);
    return response;  // Return the response object
  } catch (error) {
    console.error("Error in adding user to store:", error);
    throw error;  // Re-throw error for the calling function to handle
  }
};

export const getPhoneRequests = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Phone_Requests, "GET", undefined, token);

export const getPhoneVisibility = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Phone_Visibility, "GET", undefined, token);

export const getKnowledgeBase = async (token, params = {}) => {
  let url = API_ENDPOINTS.SETTINGS.Knowledge_Base;
  
  // Build query string from params (for pagination, filtering, etc.)
  const queryParams = [];
  if (params.page) {
    queryParams.push(`page=${params.page}`);
  }
  if (params.type) {
    queryParams.push(`type=${params.type}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  return await apiCall(url, "GET", undefined, token);
};

export const getUserPlan = async (token) =>
  await apiCall(API_ENDPOINTS.AUTH.GetPlan, "GET", undefined, token);

// Wallet Withdrawal - Get Banks List
export const getWithdrawBanks = async (token, country = 'ng') =>
  await apiCall(API_ENDPOINTS.GENERAL.Wallet_Withdraw_Banks(country), "GET", undefined, token);

// Wallet Withdrawal - Validate Account
export const validateBankAccount = async (payload, token) =>
  await apiCall(API_ENDPOINTS.GENERAL.Wallet_Validate_Account, "POST", payload, token);

