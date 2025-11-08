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
  return await apiCall(API_ENDPOINTS.SETTINGS.Update_Card(id), "POST", payload, token);
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


// Boost Preview
// payload = FormData with product_id, location, duration, budget, start_date, payment_method
export const previewBoost = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Boost_Preview, "POST", payload, token);


// payload = FormData with product_id, location, duration, budget, start_date, payment_method
export const createBoost = async ({ payload, token }) => {
  await apiCall(API_ENDPOINTS.SETTINGS.Boost_Create, "POST", payload, token);
};

export const updateBoostStatus = async ({ id, payload, token }) => {
  await apiCall(API_ENDPOINTS.SETTINGS.Boost_Status(id), "PATCH", payload, token);
};

export const updateBoost = async ({ id, payload, token }) => {
  return await apiCall(API_ENDPOINTS.SETTINGS.Boost_Update(id), "POST", payload, token);
};




//Supports
export const createSupport = async ({ payload, token }) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Support_Create, "POST", payload, token);

export const sendMessage = async ({ id, payload, token }) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Send_Message(id), "POST", payload, token);


//Loyaltiy
export const updateLoyaltiySetting = async ({ payload, token }) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Update_loyaltiy_Setting, "POST", payload, token);


//Phone Requests
export const approvePhoneRequest = async ({ id, token }) => {
  console.log("Approve Phone Request - ID:", id);
  console.log("Approve Phone Request - Token:", token);
  console.log("Approve Phone Request - URL:", API_ENDPOINTS.SETTINGS.Approve_Phone_Request(id));
  try {
    const result = await apiCall(API_ENDPOINTS.SETTINGS.Approve_Phone_Request(id), "POST", undefined, token);
    console.log("Approve Phone Request - Success:", result);
    return result;
  } catch (error) {
    console.log("Approve Phone Request - Error:", error);
    throw error;
  }
};

export const declinePhoneRequest = async ({ id, token }) => {
  console.log("Decline Phone Request - ID:", id);
  console.log("Decline Phone Request - Token:", token);
  console.log("Decline Phone Request - URL:", API_ENDPOINTS.SETTINGS.Decline_Phone_Request(id));
  try {
    const result = await apiCall(API_ENDPOINTS.SETTINGS.Decline_Phone_Request(id), "POST", undefined, token);
    console.log("Decline Phone Request - Success:", result);
    return result;
  } catch (error) {
    console.log("Decline Phone Request - Error:", error);
    throw error;
  }
};

export const updatePhoneVisibility = async ({ is_phone_visible, token }) => {
  console.log("Update Phone Visibility - is_phone_visible:", is_phone_visible);
  console.log("Update Phone Visibility - Token:", token);
  try {
    const result = await apiCall(
      API_ENDPOINTS.SETTINGS.Phone_Visibility, 
      "POST", 
      { is_phone_visible }, 
      token
    );
    console.log("Update Phone Visibility - Success:", result);
    return result;
  } catch (error) {
    console.log("Update Phone Visibility - Error:", error);
    throw error;
  }
};

//Wallet Withdraw
export const withdrawWallet = async (payload, token) => {
  console.log("Withdraw Wallet - Payload:", payload);
  console.log("Withdraw Wallet - Token:", token);
  try {
    const result = await apiCall(API_ENDPOINTS.GENERAL.Wallet_Withdraw, "POST", payload, token);
    console.log("Withdraw Wallet - Success:", result);
    return result;
  } catch (error) {
    console.log("Withdraw Wallet - Error:", error);
    throw error;
  }
};

// Review Replies - Store Reviews
export const replyToStoreReview = async (reviewId, payload, token) => {
  return await apiCall(API_ENDPOINTS.SETTINGS.Reply_To_Store_Review(reviewId), "POST", payload, token);
};

export const updateStoreReviewReply = async (reviewId, payload, token) => {
  return await apiCall(API_ENDPOINTS.SETTINGS.Update_Store_Review_Reply(reviewId), "PUT", payload, token);
};

export const deleteStoreReviewReply = async (reviewId, token) => {
  return await apiCall(API_ENDPOINTS.SETTINGS.Delete_Store_Review_Reply(reviewId), "DELETE", undefined, token);
};

// Review Replies - Product Reviews
export const replyToProductReview = async (reviewId, payload, token) => {
  return await apiCall(API_ENDPOINTS.SETTINGS.Reply_To_Product_Review(reviewId), "POST", payload, token);
};

export const updateProductReviewReply = async (reviewId, payload, token) => {
  return await apiCall(API_ENDPOINTS.SETTINGS.Update_Product_Review_Reply(reviewId), "PUT", payload, token);
};

export const deleteProductReviewReply = async (reviewId, token) => {
  return await apiCall(API_ENDPOINTS.SETTINGS.Delete_Product_Review_Reply(reviewId), "DELETE", undefined, token);
};