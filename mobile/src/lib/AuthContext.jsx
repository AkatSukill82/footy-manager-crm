import React, { createContext, useState, useContext, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { base44, setClientToken, clearUserCache } from '../api/base44Client';
import { appParams, getToken, setToken, clearToken } from './app-params';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const token = await getToken();
      if (token) {
        setClientToken(token);
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
    } catch (e) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Connexion requise' });
        await clearToken();
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loginWithToken = async (token) => {
    await setToken(token);
    setClientToken(token);
    await checkUserAuth();
  };

  const navigateToLogin = async () => {
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      const loginUrl = `${appParams.appBaseUrl}/auth/login?redirect_uri=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUrl);
      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const token = parsed.queryParams?.access_token;
        if (token) {
          await loginWithToken(token);
        }
      }
    } catch (e) {
      console.error('Login error:', e);
    }
  };

  const logout = async () => {
    clearUserCache();
    await clearToken();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
      loginWithToken,
      checkAppState: initAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
