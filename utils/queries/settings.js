
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