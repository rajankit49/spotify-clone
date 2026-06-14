import axios from 'axios';

// Create an Axios instance pointing to our backend
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // This is crucial for sending/receiving JWT cookies
});

export default api;
