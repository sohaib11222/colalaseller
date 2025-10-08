import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getProducts = async (token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.GetAll, "GET", undefined, token);

export const getProductDetails = async (id, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Product_Details(id), "GET", undefined, token);

export const getProductChartData = async (id, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Get_Product_Chart_Data(id), "GET", undefined, token);

export const getProductStatistics = async (id, token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.Get_Product_Statistics(id), "GET", undefined, token);

export const getBulkTemplate = async (token) =>
  await apiCall(API_ENDPOINTS.PRODUCTS.BulkTemplate, "GET", undefined, token);