// Utility functions for API communication

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const makeRequest = async (url, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP error! status: ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (!navigator.onLine) {
      throw new ApiError('No internet connection', 0);
    }
    
    throw new ApiError('Network error occurred', 0, error);
  }
};

// Auth API functions
export const authApi = {
  register: async (userData) => {
    const response = await makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  login: async (credentials) => {
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  logout: async () => {
    try {
      await makeRequest('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  getCurrentUser: async () => {
    return await makeRequest('/auth/me');
  },

  updateProfile: async (profileData) => {
    return await makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData) => {
    return await makeRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },
};

// Posts API functions
export const postsApi = {
  getAllPosts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/posts?${queryString}` : '/posts';
    return await makeRequest(url);
  },

  getPost: async (id) => {
    return await makeRequest(`/posts/${id}`);
  },

  createPost: async (postData) => {
    return await makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  updatePost: async (id, postData) => {
    return await makeRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  deletePost: async (id) => {
    return await makeRequest(`/posts/${id}`, {
      method: 'DELETE',
    });
  },

  likePost: async (id) => {
    return await makeRequest(`/posts/${id}/like`, {
      method: 'POST',
    });
  },

  addComment: async (id, commentData) => {
    return await makeRequest(`/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },
};

// Users API functions
export const usersApi = {
  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    return await makeRequest(url);
  },

  getUser: async (id) => {
    return await makeRequest(`/users/${id}`);
  },

  updateUser: async (id, userData) => {
    return await makeRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id) => {
    return await makeRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  getUserStats: async (id) => {
    return await makeRequest(`/users/${id}/stats`);
  },
};

export { ApiError, getAuthToken, setAuthToken };
