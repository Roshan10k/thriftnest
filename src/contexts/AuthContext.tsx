import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { api, saveTokens, clearTokens } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken?: string, refreshToken?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    avatar: raw.avatar as string | undefined,
    role: (raw.role as User['role']) ?? 'buyer',
    phone: String(raw.phone ?? ''),
    location: String(raw.location ?? ''),
    memberSince: raw.memberSince ? new Date(raw.memberSince as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    verified: Boolean(raw.verified),
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    responseRate: Number(raw.responseRate ?? 0),
    salesCount: Number(raw.salesCount ?? 0),
    purchaseCount: Number(raw.purchaseCount ?? 0),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setIsLoading(false); return; }
    api.auth.me()
      .then((res) => setUser(toUser(res.data)))
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((loggedInUser: User, accessToken?: string, refreshToken?: string) => {
    if (accessToken && refreshToken) saveTokens(accessToken, refreshToken);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export { toUser };
