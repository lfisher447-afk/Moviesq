'use client';
// components/ClientShell.tsx
// All client-only layout logic extracted from app/layout.tsx so that
// layout.tsx can remain a server component (required for metadata exports).

import {
  useState, useEffect, useRef,
  createContext, useContext,
} from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import {
  Zap, Wifi, WifiOff, Eye, Globe,
  Shield, ChevronUp,
} from 'lucide-react';

// ─── GLOBAL APP CONTEXT ───────────────────────────────────────────────────────
interface AppContextType {
  theme: 'dark' | 'amoled' | 'midnight';
  setTheme: (t: 'dark' | 'amoled' | 'midnight') => void;
  reducedMotion: boolean;
  isOnline: boolean;
  bandwidth: 'high' | 'medium' | 'low';
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  cinematicMode: boolean;
  setCinematicMode: (v: boolean) => void;
  debugMode: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useAppContext = () => useContext(AppContext);

// ─── SCROLL PROGRESS BAR ─────────────────────────────────────────────────────
function ScrollProgressIndicator() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0%' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-red-400 to-orange-500 z-[99999] shadow-[0_0_12px_rgba(229,9,20,0.8)]"
    />
  );
}

// ─── NETWORK STATUS MONITOR ───────────────────────────────────────────────────
function NetworkStatusMonitor({
  isOnline,
  bandwidth,
}: {
  isOnline: boolean;
  bandwidth: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!isOnline) { setVisible(true); return; }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [isOnline, bandwidth]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed bottom-24 right-6 z-[9998] flex items-center gap-3 px-5 py-3 rounded-2xl border text-[10px] font-black tracking-[0.2em] backdrop-blur-2xl shadow-2xl"
          style={{
            background: isOnline ? 'rgba(0,255,100,0.05)' : 'rgba(229,9,20,0.1)',
            borderColor: isOnline ? 'rgba(0,255,100,0.2)' : 'rgba(229,9,20,0.4)',
          }}
        >
          {isOnline
            ? <Wifi className="w-3.5 h-3.5 text-green-400" />
            : <WifiOff className="w-3.5 h-3.5 text-brand" />}
          <span className={isOnline ? 'text-green-400' : 'text-brand'}>
            {isOnline
              ? `NODE_ACTIVE · ${bandwidth.toUpperCase()}_BW`
              : 'CONNECTION_SEVERED'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── BACK TO TOP ──────────────────────────────────────────────────────────────
function BackToTop() {
  const { scrollYProgress } = useScroll();
  const [show, setShow] = useState(false);
  useEffect(
    () => scrollYProgress.on('change', v => setShow(v > 0.2)),
    [scrollYProgress],
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-[9997] w-12 h-12 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-2xl flex items-center justify-center hover:bg-brand hover:border-brand transition-all shadow-2xl group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronUp className="w-4 h-4 text-white group-hover:animate-bounce" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── CINEMATIC GRAIN OVERLAY ──────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none opacity-[0.025]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

// ─── AMBIENT CURSOR GLOW ──────────────────────────────────────────────────────
function AmbientCursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dot.current) {
        dot.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
      }
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div
      ref={dot}
      className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-0 transition-transform duration-700 ease-out"
      style={{ background: 'radial-gradient(circle, rgba(229,9,20,0.03) 0%, transparent 70%)' }}
    />
  );
}

// ─── SYSTEM STATUS TICKER ─────────────────────────────────────────────────────
function SystemTicker({ bandwidth, theme }: { bandwidth: string; theme: string }) {
  const nodes = [
    'NODE_A · ACTIVE', 'RELAY_EU · ONLINE', 'CDN_EDGE · SYNCED',
    'VAULT_ENC · AES-256', `BW · ${bandwidth.toUpperCase()}`,
    `THEME · ${theme.toUpperCase()}`,
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9996] h-6 bg-black/90 border-t border-white/5 backdrop-blur-xl overflow-hidden flex items-center">
      <div className="flex gap-12 animate-[ticker_20s_linear_infinite] whitespace-nowrap">
        {[...nodes, ...nodes, ...nodes].map((n, i) => (
          <span
            key={i}
            className="text-[8px] font-black tracking-[0.3em] text-gray-600 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-brand rounded-full shadow-[0_0_6px_rgba(229,9,20,0.8)]" />
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── KEYBOARD SHORTCUT GUIDE ──────────────────────────────────────────────────
function KeyboardShortcutOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const shortcuts = [
    { key: 'K', desc: 'Command Palette' },
    { key: 'C', desc: 'Toggle Cinema Mode' },
    { key: 'W', desc: 'Toggle Watchlist' },
    { key: 'F', desc: 'Fullscreen Player' },
    { key: '/', desc: 'Focus Search' },
    { key: 'Esc', desc: 'Close / Exit' },
    { key: '←→', desc: 'Seek Video ±10s' },
    { key: 'Space', desc: 'Play / Pause' },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99990] flex items-center justify-center bg-black/80 backdrop-blur-2xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-[0_40px_80px_rgba(0,0,0,0.9)]"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-display text-3xl text-white mb-6 tracking-widest">
              SHORTCUTS
            </h2>
            <div className="space-y-3">
              {shortcuts.map(s => (
                <div
                  key={s.key}
                  className="flex justify-between items-center text-[10px] font-black tracking-[0.2em] border-b border-white/5 pb-3"
                >
                  <span className="text-gray-400">{s.desc}</span>
                  <kbd className="bg-white/10 px-3 py-1 rounded-lg text-white border border-white/10">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── THEME SWITCHER ───────────────────────────────────────────────────────────
function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (t: any) => void;
}) {
  const themes = ['dark', 'amoled', 'midnight'] as const;
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed top-6 right-20 z-[9990]">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center hover:border-brand transition-all backdrop-blur-xl"
      >
        <Eye className="w-4 h-4 text-gray-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-0 bg-[#0a0a0f] border border-white/10 rounded-2xl p-3 space-y-2 shadow-2xl min-w-[140px]"
          >
            {themes.map(t => (
              <button
                key={t}
                onClick={() => { setTheme(t); setOpen(false); }}
                className={`w-full px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.2em] transition-all ${
                  theme === t
                    ? 'bg-brand text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PERFORMANCE METRICS OVERLAY (DEBUG) ──────────────────────────────────────
function PerfOverlay() {
  const [fps, setFps] = useState(60);
  const [mem, setMem] = useState(0);
  useEffect(() => {
    let frame: number;
    let last = performance.now();
    let frames = 0;
    const tick = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
        if ((performance as any).memory)
          setMem(Math.round((performance as any).memory.usedJSHeapSize / 1048576));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="fixed top-20 right-6 z-[9989] bg-black/80 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-xl font-mono text-[9px] text-green-400 space-y-1 pointer-events-none">
      <div className="flex gap-3">
        <span className="text-gray-500">FPS</span>
        <span>{fps}</span>
      </div>
      {mem > 0 && (
        <div className="flex gap-3">
          <span className="text-gray-500">MEM</span>
          <span>{mem}MB</span>
        </div>
      )}
      <div className="flex gap-3">
        <span className="text-gray-500">ENV</span>
        <span className="text-brand">PROD</span>
      </div>
    </div>
  );
}

// ─── ENHANCED FOOTER ──────────────────────────────────────────────────────────
function OmnimuxFooter() {
  const links = {
    Platform: ['Stream', 'Watch Party', 'Vault', 'Discovery'],
    Legal: ['Privacy Policy', 'Terms of Service', 'DMCA', 'Cookie Policy'],
    Network: ['Status Page', 'API Docs', 'CDN Nodes', 'Security'],
    Community: ['Discord', 'Twitter/X', 'GitHub', 'Newsletter'],
  };

  return (
    <footer className="border-t border-white/5 bg-[#030304] relative z-10 pb-10 pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-brand/5 to-transparent pointer-events-none" />
      <div className="max-w-[1800px] mx-auto px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-5xl text-brand mb-3 tracking-widest drop-shadow-[0_0_20px_rgba(229,9,20,0.5)]">
              OMNIMUX
            </div>
            <p className="text-gray-600 text-[9px] font-black tracking-[0.3em] leading-relaxed uppercase mb-6">
              Hyperflow Engineering<br />v4.0 · Edge Runtime
            </p>
            <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em]">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-green-500">AES-256 ENCRYPTED</span>
            </div>
          </div>
          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-[9px] font-black tracking-[0.3em] text-gray-500 uppercase mb-5">
                {section}
              </h4>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[10px] font-bold text-gray-600 hover:text-white transition-colors tracking-wider"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-black tracking-[0.3em] text-gray-600 uppercase">
            © 2026 OMNIMUX FOUNDATION · ALL TRANSMISSIONS RESERVED
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-gray-600">
              <Globe className="w-3 h-3" /> GLOBAL CDN ACTIVE
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-green-600">
              <Zap className="w-3 h-3" /> ALL SYSTEMS NOMINAL
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── CLIENT SHELL (main export) ───────────────────────────────────────────────
export function ClientShell({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'dark' | 'amoled' | 'midnight'>('dark');
  const [reducedMotion] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [bandwidth, setBandwidth] = useState<'high' | 'medium' | 'low'>('high');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cinematicMode, setCinematicMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Network monitoring
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);

    const conn = (navigator as any).connection;
    if (conn) {
      const update = () => {
        const speed = conn.downlink;
        setBandwidth(speed > 5 ? 'high' : speed > 1.5 ? 'medium' : 'low');
      };
      update();
      conn.addEventListener('change', update);
      return () => {
        window.removeEventListener('online', online);
        window.removeEventListener('offline', offline);
        conn.removeEventListener('change', update);
      };
    }
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(v => !v);
      }
      if (e.key === '?' && e.shiftKey) setShortcutsOpen(v => !v);
      if (e.key === 'Escape') { setCommandPaletteOpen(false); setShortcutsOpen(false); }
      if (e.key === 'F9') setDebugMode(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Theme application
  const setTheme = (t: typeof theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('omnimux-theme', t);
  };

  useEffect(() => {
    const saved = localStorage.getItem('omnimux-theme') as typeof theme;
    if (saved) setTheme(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme, setTheme, reducedMotion, isOnline, bandwidth,
        commandPaletteOpen, setCommandPaletteOpen,
        cinematicMode, setCinematicMode, debugMode,
      }}
    >
      <ScrollProgressIndicator />
      <GrainOverlay />
      <AmbientCursor />
      <NetworkStatusMonitor isOnline={isOnline} bandwidth={bandwidth} />
      <BackToTop />
      <SystemTicker bandwidth={bandwidth} theme={theme} />
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <KeyboardShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {debugMode && <PerfOverlay />}
      {children}
      <OmnimuxFooter />
    </AppContext.Provider>
  );
}
