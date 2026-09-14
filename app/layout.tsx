import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
// Self-hosted (bundled with the site) so visitors' browsers never contact Google Fonts.
import '@fontsource-variable/google-sans-flex';
import { ThemeRegistry } from '../src/theme/ThemeRegistry';
import '../src/app/globals.css';

export const metadata: Metadata = {
  title: 'Callfog',
  description: 'Private video and audio calls with a link. No sign-up.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F9FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1415' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
