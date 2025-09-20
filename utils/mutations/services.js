import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Create Service
// payload = FormData with store_id, category_id, name, short_description, full_description, price_from, price_to, discount_price, media[](file), sub_services[index][name], sub_services[index][price_from], sub_services[index][price_to]
export const createService = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SERVICES.Create, "POST", payload, token);

// Update Service (same payload structure)
export const updateService = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.SERVICES.Update(id), "POST", payload, token);

export const deleteService = async (id, token) =>
  await apiCall(API_ENDPOINTS.SERVICES.Delete(id), "DELETE", undefined, token);
