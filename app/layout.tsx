import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Roboto_Flex } from 'next/font/google';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { ThemeRegistry } from '../src/theme/ThemeRegistry';
import '../src/app/globals.css';

const robotoFlex = Roboto_Flex({
  subsets: ['latin'],
  axes: ['wdth', 'opsz'],
  display: 'swap',
  variable: '--font-roboto-flex',
});

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
    <html lang="en" className={robotoFlex.variable} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
