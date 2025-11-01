// import { apiCall } from "../customApiCall";
// import { API_ENDPOINTS } from "../../apiConfig";


// export const markForDelivery = async (id, token) =>
//     await apiCall(API_ENDPOINTS.ORDERS.Mark_For_Delivery(id), "POST", undefined, token);

// export const verifyCode = async (id, token) =>
//     await apiCall(API_ENDPOINTS.ORDERS.Verify_Code(id), "PATCH", undefined, token);

// import { apiCall } from "../customApiCall";
// import { API_ENDPOINTS } from "../../apiConfig";

// // Use POST + _method override so Laravel treats it as PATCH.
// // Also sends a tiny body so Content-Type is correct.
// export const markForDelivery = async (id, token) =>
//   await apiCall(
//     API_ENDPOINTS.ORDERS.Mark_For_Delivery(id),
//     "POST",
//     { _method: "PATCH" },
//     token
//   );

// export const verifyCode = async (id, token) =>
//   await apiCall(
//     API_ENDPOINTS.ORDERS.Verify_Code(id),
//     "POST",
//     { _method: "PATCH" },
//     token
//   );

// utils/mutations/orders.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Mark as out for delivery (MUST be POST)
export const markForDelivery = async (id, token) =>
  apiCall(API_ENDPOINTS.ORDERS.Mark_For_Delivery(id), "POST", undefined, token);

// Verify delivery code (backend likely POST too)
export const verifyCode = async (id, code, token) =>
  apiCall(API_ENDPOINTS.ORDERS.Verify_Code(id), "POST", { code }, token);

// Accept order
export const acceptOrder = async (storeOrderId, payload, token) =>
  apiCall(API_ENDPOINTS.ORDERS.Accept_Order(storeOrderId), "POST", payload, token);

// Reject order
export const rejectOrder = async (storeOrderId, payload, token) =>
  apiCall(API_ENDPOINTS.ORDERS.Reject_Order(storeOrderId), "POST", payload, token);

// Update delivery details
export const updateDeliveryDetails = async (storeOrderId, payload, token) =>
  apiCall(API_ENDPOINTS.ORDERS.Update_Delivery(storeOrderId), "PUT", payload, token);
