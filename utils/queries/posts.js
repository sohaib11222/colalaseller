import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getPosts = async (token) =>
  await apiCall(API_ENDPOINTS.POSTS.GetAll, "GET", undefined, token);

export const getSinglePost = async (id, token) =>
  await apiCall(API_ENDPOINTS.POSTS.GetSingle(id), "GET", undefined, token);

export const getPostComments = async (id, token) =>
  await apiCall(API_ENDPOINTS.POSTS.Comments(id), "GET", undefined, token);
