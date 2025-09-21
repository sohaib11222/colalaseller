import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";


export const forgetPassword = async (payload) =>
  // payload = { email: "hmstech11@gmail.com" }
  await apiCall(API_ENDPOINTS.AUTH.ForgetPassword, "POST", payload);

export const verifyOtp = async (payload) =>
  // payload = { email: "hmstech11@gmail.com", otp: "1234" }
  await apiCall(API_ENDPOINTS.AUTH.VerifyOtp, "POST", payload);

export const login = async (payload) =>
  // payload = { email: "store@example.com", password: "password123" }
  await apiCall(API_ENDPOINTS.AUTH.Login, "POST", payload);

export const resetPassword = async (payload, token) =>
  // payload = { email: "hmstech11@gmail.com", password: "newpassword123" }
  await apiCall(API_ENDPOINTS.AUTH.ResetPassword, "POST", payload, token);
