import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

type User = {
  email: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    await fetchUser();
  };

  const signup = async (email: string, password: string, username: string) => {
    await api.post('/auth/signup', { email, password, username });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await api.get('/protected', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
    } catch {
      logout();
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
