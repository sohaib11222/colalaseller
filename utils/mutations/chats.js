// utils/mutations/chats.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

/**
 * Send a chat message.
 * payload can be:
 *  - JSON: { message: "hello" }
 *  - FormData: with "message" and optional "image" (for RN: { uri, name, type })
 *
 * NOTE:
 * - If you're sending an image, build a FormData and pass it here.
 * - Your apiCall should handle FormData by NOT forcing Content-Type.
 */
export const sendMessage = async (chatId, payload, token) => {
    if (!chatId) throw new Error("chatId is required");
    // payload can be FormData or plain object; your custom apiCall should detect/form-encode as needed.
    return apiCall(API_ENDPOINTS.CHATS.Send(chatId), "POST", payload, token);
};
