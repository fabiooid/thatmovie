import type { Metadata } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'That Movie',
  description: 'Describe a movie you remember. We will try to find it.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn('dark font-sans', geist.variable, instrumentSerif.variable)}
    >
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
