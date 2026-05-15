// app/layout.tsx — SERVER COMPONENT
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import NextTopLoader from 'nextjs-toploader';
import { ClientShell } from '@/components/ClientShell';
import { ClientWrapper } from '@/components/ClientWrapper';
import { Navbar } from '@/components/Navbar';
import { initOmegaShield } from '@/lib/omegaShield';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'OMNIMUX OMEGA | The Nexus of Cinema', template: '%s | OMNIMUX OMEGA' },
  description: 'The ultimate OMSS-powered streaming nexus. Experience 4K HDR cinema, real-time encrypted watch parties, neural-adaptive vaults, AI search, WebTorrent streaming, and more.',
  keywords: ['Streaming', 'Watch Party', 'OMNIMUX', 'Cinema', 'Movies', '4K', 'HDR', 'Real-time Sync', 'Nexus', 'AI Search', 'WebTorrent'],
  authors: [{ name: 'Omnimux Foundation' }],
  creator: 'Omnimux Core Engine v15',
  openGraph: {
    title: 'OMNIMUX OMEGA | The Nexus of Cinema',
    description: 'The ultimate streaming nexus for movies, TV, watch parties, AI search, and more.',
    url: 'https://omnimux.vercel.app',
    siteName: 'OMNIMUX OMEGA',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OMNIMUX OMEGA | The Nexus of Cinema',
    description: 'Experience 4K HDR cinema and node-based streaming on the Edge.',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'OMNIMUX OMEGA' },
};

export const viewport: Viewport = {
  themeColor: '#E50914',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark scroll-smooth ${inter.variable} ${bebas.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(${initOmegaShield.toString()})();` }} />
        <style>{`
          @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          [data-theme="amoled"] { --bg-surface: #000000; }
          [data-theme="midnight"] { --bg-surface: #050510; --accent: #4f46e5; }
        `}</style>
      </head>
      <body className="antialiased bg-[#030508] text-white selection:bg-[#E50914]/30">
        <AuthProvider>
          <NextTopLoader
            color="#E50914"
            height={3}
            showSpinner={false}
            shadow="0 0 30px #E50914, 0 0 15px #E50914"
            zIndex={99998}
          />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'font-mono text-[10px] font-black tracking-widest uppercase',
              style: {
                background: '#0a0a0f',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '1rem',
                boxShadow: '0 20px 60px -10px rgba(0,0,0,0.95)',
                padding: '12px 20px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
              error: { iconTheme: { primary: '#E50914', secondary: '#000' } },
            }}
          />
          <ClientWrapper>
            <ClientShell>
              <Navbar />
              <main className="min-h-screen relative z-10">{children}</main>
            </ClientShell>
          </ClientWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
