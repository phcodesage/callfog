import type { ReactNode } from 'react';
import '../src/app/globals.css';

export const metadata = {
  title: 'Callfog',
  description: 'Anonymous, quick video and audio calls. Talk, then vanish.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
