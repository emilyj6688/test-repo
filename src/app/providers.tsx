'use client';

import React from 'react';
import { AuthProvider } from '@/context/auth-context';
import { LanguageProvider } from '@/context/language-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </AuthProvider>
  );
}
