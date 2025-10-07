// utils/queries/general.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getCategories = async (token) =>
    await apiCall(API_ENDPOINTS.GENERAL.Categories, "GET", undefined, token);

export const getBrands = async (token) =>
    await apiCall(API_ENDPOINTS.GENERAL.Brands, "GET", undefined, token);

export const getWalletTopUp = async (token) =>
    await apiCall(API_ENDPOINTS.GENERAL.Wallet_TopUp, "GET", undefined, token);

export const walletTopUp = async (amount, token) =>
    await apiCall(API_ENDPOINTS.GENERAL.Wallet_TopUp, "POST", { amount }, token);