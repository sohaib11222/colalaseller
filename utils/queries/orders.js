import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";


export const getOrders = async (token) =>
    await apiCall(API_ENDPOINTS.ORDERS.Get_All_Orders, "GET", undefined, token);

export const getOrderDetail = async (id, token) =>
    await apiCall(API_ENDPOINTS.ORDERS.Order_Detail(id), "GET", undefined, token);

export const getPendingOrders = async (token) =>
    await apiCall(API_ENDPOINTS.ORDERS.Get_Pending_Orders, "GET", undefined, token);

export const getAcceptanceStats = async (token) =>
    await apiCall(API_ENDPOINTS.ORDERS.Acceptance_Stats, "GET", undefined, token);

