'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, setToken, clearToken, getToken } from '@/lib/api';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await userApi.getProfile();
      setUser(userData);
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const response = await userApi.login({ email, password });
    setToken(response.access_token);
    setUser(response.user);
    router.push('/inbox');
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, login, logout };
}
