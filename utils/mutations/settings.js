import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

//Mark as Read Notification
export const markAsReadNotification = async (id, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Mark_As_Read_Notification(id), "POST", undefined, token);


//Announcements
export const createAnnouncement = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Create_Announcement, "POST", payload, token);

export const updateAnnouncement = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Update_Announcement(id), "POST", payload, token);

export const deleteAnnouncement = async (id, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Delete_Announcement(id), "DELETE", undefined, token);

//Banners
export const createBanner = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Create_Banner, "POST", payload, token);

export const updateBanner = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Update_Banner(id), "POST", payload, token);

export const deleteBanner = async (id, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Delete_Banner(id), "DELETE", undefined, token);


//Coupons
export const createCoupon = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Create_Coupon, "POST", payload, token);

export const updateCoupon = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Update_Coupon(id), "PUT", payload, token);

export const deleteCoupon = async (id, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Delete_Coupon(id), "DELETE", undefined, token);

//Plans + Subcriptions
export const addSubscription = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Add_Subscription, "POST", payload, token);

export const cancelSubscription = async (id, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Cancel_Subscription(id), "PATCH", undefined, token);