import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';

// Add a request interceptor to add the auth token to all requests
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

export default axios; 