import axios from 'axios';
import { handleMockApi } from './mockStore.js';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const realApi = axios.create({ baseURL: `${API_URL}/api`, timeout: 1000 });

realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let useMock = false;

async function request(method, url, data) {
  if (useMock) {
    try {
      const res = handleMockApi(method, url, data);
      return { data: res, status: 200 };
    } catch (err) {
      return Promise.reject(err);
    }
  }

  try {
    const res = await realApi({ method, url, data });
    return res;
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      useMock = true;
      try {
        const res = handleMockApi(method, url, data);
        return { data: res, status: 200 };
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }
    return Promise.reject(err);
  }
}

const api = {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, data),
  patch: (url, data) => request('PATCH', url, data),
  delete: (url) => request('DELETE', url),
};

export const errMsg = (e) => e.response?.data?.error || e.message || 'Something went wrong';

export default api;
