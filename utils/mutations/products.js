import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Create Product
// payload = FormData with name, category_id, brand, description, price, discount_price, has_variants, status, video(file?), images[](file[])
export const createProduct = async (payload, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Create, "POST", payload, token);

// Update Product
// payload = same structure as Create Product
export const updateProduct = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Update(id), "POST", payload, token);

export const deleteProduct = async (id, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Delete(id), "DELETE", undefined, token);

// Variants
// payload = FormData with sku, color, size, price, discount_price, stock, images[](file[])
export const createProductVariant = async (productId, payload, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.VariantCreate(productId), "POST", payload, token);

export const updateProductVariant = async (productId, variantId, payload, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.VariantUpdate(productId, variantId), "POST", payload, token);

export const deleteProductVariant = async (productId, variantId, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.VariantDelete(productId, variantId), "DELETE", undefined, token);

// Bulk Prices
// payload = { prices: [ { min_quantity: 10, amount: 90000, discount_percent: 10 }, { min_quantity: 50, amount: 85000, discount_percent: 15 } ] }
export const setBulkPrices = async (productId, payload, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.BulkPrices(productId), "POST", payload, token);

// Attach Delivery Options
// payload = { delivery_option_ids: [1, 2] }
export const attachDeliveryOptions = async (productId, payload, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.AttachDeliveryOptions(productId), "POST", payload, token);

// Mark as Sold
export const markAsSold = async (productId, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Product_Mark_As_Sold(productId), "POST", undefined, token);

// Mark as Unavailable
export const markAsUnavailable = async (productId, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Product_Mark_As_Unavailable(productId), "POST", undefined, token);

// Mark as Available
export const markAsAvailable = async (productId, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Product_Mark_As_Available(productId), "POST", undefined, token);