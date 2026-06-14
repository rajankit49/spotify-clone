import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We can add a "me" endpoint later to check if token is still valid.
    // For now, we will rely on localStorage as a quick persistent state, 
    // though the real token is in the httpOnly cookie.
    const loggedInUser = localStorage.getItem('spotify_user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await api.post('/auth/login', {
        username: usernameOrEmail,
        email: usernameOrEmail,
        password,
      });
      setUser(response.data.user);
      localStorage.setItem('spotify_user', JSON.stringify(response.data.user));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (username, email, password, role) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        role,
      });
      setUser(response.data.user);
      localStorage.setItem('spotify_user', JSON.stringify(response.data.user));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      localStorage.removeItem('spotify_user');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
