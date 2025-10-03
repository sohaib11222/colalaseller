import axios from 'axios';
import { getToken, getOnboardingToken } from './tokenStorage';

// Custom Error Class for API errors
class ApiError extends Error {
  constructor(data, statusText, message, statusCode) {
    super();
    this.data = data;
    this.message = message;
    this.statusText = statusText || '';
    this.statusCode = statusCode;
  }
}

// API call function using axios
const apiCall = async (url, method, data, token) => {
  let headers = {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  // If data is FormData, adjust Content-Type header
  if (data && data instanceof FormData) {
    headers['Content-Type'] = 'multipart/form-data';
  }

  try {
    console.log(`Making ${method} request to:`, url);
    console.log("Headers:", headers);
    console.log("Data:", data);
    
    let response;
    switch (method) {
      case 'GET':
        response = await axios.get(url, { headers });
        break;
      case 'POST':
        response = await axios.post(url, data, { headers });
        break;
      case 'PUT':
        response = await axios.put(url, data, { headers });
        break;
      case 'PATCH':
        response = await axios.patch(url, data, { headers });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers });
        break;
      default:
        throw new Error('Unsupported HTTP method');
    }

    // Return the response data
    return response.data;
  } catch (error) {
    console.log("Full error object:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.log("Response data:", error.response.data);
      console.log("Response status:", error.response.status);
      console.log("Response headers:", error.response.headers);
      // Handle Axios errors
      throw new ApiError(
        error.response.data,
        error.response.data?.status || error.response.statusText,
        error.response.data?.message || 'Something went wrong',
        error.response.status
      );
    } else {
      // Handle non-Axios errors (like network issues)
      throw new ApiError(
        undefined,
        'Network or server error occurred',
        'Something went wrong'
      );
    }
  }
};

// Enhanced API call function that automatically includes token
const apiCallWithAuth = async (url, method, data) => {
  const token = await getToken();
  return apiCall(url, method, data, token);
};

// Enhanced API call function that automatically includes onboarding token
const apiCallWithOnboardingAuth = async (url, method, data) => {
  const token = await getOnboardingToken();
  return apiCall(url, method, data, token);
};

export { apiCall, apiCallWithAuth, apiCallWithOnboardingAuth, ApiError };
