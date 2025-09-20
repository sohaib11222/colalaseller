import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Create Post
// payload = FormData with body, visibility, media[](file)
export const createPost = async (payload, token) =>
  await apiCall(API_ENDPOINTS.POSTS.Create, "POST", payload, token);

// Update Post
// payload = same as create
export const updatePost = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.POSTS.Update(id), "POST", payload, token);

export const deletePost = async (id, token) =>
  await apiCall(API_ENDPOINTS.POSTS.Delete(id), "DELETE", undefined, token);

// Like/Unlike Post (no payload)
export const likePost = async (id, token) =>
  await apiCall(API_ENDPOINTS.POSTS.Like(id), "POST", undefined, token);

// Add Comment
// payload = { body: "Great post!" }
export const addComment = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.POSTS.AddComment(id), "POST", payload, token);

export const deleteComment = async (postId, commentId, token) =>
  await apiCall(API_ENDPOINTS.POSTS.DeleteComment(postId, commentId), "DELETE", undefined, token);

// Share Post
// payload = { channel: "facebook" }
export const sharePost = async (id, payload, token) =>
  await apiCall(API_ENDPOINTS.POSTS.Share(id), "POST", payload, token);
