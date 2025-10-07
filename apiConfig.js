const API_DOMAIN = "https://colala.hmstech.xyz/api";

const API_ENDPOINTS = {
  AUTH: {
    StartOnboarding: `${API_DOMAIN}/auth/seller/start`, // POST
    ForgetPassword: `${API_DOMAIN}/auth/forget-password`, // POST
    VerifyOtp: `${API_DOMAIN}/auth/verify-otp`, // POST
    Login: `${API_DOMAIN}/auth/login`, // POST
    ResetPassword: `${API_DOMAIN}/auth/reset-password`, // POST
  },

  SELLER: {
    // Level 1
    ProfileMedia: `${API_DOMAIN}/seller/onboarding/level1/profile-media`, // POST
    CategoriesSocial: `${API_DOMAIN}/seller/onboarding/level1/categories-social`, // POST
    // Level 2
    BusinessDetails: `${API_DOMAIN}/seller/onboarding/level2/business-details`, // POST
    Documents: `${API_DOMAIN}/seller/onboarding/level2/documents`, // POST
    // Level 3
    PhysicalStore: `${API_DOMAIN}/seller/onboarding/level3/physical-store`, // POST
    UtilityBill: `${API_DOMAIN}/seller/onboarding/level3/utility-bill`, // POST
    Address: `${API_DOMAIN}/seller/onboarding/level3/address`, // POST
    DeliveryPricing: `${API_DOMAIN}/seller/onboarding/level3/delivery`, // POST
    Theme: `${API_DOMAIN}/seller/onboarding/level3/theme`, // POST

    Progress: `${API_DOMAIN}/seller/onboarding/progress`, // GET
    Submit: `${API_DOMAIN}/seller/onboarding/submit`, // POST
    StoreOverview: `${API_DOMAIN}/seller/onboarding/store/overview`, // GET

    LevelDetail: (level) =>
      `${API_DOMAIN}/seller/onboarding/onboarding/level/${level}`, // GET

    Addresses: `${API_DOMAIN}/seller/onboarding/store/addresses`, // GET
    Deliveries: `${API_DOMAIN}/seller/onboarding/store/delivery`, // GET
    SocialLinks: `${API_DOMAIN}/seller/onboarding/store/social-links`, // GET
    StoreCategories: `${API_DOMAIN}/seller/onboarding/store/categories`, // GET
    CatalogCategories: `${API_DOMAIN}/seller/onboarding/catalog/categories`, // GET
    Delete_Address: (id) => `${API_DOMAIN}/seller/onboarding/level3/address/${id}`, // DELETE
  },

  PRODUCTS: {
    GetAll: `${API_DOMAIN}/seller/products`, // GET
    Product_Details: (id) => `${API_DOMAIN}/buyer/product-details/${id}`, // GET
    Get_Product_Chart_Data: (id) => `${API_DOMAIN}/seller/products/${id}/stats`, // GET
    Get_Product_Statistics: (id) => `${API_DOMAIN}/seller/products/${id}/stats/totals`, // GET
    Create: `${API_DOMAIN}/seller/products/create`, // POST
    Update: (id) => `${API_DOMAIN}/seller/products/update/${id}`, // POST
    Delete: (id) => `${API_DOMAIN}/seller/products/delete/${id}`, // DELETE

    VariantCreate: (productId) =>
      `${API_DOMAIN}/seller/products/${productId}/variants/create`, // POST
    VariantUpdate: (productId, variantId) =>
      `${API_DOMAIN}/seller/products/${productId}/variants/update/${variantId}`, // POST
    VariantDelete: (productId, variantId) =>
      `${API_DOMAIN}/seller/products/${productId}/variants/delete/${variantId}`, // DELETE

    BulkPrices: (productId) =>
      `${API_DOMAIN}/seller/products/${productId}/bulk-prices`, // POST
    AttachDeliveryOptions: (productId) =>
      `${API_DOMAIN}/seller/products/${productId}/delivery-options`, // POST

    Product_Mark_As_Sold: (productId) =>
      `${API_DOMAIN}/seller/products/${productId}/mark-sold`, // POST
    Product_Mark_As_Unavailable: (productId) =>
      `${API_DOMAIN}/seller/products/${productId}/mark-unavailable`, // POST

    Product_Mark_As_Available: (productId) =>
      `${API_DOMAIN}/seller/products/${productId}/mark-available`, // POST

    Product_Quantity: (productId) =>
      `${API_DOMAIN}/seller/products/${productId}/quantity`, // POST
  },



  SERVICES: {
    GetAll: `${API_DOMAIN}/seller/services/my-services`, // GET
    Service_Details: (id) => `${API_DOMAIN}/seller/service/${id}`, // GET
    Get_Service_Chart_Data: (id) => `${API_DOMAIN}/seller/services/${id}/stats`, // GET
    Get_Service_Statistics: (id) => `${API_DOMAIN}/seller/services/${id}/stats/totals`, // GET
    Create: `${API_DOMAIN}/seller/service/create`, // POST
    Update: (id) => `${API_DOMAIN}/seller/service/update/${id}`, // POST
    Delete: (id) => `${API_DOMAIN}/seller/service/delete/${id}`, // DELETE

    Service_Mark_As_Unavailable: (serviceId) =>
      `${API_DOMAIN}/seller/services/${serviceId}/mark-unavailable`, // POST

    Service_Mark_As_Available: (serviceId) =>
      `${API_DOMAIN}/seller/services/${serviceId}/mark-available`, // POST
  },

  POSTS: {
    GetAll: `${API_DOMAIN}/posts`, // GET
    Create: `${API_DOMAIN}/posts`, // POST
    GetSingle: (id) => `${API_DOMAIN}/posts/${id}`, // GET
    Update: (id) => `${API_DOMAIN}/posts/${id}`, // POST
    Delete: (id) => `${API_DOMAIN}/posts/${id}`, // DELETE
    Like: (id) => `${API_DOMAIN}/posts/${id}/like`, // POST

    Comments: (id) => `${API_DOMAIN}/posts/${id}/comments`, // GET
    AddComment: (id) => `${API_DOMAIN}/posts/${id}/comments`, // POST
    DeleteComment: (postId, commentId) =>
      `${API_DOMAIN}/posts/${postId}/comments/${commentId}`, // DELETE

    Share: (id) => `${API_DOMAIN}/posts/${id}/share`, // POST
  },
  SETTINGS: {
    Balance: `${API_DOMAIN}/buyer/getBalance`, // GET
    FAQs: `${API_DOMAIN}/faqs/category/name/general`, // GET
    Escrow_Wallet: `${API_DOMAIN}/faqs/escrow`, // GET
    Escrow_History: `${API_DOMAIN}/faqs/escrow/history`, // GET
    Transaction_History: `${API_DOMAIN}/user/transactions`, // GET
    Notifications: `${API_DOMAIN}/notifications`, // GET
    Mark_As_Read_Notification: (id) => `${API_DOMAIN}/notifications/mark-as-read/${id}`, // POST

    //Announcements
    List_Of_Announcements: `${API_DOMAIN}/seller/announcements`, // GET
    Create_Announcement: `${API_DOMAIN}/seller/announcements`, // POST
    Update_Announcement: (id) => `${API_DOMAIN}/seller/announcements/${id}`, // POST
    Delete_Announcement: (id) => `${API_DOMAIN}/seller/announcements/${id}`, // DELETE

    //Banners
    List_Of_Banners: `${API_DOMAIN}/seller/banners`, // GET
    Create_Banner: `${API_DOMAIN}/seller/banners`, // POST
    Update_Banner: (id) => `${API_DOMAIN}/seller/banners/${id}`, // POST
    Delete_Banner: (id) => `${API_DOMAIN}/seller/banners/${id}`, // DELETE

    //Coupons
    List_Of_Coupons: `${API_DOMAIN}/seller/coupons`, // GET
    Create_Coupon: `${API_DOMAIN}/seller/coupons`, // POST
    Update_Coupon: (id) => `${API_DOMAIN}/seller/coupons/${id}`, // POST
    Delete_Coupon: (id) => `${API_DOMAIN}/seller/coupons/${id}`, // DELETE

    //Plans + Subcriptions
    Get_All_Plans: `${API_DOMAIN}/seller/plans`, // GET
    Get_Subcription_Status: `${API_DOMAIN}/seller/subscriptions`, // GET
    Add_Subscription: `${API_DOMAIN}/seller/subscriptions`, // POST
    Cancel_Subscription: (id) => `${API_DOMAIN}/seller/subscriptions/${id}/cancel`, // PATCH

    //Cards
    List_Of_Cards: `${API_DOMAIN}/seller/cards`, // GET
    Create_Card: `${API_DOMAIN}/seller/cards`, // POST
    Update_Card: (id) => `${API_DOMAIN}/seller/cards/update/${id}`, // POST
    Delete_Card: (id) => `${API_DOMAIN}/seller/cards/${id}`, // DELETE
    Active_Card: (id) => `${API_DOMAIN}/seller/cards/${id}/active`, // PATCH
    Autodebit_Card: (id) => `${API_DOMAIN}/seller/cards/${id}/autodebit`, // PATCH

    //Reviews
    List_Of_Reviews: `${API_DOMAIN}/user-reveiws`, // GET


    //Boosts Data
    Boosts_List: `${API_DOMAIN}/seller/boosts`, // GET
    Boost_Preview: `${API_DOMAIN}/seller/boosts/preview`, // POST
    Boost_Create: `${API_DOMAIN}/seller/boosts`, // POST
    Boost_Update: (id) => `${API_DOMAIN}/seller/boosts/update/${id}`,
    Single_Boost: (id) => `${API_DOMAIN}/seller/boosts/${id}`, // GET
    Boost_Status: (id) => `${API_DOMAIN}/seller/boosts/${id}/status`, // PATCH


    //Support 
    Support_List: `${API_DOMAIN}/buyer/support/tickets`, // GET
    Support_Create: `${API_DOMAIN}/buyer/support/tickets`, // POST
    Support_Detail: (id) => `${API_DOMAIN}/buyer/support/tickets/${id}`, // GET
    Send_Message: (id) => `${API_DOMAIN}/buyer/support/messages`, // POST

    My_Points: `${API_DOMAIN}/my-points`, // GET
    Analytics: `${API_DOMAIN}/seller/analytics`, // GET
    loyaltiyPoints: `${API_DOMAIN}/seller/loyalty/customers`, // GET
    Get_loyaltiy_Setting: `${API_DOMAIN}/seller/loyalty/settings`, // GET
    Update_loyaltiy_Setting: `${API_DOMAIN}/seller/loyalty/settings`, // POST


  },
  GENERAL: {
    Categories: `${API_DOMAIN}/categories`, // GET
    Brands: `${API_DOMAIN}/brands`, // GET
    Wallet_TopUp: `${API_DOMAIN}/wallet/top-up`, // POST
  },
  ORDERS: {
    Get_All_Orders: `${API_DOMAIN}/seller/orders`, // GET
    Order_Detail: (id) => `${API_DOMAIN}/seller/orders/${id}`,
    Mark_For_Delivery: (id) => `${API_DOMAIN}/seller/orders/${id}/out-for-deliver`,
    Verify_Code: (id) => `${API_DOMAIN}/seller/orders/${id}/delivered`,
  },
  CHATS: {
    List: `${API_DOMAIN}/seller/chat`,
    Details: (chatId) => `${API_DOMAIN}/seller/chat/${chatId}/messages`,
    Send: (chatId) => `${API_DOMAIN}/seller/chat/${chatId}/send`,
  },

  STORES: {
    // GET -> fetch current store + all_categories
    // POST -> create/update store builder payload
    Builder: `${API_DOMAIN}/seller/store/builder`,
  },

  LEADERBOARD: {
    Sellers: `${API_DOMAIN}/leaderboard/sellers`, // GET
  },
};

export { API_DOMAIN, API_ENDPOINTS };
