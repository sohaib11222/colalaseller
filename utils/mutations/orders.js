import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";


export const markForDelivery = async (id, token) =>
    await apiCall(API_ENDPOINTS.ORDERS.Mark_For_Delivery(id), "PATCH", undefined, token);

export const verifyCode = async (id, token) =>
    await apiCall(API_ENDPOINTS.ORDERS.Verify_Code(id), "PATCH", undefined, token);