import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Liga de Fútbol Profesional',
  description: 'Sistema de Gestión Financiera y Deportiva',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <body className="bg-neutral-950 text-neutral-300 font-sans antialiased selection:bg-red-900 selection:text-white font-light tracking-wide">
        {children}
      </body>
    </html>
  );
}
