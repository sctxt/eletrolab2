import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, clearSession, getUser, profileApi, saveSession } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(Boolean(getUser()));

  useEffect(() => {
    if (getUser()) {
      profileApi
        .get()
        .then((data) => {
          setUser(data.user);
          saveSession({ token: getTokenValue(), user: data.user });
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const login = useCallback(async (type, credentials) => {
    const data =
      type === 'aluno'
        ? await authApi.studentLogin(credentials)
        : await authApi.teacherLogin(credentials);
    saveSession(data);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const data = await profileApi.get();
    setUser(data.user);
    saveSession({ token: getTokenValue(), user: data.user });
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

function getTokenValue() {
  return localStorage.getItem('lab_eletronica_token');
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
