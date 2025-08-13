'use client';

import './globals.css';
import Providers from '@/app/Providers';
import DevIdTokenBridge from '@/app/components/DevIdTokenBridge';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV !== 'production' && <DevIdTokenBridge />}
      </body>
    </html>
  );
}
