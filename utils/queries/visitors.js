import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getVisitors = async (token, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const endpoint = queryParams 
    ? `${API_ENDPOINTS.VISITORS.Get_Visitors}?${queryParams}`
    : API_ENDPOINTS.VISITORS.Get_Visitors;
  return await apiCall(endpoint, "GET", undefined, token);
};

export const getVisitorActivity = async (userId, token) =>
  await apiCall(API_ENDPOINTS.VISITORS.Get_Visitor_Activity(userId), "GET", undefined, token);

export const startChatWithVisitor = async (userId, payload, token) =>
  await apiCall(API_ENDPOINTS.VISITORS.Start_Chat(userId), "POST", payload, token);

