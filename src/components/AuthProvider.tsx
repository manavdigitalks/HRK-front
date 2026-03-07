'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { getCurrentUser } from '@/redux/slices/authSlice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken && !user) {
      dispatch(getCurrentUser());
    }

    if (!storedToken && pathname !== '/login') {
      router.push('/login');
    }

    if (storedToken && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [token, user, pathname, router, dispatch]);

  return <>{children}</>;
}
