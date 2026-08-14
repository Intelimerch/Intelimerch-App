// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setToken, clearToken } from '../services/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const response = await authAPI.login(identifier, password);

    // Backend returns the user object under "data", not "user"
    const loggedInUser = response.data;

    setToken(response.accessToken);
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));

    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore errors on logout
    }
    clearToken();
    setUser(null);
    localStorage.removeItem('user');
  };

  const register = async (data) => {
    return await authAPI.registerArtist(data);
  };

  const refreshProfile = async () => {
    const response = await authAPI.getProfile();
    // Adjust this if /auth/me/profile also nests the user under "data"
    // rather than "user" — worth checking in Swagger.
    const profileUser = response.data ?? response.user;
    setUser(profileUser);
    localStorage.setItem('user', JSON.stringify(profileUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, register, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}