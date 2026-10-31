import { createContext, useContext, useState } from 'react';
import api from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const savedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(savedUser());

  const finish = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (reg_no, password) => finish((await api.post('/auth/login', { reg_no, password })).data);
  const register = async (reg_no, name, password) =>
    finish((await api.post('/auth/register', { reg_no, name, password })).data);
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}
