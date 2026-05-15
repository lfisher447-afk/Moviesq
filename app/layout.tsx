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

// Orphaned Components Connected Here:
import DevToolProtection from '@/components/dev-tool-protection';
import PWAPrompt from '@/components/pwa-prompt';
import ScrollToTop from '@/components/scroll-to-top';
import AuthGateModal from '@/components/auth-gate-modal';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'OMNIMUX OMEGA | The Nexus of Cinema', template: '%s | OMNIMUX OMEGA' },
  description: 'The ultimate OMSS-powered streaming nexus. Experience 4K HDR cinema, real-time encrypted watch parties, neural-adaptive vaults, AI search, WebTorrent streaming, and more.',
  manifest: '/manifest.json',
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
      </head>
      <body className="antialiased bg-[#030508] text-white selection:bg-[#E50914]/30">
        <AuthProvider>
          <NextTopLoader color="#E50914" height={3} showSpinner={false} />
          <Toaster position="bottom-right" />
          
          <DevToolProtection />
          <ScrollToTop />
          <PWAPrompt />
          <AuthGateModal />

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
