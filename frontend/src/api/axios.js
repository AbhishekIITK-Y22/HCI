import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  // Match backend CORS config
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Don't reject if status is 401
  }
});

// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ensure credentials are always sent
  config.withCredentials = true;
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor: Handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(response => {
  return response;
}, async (error) => {
  const originalRequest = error.config;

  // Only attempt refresh if:
  // 1. It's a 401 error
  // 2. It's not the login endpoint
  // 3. It's not the refresh endpoint itself
  // 4. It's not already retrying
  if (
    error.response?.status === 401 && 
    !originalRequest._retry && 
    originalRequest.url !== '/auth/refresh' &&
    originalRequest.url !== '/auth/login'
  ) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return api(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post('/auth/refresh');
      const newAccessToken = data.accessToken;
      localStorage.setItem('accessToken', newAccessToken);
      api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
      originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
      
      processQueue(null, newAccessToken);
      isRefreshing = false;
      return api(originalRequest);

    } catch (refreshError) {
      console.error('Unable to refresh token', refreshError);
      processQueue(refreshError, null);
      isRefreshing = false;
      localStorage.removeItem('accessToken');
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
});

export default api;
