import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import Loader from '../components/ui/loader';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter', 
  weight: ['900'] 
});

const robotoMono = Roboto_Mono({ 
  subsets: ['latin'], 
  variable: '--font-roboto-mono', 
  weight: ['300', '400'] 
});

export const metadata: Metadata = {
  title: 'stuffimade.withai',
  description: 'a comfy place to drop your vibe-coded cool shit. built at the speed of thought.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-white text-black overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}