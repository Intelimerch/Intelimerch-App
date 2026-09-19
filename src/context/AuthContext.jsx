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
    console.log('📦 Login response:', response);

    // ✅ FIXED: Extract user and tokens from the response
    const loggedInUser = response.user || response.data || response;
    const accessToken = response.accessToken || response.token;
    const refreshToken = response.refreshToken || null;

    // ✅ Ensure accountType is captured
    const userWithRole = {
      ...loggedInUser,
      accountType: loggedInUser.accountType || loggedInUser.role || 'USER'
    };

    // Store tokens
    setToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    // Store user
    setUser(userWithRole);
    localStorage.setItem('user', JSON.stringify(userWithRole));

    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore errors
    }
    clearToken();
    localStorage.removeItem('refreshToken');
    setUser(null);
    localStorage.removeItem('user');
  };

  const register = async (data) => {
    return await authAPI.registerArtist(data);
  };

  const refreshProfile = async () => {
    const response = await authAPI.getProfile();
    const profileUser = response.data ?? response.user ?? response;
    
    const profileUserWithRole = {
      ...profileUser,
      accountType: profileUser.accountType || profileUser.role || 'USER'
    };
    
    setUser(profileUserWithRole);
    localStorage.setItem('user', JSON.stringify(profileUserWithRole));
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