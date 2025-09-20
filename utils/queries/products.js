import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getProducts = async (token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.GetAll, "GET", undefined, token);
