import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Start Seller Onboarding
// payload = {
//   store_name: "My Store",
//   store_email: "store1@example.com",
//   store_phone: "+2348012345678",
//   store_location: "Lagos, Nigeria",
//   password: "password123",
//   referral_code: "REF123"
// }
export const startOnboarding = async (payload) =>
  await apiCall(API_ENDPOINTS.AUTH.StartOnboarding, "POST", payload);

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
