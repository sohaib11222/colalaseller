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



//Cards
export const createCard = async ({ payload, token }) => {
  console.log("Create Card - Payload:", payload);
  console.log("Create Card - Token:", token);
  console.log("Create Card - URL:", API_ENDPOINTS.SETTINGS.Create_Card);
  try {
    const result = await apiCall(API_ENDPOINTS.SETTINGS.Create_Card, "POST", payload, token);
    console.log("Create Card - Success:", result);
    return result;
  } catch (error) {
    console.log("Create Card - Error:", error);
    throw error;
  }
};

export const updateCard = async ({ id, payload, token }) => {
  console.log("Update Card - ID:", id);
  console.log("Update Card - Payload:", payload);
  console.log("Update Card - Token:", token);
  console.log("Update Card - URL:", API_ENDPOINTS.SETTINGS.Update_Card(id));
  try {
    const result = await apiCall(API_ENDPOINTS.SETTINGS.Update_Card(id), "POST", payload, token);
    console.log("Update Card - Success:", result);
    return result;
  } catch (error) {
    console.log("Update Card - Error:", error);
    throw error;
  }
};

export const deleteCard = async ({ id, token }) => {
  console.log("Delete Card - ID:", id);
  console.log("Delete Card - Token:", token);
  console.log("Delete Card - URL:", API_ENDPOINTS.SETTINGS.Delete_Card(id));
  try {
    const result = await apiCall(API_ENDPOINTS.SETTINGS.Delete_Card(id), "DELETE", undefined, token);
    console.log("Delete Card - Success:", result);
    return result;
  } catch (error) {
    console.log("Delete Card - Error:", error);
    throw error;
  }
};

export const activeCard = async ({ id, token }) => {
  console.log("Active Card - ID:", id);
  console.log("Active Card - Token:", token);
  console.log("Active Card - URL:", API_ENDPOINTS.SETTINGS.Active_Card(id));
  try {
    const result = await apiCall(API_ENDPOINTS.SETTINGS.Active_Card(id), "PATCH", undefined, token);
    console.log("Active Card - Success:", result);
    return result;
  } catch (error) {
    console.log("Active Card - Error:", error);
    throw error;
  }
};

export const autodebitCard = async ({ id, token }) => {
  console.log("Autodebit Card - ID:", id);
  console.log("Autodebit Card - Token:", token);
  console.log("Autodebit Card - URL:", API_ENDPOINTS.SETTINGS.Autodebit_Card(id));
  try {
    const result = await apiCall(API_ENDPOINTS.SETTINGS.Autodebit_Card(id), "PATCH", undefined, token);
    console.log("Autodebit Card - Success:", result);
    return result;
  } catch (error) {
    console.log("Autodebit Card - Error:", error);
    throw error;
  }
};


export const previewBoost = async ({ payload, token }) => {
  await apiCall(API_ENDPOINTS.SETTINGS.Boost_Preview, "POST", payload, token);
};

export const createBoost = async ({ payload, token }) => {
  await apiCall(API_ENDPOINTS.SETTINGS.Boost_Create, "POST", payload, token);
};

export const updateBoostStatus = async ({ id, payload, token }) => {
  await apiCall(API_ENDPOINTS.SETTINGS.Boost_Status(id), "PATCH", payload, token);
};

