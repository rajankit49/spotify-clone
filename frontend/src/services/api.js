import axios from 'axios';

// Create an Axios instance pointing to our backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // This is crucial for sending/receiving JWT cookies
});

// Add a request interceptor to attach JWT token to Authorization header if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
