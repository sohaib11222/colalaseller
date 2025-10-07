import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Get leaderboard sellers data
export const getLeaderboardSellers = async (token) =>
  await apiCall(API_ENDPOINTS.LEADERBOARD.Sellers, "GET", undefined, token);
