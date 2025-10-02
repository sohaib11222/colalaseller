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
  },

  SERVICES: {
    GetAll: `${API_DOMAIN}/seller/service`, // GET
    Create: `${API_DOMAIN}/seller/service/create`, // POST
    Update: (id) => `${API_DOMAIN}/seller/service/update/${id}`, // POST
    Delete: (id) => `${API_DOMAIN}/seller/service/delete/${id}`, // DELETE
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
};

export { API_DOMAIN, API_ENDPOINTS };
