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
    
    // Sync localStorage token to cookie if it exists
    if (storedToken) {
      document.cookie = `token=${storedToken}; path=/; max-age=86400; SameSite=Lax`;
    }
    
    // Fallback to cookie token if localStorage was cleared
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    const activeToken = storedToken || cookieToken;

    // Attempt to fetch current user if token exists but user doesn't
    if (activeToken && !user) {
      // If we only have cookie token, sync it back to localStorage
      if (!storedToken && cookieToken) {
        localStorage.setItem('token', cookieToken);
      }
      dispatch(getCurrentUser());
    }
  }, [token, user, pathname, router, dispatch]);

  return <>{children}</>;
}
