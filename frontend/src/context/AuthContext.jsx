import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { demoLogin, getCurrentUser } from '../services/authService.js';
import { getStoredToken, storeToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = getStoredToken();

    if (!token) {
      setIsLoading(false);
      return () => { active = false; };
    }

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        storeToken(null);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const login = useCallback(async (email) => {
    const result = await demoLogin(email);
    if (!result?.access_token || !result?.user) {
      throw new Error('The login response did not contain an access token and user.');
    }
    storeToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    storeToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
