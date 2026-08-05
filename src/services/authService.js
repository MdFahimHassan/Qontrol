import api from './api';

export const authService = {
  login: async (credentials) => {
    // credentials: { email, password } or { username, password }
    const response = await api.post('/api/auth/login', credentials);
    return response.data; // Expecting { token, user }[cite: 1]
  },

  register: async (userData) => {
    // userData: { username, email, password }
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
};