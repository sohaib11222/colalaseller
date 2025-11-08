// utils/queries/chats.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

/**
 * Get chat list
 * response: { status, data: [{ chat_id, user, avatar, ... }], message }
 */
export const getChatList = async (token) =>
    await apiCall(API_ENDPOINTS.CHATS.List, "GET", undefined, token);

/**
 * Get chat messages/details for a chat
 * response: { status, data: { messages: [], user: {...}, dispute }, message }
 */
export const getChatDetails = async (chatId, token) => {
    if (!chatId) throw new Error("chatId is required");
    return apiCall(API_ENDPOINTS.CHATS.Details(chatId), "GET", undefined, token);
};

/**
 * Get user status (online/offline)
 * response: { status: true, data: { is_online: true, last_seen_at: "..." } }
 */
export const getUserStatus = async (userId, token) => {
    if (!userId) throw new Error("userId is required");
    return apiCall(API_ENDPOINTS.USERS.GetStatus(userId), "GET", undefined, token);
};
