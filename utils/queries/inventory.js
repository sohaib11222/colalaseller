import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getInventory = async (token, params) => {
  console.log("getInventory - API_ENDPOINTS.SELLER:", API_ENDPOINTS?.SELLER);
  console.log("getInventory - API_ENDPOINTS.SELLER.Inventory:", API_ENDPOINTS?.SELLER?.Inventory);
  
  const url = API_ENDPOINTS?.SELLER?.Inventory;
  if (!url) {
    console.error("Inventory endpoint is undefined. Full API_ENDPOINTS:", JSON.stringify(API_ENDPOINTS, null, 2));
    throw new Error("Inventory endpoint not configured. URL is undefined.");
  }
  return await apiCall(url, "GET", params, token);
};

