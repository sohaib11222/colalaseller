import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Create Service
// payload = FormData with  category_id, name, short_description, full_description, price_from, price_to, discount_price, media[](file), sub_services[index][name], sub_services[index][price_from], sub_services[index][price_to]
export const createService = async (payload, token) => {
  console.log("🚀 Creating service with payload:");
  console.log("📦 Payload type:", typeof payload);
  console.log("📦 Payload constructor:", payload.constructor.name);

  // Log FormData contents
  if (payload instanceof FormData) {
    console.log("📋 FormData entries:");
    for (let [key, value] of payload.entries()) {
      if (value instanceof File || value instanceof Blob) {
        console.log(`  ${key}: [File/Blob] - ${value.name || 'unnamed'} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  } else {
    console.log("📦 Payload object:", payload);
  }

  console.log("🔑 Token present:", !!token);
  console.log("🌐 API Endpoint:", API_ENDPOINTS.SERVICES.Create);

  const result = await apiCall(API_ENDPOINTS.SERVICES.Create, "POST", payload, token);

  console.log("✅ Service creation result:", result);
  return result;
};

// Update Service (same payload structure)
export const updateService = async (id, payload, token) => {
  console.log("🔄 Updating service with ID:", id);
  console.log("📦 Payload type:", typeof payload);
  console.log("📦 Payload constructor:", payload.constructor.name);

  // Log FormData contents
  if (payload instanceof FormData) {
    console.log("📋 FormData entries:");
    for (let [key, value] of payload.entries()) {
      if (value instanceof File || value instanceof Blob) {
        console.log(`  ${key}: [File/Blob] - ${value.name || 'unnamed'} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  } else {
    console.log("📦 Payload object:", payload);
  }

  console.log("🔑 Token present:", !!token);
  console.log("🌐 API Endpoint:", API_ENDPOINTS.SERVICES.Update(id));

  const result = await apiCall(API_ENDPOINTS.SERVICES.Update(id), "POST", payload, token);

  console.log("✅ Service update result:", result);
  return result;
};

export const deleteService = async (id, token) => {
  console.log("🗑️ Deleting service with ID:", id);
  console.log("🔑 Token present:", !!token);
  console.log("🌐 API Endpoint:", API_ENDPOINTS.SERVICES.Delete(id));

  const result = await apiCall(API_ENDPOINTS.SERVICES.Delete(id), "DELETE", undefined, token);

  console.log("✅ Service deletion result:", result);
  return result;
};

export const markAsUnavailable = async (serviceId, token) =>
  await apiCall(API_ENDPOINTS.SERVICES.Service_Mark_As_Unavailable(serviceId), "POST", undefined, token);

export const markAsAvailable = async (serviceId, token) =>
  await apiCall(API_ENDPOINTS.SERVICES.Service_Mark_As_Available(serviceId), "POST", undefined, token);

