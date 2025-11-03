'use client';

import { SessionProvider } from 'next-auth/react';
import { ReduxProvider } from '@/store/ReduxProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}
