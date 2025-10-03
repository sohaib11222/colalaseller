// utils/queries/general.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getCategories = async (token) =>
    await apiCall(API_ENDPOINTS.GENERAL.Categories, "GET", undefined, token);

export const getBrands = async (token) =>
    await apiCall(API_ENDPOINTS.GENERAL.Brands, "GET", undefined, token);
