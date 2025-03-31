import axios from 'axios';
import API_ENDPOINTS from '../config/api';

// Set default base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Add request interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if it's not already a login request
    if (error.response?.status === 401 && !error.config.url.includes('/api/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios; 