'use client';

// app/page.tsx — OMNIMUX OMEGA HOME · v15.0 (ULTIMATE SINGULARITY EDITION)
// Merged from all 4 projects: Movie-main + Omnimux-movies-main + Omnimux-Ultimate-Combined + project_to_combine
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import useSWR from 'swr';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, TrendingUp, Globe, Film, Flame, Award, Zap, Play,
  Eye, BarChart2, RefreshCw, Sparkles, Clock, Search, Activity, ShieldCheck,
  Heart, Terminal, Server, Shuffle, Download, Bell, SlidersHorizontal, Radio,
  Clapperboard, Target, Atom, Palette, Mic2, Trophy, Grid3X3, List,
  LayoutGrid, ArrowUpRight, Layers, Wifi, Volume2, Settings2, Hash,
  Wand2, Telescope, Fingerprint, Filter, X, Star, Music2, Ghost, Sword,
  BookOpen, Laugh, Rocket, Tv2, BarChart3, RefreshCcw,
} from 'lucide-react';

import { MovieCard } from '@/components/MovieCard';
import { HeroCarousel } from '@/components/HeroCarousel';
import { MovieCardSkeleton } from '@/components/Skeleton';
import { useStore } from '@/store/useStore';
import { useMounted } from '@/hooks/useMounted';
import { fetcher } from '@/lib/utils';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  overview?: string;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
  watchProgress?: number;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const ALL_GENRES = [
  { id: 28,    name: 'Action',    icon: '⚡', color: 'from-red-600 to-orange-600' },
  { id: 12,    name: 'Adventure', icon: '🗺️', color: 'from-emerald-500 to-teal-700' },
  { id: 16,    name: 'Animation', icon: '🎨', color: 'from-pink-400 to-purple-600' },
  { id: 35,    name: 'Comedy',    icon: '😂', color: 'from-yellow-400 to-orange-500' },
  { id: 80,    name: 'Crime',     icon: '🕵️', color: 'from-slate-700 to-black' },
  { id: 99,    name: 'Docu',      icon: '🎥', color: 'from-blue-900 to-indigo-900' },
  { id: 18,    name: 'Drama',     icon: '🎭', color: 'from-rose-700 to-rose-950' },
  { id: 10751, name: 'Family',    icon: '👨‍👩‍👧', color: 'from-green-400 to-blue-500' },
  { id: 14,    name: 'Fantasy',   icon: '🔮', color: 'from-violet-600 to-fuchsia-600' },
  { id: 36,    name: 'History',   icon: '📜', color: 'from-amber-800 to-yellow-900' },
  { id: 27,    name: 'Horror',    icon: '💀', color: 'from-purple-900 to-black' },
  { id: 10402, name: 'Music',     icon: '🎵', color: 'from-cyan-400 to-blue-600' },
  { id: 9648,  name: 'Mystery',   icon: '🔍', color: 'from-indigo-800 to-gray-900' },
  { id: 10749, name: 'Romance',   icon: '💖', color: 'from-pink-500 to-red-500' },
  { id: 878,   name: 'Sci-Fi',    icon: '🛸', color: 'from-blue-600 to-cyan-400' },
  { id: 10770, name: 'TV Movie',  icon: '📺', color: 'from-gray-500 to-slate-700' },
  { id: 53,    name: 'Thriller',  icon: '🔪', color: 'from-red-900 to-black' },
  { id: 10752, name: 'War',       icon: '⚔️', color: 'from-stone-700 to-stone-900' },
  { id: 37,    name: 'Western',   icon: '🤠', color: 'from-orange-800 to-amber-900' },
];

const MOODS = [
  { label: 'HYPED',     emoji: '🔥', genre: '28',  color: '#E50914' },
  { label: 'CEREBRAL',  emoji: '🧠', genre: '878', color: '#00D1FF' },
  { label: 'MELANCHOLY',emoji: '🌧️', genre: '18',  color: '#FF007A' },
  { label: 'TERRIFIED', emoji: '👁️', genre: '27',  color: '#A000FF' },
  { label: 'LAUGHING',  emoji: '😂', genre: '35',  color: '#FFB800' },
];

const SECTION_CONFIGS = [
  { key: 'trending',     title: 'GLOBAL HEAT',          icon: Flame,    color: 'text-rose-400',   accent: '#f43f5e', endpoint: '/trending/all/week' },
  { key: 'topRated',     title: 'CRITICALLY ACCLAIMED',  icon: Trophy,   color: 'text-amber-400',  accent: '#f59e0b', endpoint: '/movie/top_rated' },
  { key: 'sciFi',        title: 'SCI-FI FRONTIER',       icon: Atom,     color: 'text-cyan-400',   accent: '#22d3ee', endpoint: '/discover/movie&with_genres=878' },
  { key: 'action',       title: 'ACTION OVERDRIVE',      icon: Sword,    color: 'text-orange-400', accent: '#fb923c', endpoint: '/discover/movie&with_genres=28&sort_by=popularity.desc' },
  { key: 'horror',       title: 'FEAR FREQUENCY',        icon: Ghost,    color: 'text-purple-400', accent: '#a855f7', endpoint: '/discover/movie&with_genres=27&sort_by=vote_average.desc&vote_count.gte=1000' },
  { key: 'comedy',       title: 'LAUGH CIRCUIT',         icon: Laugh,    color: 'text-yellow-400', accent: '#facc15', endpoint: '/discover/movie&with_genres=35&sort_by=popularity.desc' },
  { key: 'nowPlaying',   title: 'LIVE TRANSMISSIONS',    icon: Radio,    color: 'text-green-400',  accent: '#4ade80', endpoint: '/movie/now_playing' },
  { key: 'upcoming',     title: 'INCOMING SIGNALS',      icon: Rocket,   color: 'text-sky-400',    accent: '#38bdf8', endpoint: '/movie/upcoming' },
  { key: 'tvTrending',   title: 'TV PULSE',              icon: Tv2,      color: 'text-fuchsia-400',accent: '#e879f9', endpoint: '/trending/tv/week' },
  { key: 'documentary',  title: 'TRUTH ARCHIVE',         icon: BookOpen, color: 'text-teal-400',   accent: '#2dd4bf', endpoint: '/discover/movie&with_genres=99&sort_by=vote_average.desc&vote_count.gte=500' },
  { key: 'music',        title: 'SONIC CINEMA',          icon: Music2,   color: 'text-pink-400',   accent: '#f472b6', endpoint: '/discover/movie&with_genres=10402' },
  { key: 'animation',    title: 'ANIMATED WORLDS',       icon: Palette,  color: 'text-lime-400',   accent: '#a3e635', endpoint: '/discover/movie&with_genres=16&sort_by=vote_average.desc&vote_count.gte=1000' },
];

const MODULE_CONFIGS = [
  { href: '/discover',  icon: Telescope,   label: 'DISCOVER',   sub: 'Matrix Engine',   gradient: 'from-indigo-600 to-violet-600',  glow: 'rgba(99,102,241,0.4)' },
  { href: '/ai-search', icon: Wand2,       label: 'AI SEARCH',  sub: 'Semantic Neural', gradient: 'from-fuchsia-600 to-pink-600',   glow: 'rgba(217,70,239,0.4)' },
  { href: '/browser',   icon: Globe,       label: 'BROWSER',    sub: 'Neural Proxy',    gradient: 'from-cyan-600 to-sky-600',       glow: 'rgba(6,182,212,0.4)'  },
  { href: '/terminal',  icon: Terminal,    label: 'TERMINAL',   sub: 'OS Core',         gradient: 'from-emerald-600 to-green-600',  glow: 'rgba(16,185,129,0.4)' },
  { href: '/admin',     icon: Server,      label: 'ADMIN',      sub: 'Control Layer',   gradient: 'from-rose-600 to-red-600',       glow: 'rgba(244,63,94,0.4)'  },
  { href: '/wrapped',   icon: Award,       label: 'WRAPPED',    sub: 'Year in Review',  gradient: 'from-amber-600 to-orange-600',   glow: 'rgba(245,158,11,0.4)' },
];

const QUICK_ACTIONS = [
  { label: 'Shuffle Play',  icon: Shuffle,  action: 'shuffle',   color: 'from-violet-500 to-purple-600' },
  { label: 'Continue',      icon: Play,     action: 'continue',  color: 'from-green-500 to-emerald-600' },
  { label: 'My Watchlist',  icon: Heart,    action: 'watchlist', color: 'from-rose-500 to-pink-600'    },
  { label: 'Downloads',     icon: Download, action: 'downloads', color: 'from-sky-500 to-blue-600'     },
  { label: 'Notifications', icon: Bell,     action: 'notifs',    color: 'from-amber-500 to-yellow-600' },
  { label: 'Stats',         icon: BarChart3,action: 'stats',     color: 'from-teal-500 to-cyan-600'   },
];

// ─── AMBIENT BACKGROUND ───────────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full blur-3xl opacity-[0.04]"
          style={{ width: `${200+i*80}px`, height: `${200+i*80}px`, left: `${(i*17)%90}%`, top: `${(i*23)%80}%`,
            background: ['#6366f1','#ec4899','#06b6d4','#8b5cf6','#f59e0b','#10b981'][i] }}
          animate={{ x:[0,30,-20,0], y:[0,-25,15,0], scale:[1,1.1,0.95,1] }}
          transition={{ duration:15+i*4, repeat:Infinity, ease:'easeInOut', delay:i*2 }} />
      ))}
    </div>
  );
}

// ─── LIVE STATS TICKER ────────────────────────────────────────────────────────
function LiveStatsTicker() {
  const stats = useMemo(() => [
    { label: 'NODE_STATUS',    value: 'OPTIMAL',      icon: <Activity className="w-3 h-3" /> },
    { label: 'ENCRYPTION',     value: 'AES-256',      icon: <ShieldCheck className="w-3 h-3" /> },
    { label: 'BITRATE',        value: '84MBPS',       icon: <Zap className="w-3 h-3" /> },
    { label: 'USERS_LIVE',     value: '184.2K',       icon: <Eye className="w-3 h-3" /> },
    { label: 'TITLES_INDEXED', value: '850K+',        icon: <Film className="w-3 h-3" /> },
    { label: 'CROWD_VIBE',     value: '98% POSITIVE', icon: <Heart className="w-3 h-3" /> },
    { label: 'OMEGASHIELD',    value: 'ACTIVE',       icon: <Fingerprint className="w-3 h-3" /> },
    { label: 'WATCH_PARTY',    value: 'READY',        icon: <Wifi className="w-3 h-3" /> },
  ], []);

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-black/40 backdrop-blur-3xl py-4 mb-16">
      <div className="flex gap-20 animate-[ticker_40s_linear_infinite] whitespace-nowrap">
        {[...stats,...stats,...stats,...stats].map((s,i)=>(
          <div key={i} className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-gray-500 shrink-0">
            <span className="text-brand animate-pulse">{s.icon}</span>
            <span>{s.label}</span>
            <span className="text-white ml-1">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACTIVITY TICKER ─────────────────────────────────────────────────────────
function ActivityTicker({ items }: { items: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(()=>setIdx(i=>(i+1)%items.length),3500); return ()=>clearInterval(t); }, [items.length]);
  if (!items.length) return null;
  return (
    <div className="flex items-center gap-3 py-2 px-4 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 flex-none">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
        <span className="text-[10px] font-black tracking-[0.2em] text-white/30 font-mono">LIVE</span>
      </div>
      <div className="h-4 w-px bg-white/10"/>
      <AnimatePresence mode="wait">
        <motion.span key={idx} initial={{y:12,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-12,opacity:0}} transition={{duration:0.35}} className="text-xs text-white/50 truncate font-mono">
          {items[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── STATUS BAR ───────────────────────────────────────────────────────────────
function StatusBar({ trendingCount }: { trendingCount: number }) {
  const TICKERS = [`${trendingCount} trending titles loaded`, 'OmegaShield: ACTIVE — 0 threats', 'Stream servers: ONLINE', 'TMDB sync: OK', 'Watch Party: READY'];
  return (
    <div className="sticky top-0 z-50 mb-6 -mx-6 px-6 py-2 bg-[#030508]/95 backdrop-blur-2xl border-b border-white/[0.04] flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-none">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
        <span className="text-[9px] font-black tracking-[0.25em] text-white/30 font-mono">OMNIMUX OMEGA</span>
      </div>
      <div className="flex-1 min-w-0"><ActivityTicker items={TICKERS}/></div>
      <div className="flex-none flex items-center gap-2 text-[9px] font-mono text-white/20 tracking-widest">
        <Wifi className="w-3 h-3"/><span>LIVE</span>
      </div>
    </div>
  );
}

// ─── MODULE CARD ─────────────────────────────────────────────────────────────
function ModuleCard({ mod, index }: { mod: typeof MODULE_CONFIGS[0]; index: number }) {
  const IconComp = mod.icon;
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:index*0.07,ease:[0.22,1,0.36,1]}}>
      <Link href={mod.href} className="relative block rounded-2xl overflow-hidden border border-white/8 bg-white/[0.025] group hover:border-white/20 transition-all duration-500 hover:-translate-y-1">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" style={{background:`radial-gradient(circle at 50% 0%, ${mod.glow} 0%, transparent 70%)`}}/>
        <div className={`h-0.5 w-full bg-gradient-to-r ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}/>
        <div className="relative p-6 flex flex-col gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <IconComp className="w-6 h-6 text-white"/>
          </div>
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-white/40 font-mono mb-1">{mod.sub}</p>
            <h3 className="text-base font-black tracking-widest text-white">{mod.label}</h3>
          </div>
          <div className="flex items-center gap-1 text-white/30 group-hover:text-white/60 transition-colors">
            <span className="text-xs font-mono tracking-wider">ENTER MODULE</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
function QuickActions({ onAction }: { onAction: (a: string) => void }) {
  return (
    <div className="flex gap-3 flex-wrap mb-10">
      {QUICK_ACTIONS.map((qa, i) => {
        const IconComp = qa.icon;
        return (
          <motion.button key={qa.action} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:0.2+i*0.05}}
            whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>onAction(qa.action)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${qa.color} text-white text-xs font-black tracking-widest shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-200`}>
            <IconComp className="w-4 h-4"/>{qa.label}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── GENRE NEXUS ─────────────────────────────────────────────────────────────
function FullGenreNexus() {
  return (
    <section className="mb-20">
      <div className="flex items-center gap-3 mb-6 px-2">
        <span className="text-brand text-[10px] font-black tracking-[0.5em] flex items-center gap-2">
          <span className="w-2 h-2 bg-brand rounded-full animate-pulse"/>GENRE_NEXUS
        </span>
      </div>
      <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-white tracking-tighter mb-8 px-2">NEURAL_NEXUS</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
        {ALL_GENRES.map((g,i)=>(
          <Link href={`/discover?genre=${g.id}`} key={g.id}>
            <motion.div initial={{opacity:0,scale:0.8}} whileInView={{opacity:1,scale:1}} transition={{delay:i*0.04}} viewport={{once:true}}
              whileHover={{scale:1.05,y:-6}} className={`relative h-24 rounded-2xl bg-gradient-to-br ${g.color} group overflow-hidden shadow-xl cursor-pointer`}>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors duration-500"/>
              <div className="relative h-full flex flex-col items-center justify-center gap-2">
                <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{g.icon}</span>
                <span className="text-[8px] font-black tracking-[0.2em] text-white/90">{g.name.toUpperCase()}</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── MOOD ENGINE ─────────────────────────────────────────────────────────────
function MoodEngine() {
  const [active, setActive] = useState<typeof MOODS[0]|null>(null);
  const { data, isLoading } = useSWR(active ? `/api/tmdb?endpoint=/discover/movie&with_genres=${active.genre}&sort_by=popularity.desc` : null, fetcher);
  return (
    <section className="mb-20">
      <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-white tracking-tighter mb-8 px-2">NEURAL_MOOD_SYNC</h2>
      <div className="bg-gradient-to-b from-white/5 to-black/60 border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20 pointer-events-none blur-[100px] transition-all duration-1000"
          style={{background:active?`radial-gradient(circle,${active.color},transparent 60%)`:'transparent'}}/>
        <div className="flex flex-wrap gap-4 mb-10 relative z-10">
          {MOODS.map(m=>(
            <motion.button key={m.label} whileHover={{scale:1.05}} whileTap={{scale:0.95}}
              onClick={()=>setActive(active?.label===m.label?null:m)}
              className={`px-8 py-4 rounded-2xl text-[11px] font-black tracking-[0.3em] transition-all duration-300 flex items-center gap-3 border backdrop-blur-md
                ${active?.label===m.label?'bg-brand border-brand text-white shadow-[0_0_40px_rgba(229,9,20,0.5)]':'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}>
              <span className="text-xl">{m.emoji}</span>{m.label}
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {active&&(
            <motion.div key={active.label} initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="relative z-10">
              <div className="flex gap-4 md:gap-6 overflow-x-auto custom-scrollbar pb-6 pt-2 scroll-smooth snap-x">
                {isLoading?Array(6).fill(0).map((_,i)=><MovieCardSkeleton key={i}/>):
                  data?.results?.slice(0,10).map((m:Movie)=>(<div key={m.id} className="shrink-0 snap-start"><MovieCard movie={m}/></div>))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── CONTENT ROW ─────────────────────────────────────────────────────────────
function ContentRow({ config, data }: { config: typeof SECTION_CONFIGS[0]; data: Movie[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const IconComp = config.icon;

  const checkScroll = useCallback(()=>{
    const el=rowRef.current; if(!el) return;
    setCanScrollLeft(el.scrollLeft>0);
    setCanScrollRight(el.scrollLeft<el.scrollWidth-el.clientWidth-10);
  },[]);

  const scroll=(dir:'left'|'right')=>{
    rowRef.current?.scrollBy({left:dir==='right'?900:-900,behavior:'smooth'});
  };

  if(!data?.length) return null;

  return (
    <motion.section initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-80px'}}
      transition={{duration:0.6,ease:[0.22,1,0.36,1]}} className="mb-16 group/section">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 blur-xl rounded-full opacity-60" style={{background:config.accent}}/>
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
              <IconComp className={`w-5 h-5 ${config.color}`}/>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-[0.15em] text-white">{config.title}</h2>
            <p className="text-xs text-white/30 tracking-widest font-mono">{data.length} TITLES LOADED</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/discover?section=${config.key}`} className="text-xs tracking-widest text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 font-mono group">
            VIEW ALL <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
          </Link>
          <div className="flex gap-1">
            <button onClick={()=>scroll('left')} disabled={!canScrollLeft} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all">
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <button onClick={()=>scroll('right')} disabled={!canScrollRight} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all">
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>
      <div className="h-px mb-6 rounded-full" style={{background:`linear-gradient(to right, ${config.accent}40, transparent)`}}/>
      <div className="relative">
        <div ref={rowRef} onScroll={checkScroll} className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-1 -mx-1 scroll-smooth">
          {data.slice(0,visibleCount).map((m:Movie,i:number)=>(
            <motion.div key={`${m.id}-${i}`} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}
              transition={{delay:Math.min(i*0.04,0.5),ease:'easeOut'}} className="flex-none">
              <MovieCard movie={m}/>
            </motion.div>
          ))}
          {visibleCount<data.length&&(
            <div className="flex-none flex items-center">
              <button onClick={()=>setVisibleCount(c=>c+20)}
                className="min-w-[160px] h-full min-h-[280px] rounded-2xl border border-white/10 bg-white/3 flex flex-col items-center justify-center gap-3 hover:bg-white/8 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white/50"/>
                </div>
                <span className="text-xs tracking-widest text-white/30 font-mono">LOAD MORE</span>
              </button>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#030508] to-transparent z-10"/>
        <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#030508] to-transparent z-10"/>
      </div>
    </motion.section>
  );
}

// ─── BOX OFFICE LEADERBOARD ───────────────────────────────────────────────────
function BoxOfficeLeaderboard() {
  const { data } = useSWR('/api/tmdb?endpoint=/movie/now_playing', fetcher);
  const movies: Movie[] = data?.results?.slice(0,6)||[];
  return (
    <section className="mb-20">
      <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-white tracking-tighter mb-8 px-2">MOMENTUM_LEADERBOARD</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {movies.map((m,i)=>(
          <Link href={`/movie/${m.id}`} key={m.id}>
            <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} transition={{delay:i*0.08}} viewport={{once:true}}
              className="group relative bg-black/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 flex items-center gap-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer shadow-xl overflow-hidden">
              <span className="font-display text-8xl text-white/5 group-hover:text-brand/10 transition-colors absolute right-4 -bottom-4 italic select-none">#{i+1}</span>
              <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} className="w-16 h-24 rounded-xl shadow-xl z-10 group-hover:scale-105 transition-transform" alt={m.title}/>
              <div className="flex-1 z-10 min-w-0">
                <h4 className="text-white font-black text-lg mb-1 truncate group-hover:text-brand transition-colors">{m.title}</h4>
                <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-gray-400 mt-2">
                  <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">⭐ {m.vote_average?.toFixed(1)}</span>
                  <span>{m.release_date?.split('-')[0]}</span>
                </div>
                <div className="w-full max-w-[200px] h-1.5 bg-black/50 rounded-full mt-4 overflow-hidden border border-white/5">
                  <motion.div initial={{width:0}} whileInView={{width:`${((m.popularity||0)/(movies[0]?.popularity||1))*100}%`}}
                    transition={{delay:0.4+i*0.1,duration:1}} className="h-full bg-gradient-to-r from-brand to-orange-500"/>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── GENRE DNA ────────────────────────────────────────────────────────────────
function GenreDNA({ history }: { history: Movie[] }) {
  const GENRE_MAP: Record<number,{name:string;color:string}> = {
    28:{name:'Action',color:'#f97316'}, 35:{name:'Comedy',color:'#facc15'}, 18:{name:'Drama',color:'#a855f7'},
    27:{name:'Horror',color:'#ef4444'}, 878:{name:'Sci-Fi',color:'#22d3ee'}, 10749:{name:'Romance',color:'#f472b6'},
    80:{name:'Crime',color:'#6b7280'}, 14:{name:'Fantasy',color:'#8b5cf6'}, 12:{name:'Adventure',color:'#34d399'}, 16:{name:'Animation',color:'#fb7185'},
  };
  const counts = useMemo(()=>{
    const map:Record<number,number>={};
    history.forEach(m=>(m.genre_ids||[]).forEach((gid:number)=>{map[gid]=(map[gid]||0)+1;}));
    return Object.entries(map).map(([id,count])=>({id:+id,count,...(GENRE_MAP[+id]||{name:'Other',color:'#64748b'})})).sort((a,b)=>b.count-a.count).slice(0,8);
  },[history]);
  if(!counts.length) return null;
  const max=counts[0].count;
  return (
    <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mb-16 rounded-3xl bg-white/[0.02] border border-white/8 p-6">
      <h2 className="text-sm font-black tracking-[0.2em] text-white/40 font-mono mb-4">YOUR GENRE DNA</h2>
      <div className="space-y-3">
        {counts.map((g,i)=>(
          <div key={g.id} className="flex items-center gap-4">
            <span className="text-xs font-mono text-white/40 w-20 text-right">{g.name}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{width:0}} whileInView={{width:`${(g.count/max)*100}%`}} viewport={{once:true}}
                transition={{delay:i*0.05,duration:0.8,ease:'easeOut'}} className="h-full rounded-full" style={{background:g.color}}/>
            </div>
            <span className="text-xs font-mono text-white/30 w-6 text-right">{g.count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── SHUFFLE MODAL ────────────────────────────────────────────────────────────
function ShuffleModal({ movies, onClose }: { movies: Movie[]; onClose: ()=>void }) {
  const [pick, setPick] = useState<Movie|null>(null);
  const [spinning, setSpinning] = useState(false);
  const spin = () => {
    setSpinning(true);
    setTimeout(()=>{
      const pool=movies.filter(m=>m.poster_path);
      setPick(pool[Math.floor(Math.random()*pool.length)]||null);
      setSpinning(false);
    },800);
  };
  useEffect(()=>{spin();},[]);
  const type=pick?.media_type||(pick?.first_air_date?'tv':'movie');
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{scale:0.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.85,opacity:0}} onClick={e=>e.stopPropagation()}
        className="w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3"><Shuffle className="w-5 h-5 text-violet-400"/><h3 className="font-black tracking-widest text-sm">SHUFFLE PLAY</h3></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-6">
          <AnimatePresence mode="wait">
            {spinning?(
              <motion.div key="spin" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-48 flex items-center justify-center">
                <motion.div animate={{rotate:360}} transition={{duration:0.6,repeat:Infinity,ease:'linear'}}><Shuffle className="w-10 h-10 text-violet-400"/></motion.div>
              </motion.div>
            ):pick?(
              <motion.div key={pick.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center">
                <img src={`https://image.tmdb.org/t/p/w500${pick.poster_path}`} alt={pick.title||pick.name} className="w-32 mx-auto rounded-2xl shadow-2xl mb-4 border border-white/10"/>
                <h4 className="text-xl font-black text-white mb-1">{pick.title||pick.name}</h4>
                <p className="text-sm text-white/40 mb-6 line-clamp-2">{pick.overview}</p>
                <div className="flex gap-3 justify-center">
                  <Link href={`/movie/${pick.id}?type=${type}`} className="px-6 py-2.5 bg-white text-black font-black text-sm rounded-xl hover:scale-105 transition-transform">WATCH NOW</Link>
                  <button onClick={spin} className="px-6 py-2.5 bg-white/8 border border-white/10 font-black text-sm rounded-xl hover:bg-white/15 transition-colors">RESHUFFLE</button>
                </div>
              </motion.div>
            ):null}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── RANDOM DISCOVERY CTA ─────────────────────────────────────────────────────
function RandomDiscoveryCTA({ movies }: { movies: Movie[] }) {
  const [randomId, setRandomId] = useState<number|null>(null);
  const [spinning, setSpinning] = useState(false);
  const spin = () => {
    setSpinning(true); setRandomId(null);
    setTimeout(()=>{
      const pick=movies[Math.floor(Math.random()*movies.length)];
      setRandomId(pick?.id||null); setSpinning(false);
    },1200);
  };
  return (
    <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      className="glass-panel rounded-[3rem] border border-white/10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 bg-gradient-to-r from-brand/10 via-black/40 to-black/80 shadow-2xl relative overflow-hidden mt-12 mb-20">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-[100px] pointer-events-none"/>
      <div className="z-10 text-center md:text-left">
        <h3 className="font-display text-4xl md:text-6xl text-white tracking-widest mb-4">FEELING ADVENTUROUS?</h3>
        <p className="text-gray-400 text-[11px] font-black tracking-[0.4em] uppercase">LET THE OMNIMUX NEURAL-NET CHOOSE YOUR FATE</p>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-4 z-10 w-full md:w-auto">
        <AnimatePresence mode="popLayout">
          {randomId&&(
            <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}>
              <Link href={`/movie/${randomId}`} className="px-8 py-5 rounded-2xl bg-white/10 text-white text-[11px] font-black tracking-[0.2em] border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md flex items-center justify-center shadow-xl">
                ACCESS FILE →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button onClick={spin} whileHover={{scale:1.05}} whileTap={{scale:0.95}} disabled={spinning}
          className="px-10 py-5 rounded-2xl bg-brand text-white font-black text-[11px] tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(229,9,20,0.5)] hover:shadow-[0_0_60px_rgba(229,9,20,0.8)] transition-all w-full md:w-auto disabled:opacity-70">
          <RefreshCw className={`w-5 h-5 ${spinning?'animate-spin':''}`}/>
          {spinning?'COMPUTING MATRICES...':'RANDOM DECRYPT'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [sections, setSections] = useState<Record<string,Movie[]>>({});
  const [loadingAll, setLoadingAll] = useState(true);
  const [activeModal, setActiveModal] = useState<'shuffle'|'notifications'|null>(null);
  const [viewMode, setViewMode] = useState<'rows'|'grid'>('rows');
  const [activeCategory, setActiveCategory] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounce = useRef<NodeJS.Timeout>();

  const { watchlist, history } = useStore();
  const isMounted = useMounted();
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0,1], ['0%','30%']);

  useEffect(()=>{
    const firstBatch = SECTION_CONFIGS.slice(0,4);
    const secondBatch = SECTION_CONFIGS.slice(4);
    const loadBatch = async (configs: typeof SECTION_CONFIGS) => {
      const results = await Promise.allSettled(
        configs.map(c=>fetch(`/api/tmdb?endpoint=/${c.endpoint.replace('&','&')}`).then(r=>r.json()))
      );
      results.forEach((r,i)=>{
        if(r.status==='fulfilled') setSections(prev=>({...prev,[configs[i].key]:r.value.results||[]}));
      });
    };
    loadBatch(firstBatch).then(()=>{setLoadingAll(false);loadBatch(secondBatch);}).catch(()=>setLoadingAll(false));
  },[]);

  useEffect(()=>{
    if(!searchQuery.trim()){setSearchResults([]);return;}
    clearTimeout(searchDebounce.current);
    searchDebounce.current=setTimeout(async()=>{
      setIsSearching(true);
      try{const r=await fetch(`/api/tmdb?endpoint=/search/multi&query=${encodeURIComponent(searchQuery)}`);const d=await r.json();setSearchResults(d.results||[]);}catch{}
      setIsSearching(false);
    },400);
  },[searchQuery]);

  const handleAction = useCallback((action:string)=>{
    if(action==='shuffle') setActiveModal('shuffle');
    else if(action==='notifs') setActiveModal('notifications');
  },[]);

  const allMovies = useMemo(()=>Object.values(sections).flat().filter((m:Movie)=>m?.poster_path),[sections]);
  const visibleSections = useMemo(()=>activeCategory?SECTION_CONFIGS.filter(c=>c.key===activeCategory):SECTION_CONFIGS,[activeCategory]);
  const trendingMovies = sections.trending||[];

  return (
    <div className="relative bg-[#030508] min-h-screen pb-40 overflow-hidden text-white">
      <AmbientBackground/>

      {/* Parallax depth */}
      <motion.div style={{y:backgroundY}} className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[80vh] left-[-15%] w-[130%] h-[120vh] bg-gradient-to-b from-brand/20 via-transparent to-transparent blur-[140px] rotate-12"/>
        <div className="absolute top-[220vh] right-[-10%] w-[120%] h-[120vh] bg-gradient-to-b from-blue-600/10 via-transparent to-transparent blur-[140px] -rotate-12"/>
      </motion.div>

      {/* Hero */}
      <HeroCarousel movies={trendingMovies}/>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 -mt-40 relative z-20">

        <StatusBar trendingCount={trendingMovies.length}/>

        {/* Search Bar */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}} className="relative mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"/>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Quick search movies, shows, actors..."
              className="w-full bg-white/[0.025] border border-white/10 rounded-2xl pl-12 pr-16 py-4 text-white placeholder-white/25 text-sm font-mono tracking-wider focus:outline-none focus:border-white/25 transition-colors"/>
            {searchQuery&&(
              <button onClick={()=>setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors">
                <X className="w-3.5 h-3.5 text-white/60"/>
              </button>
            )}
            {isSearching&&(
              <motion.div animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:'linear'}} className="absolute right-14 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-4 h-4 text-white/30"/>
              </motion.div>
            )}
          </div>
          <AnimatePresence>
            {searchResults.length>0&&searchQuery&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
                className="absolute left-0 right-0 top-full mt-2 bg-[#0d0d16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                {searchResults.slice(0,8).map((r:any)=>{
                  const t=r.media_type||(r.first_air_date?'tv':'movie');
                  return (
                    <Link key={r.id} href={`/movie/${r.id}?type=${t}`} onClick={()=>setSearchQuery('')}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                      <img src={r.poster_path?`https://image.tmdb.org/t/p/w92${r.poster_path}`:'/placeholder.png'}
                        className="w-10 h-14 rounded-lg object-cover bg-white/5" alt=""/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{r.title||r.name}</p>
                        <p className="text-[10px] text-white/30 font-mono tracking-wider uppercase">{t} · {r.release_date?.slice(0,4)||r.first_air_date?.slice(0,4)||'—'}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs flex-none">
                        <Star className="w-3 h-3 fill-current"/><span>{r.vote_average?.toFixed(1)}</span>
                      </div>
                    </Link>
                  );
                })}
                <Link href={`/ai-search?q=${encodeURIComponent(searchQuery)}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono tracking-wider">
                  <Sparkles className="w-3.5 h-3.5"/>SEARCH WITH AI
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quick Actions */}
        <QuickActions onAction={handleAction}/>

        <LiveStatsTicker/>

        {/* System Modules */}
        <motion.section initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-5 h-5 text-white/40"/>
            <h2 className="text-sm font-black tracking-[0.2em] text-white/40 font-mono">SYSTEM MODULES</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {MODULE_CONFIGS.map((mod,i)=><ModuleCard key={mod.href} mod={mod} index={i}/>)}
          </div>
        </motion.section>

        {/* Personal Panels */}
        {isMounted&&history.length>0&&(
          <section className="mb-16">
            <h2 className="text-xl font-black tracking-widest text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse inline-block"/>RESUME_UPLINK
            </h2>
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
              {(history as any[]).slice(0,15).map((m:any)=><div key={m.id} className="flex-none"><MovieCard movie={m}/></div>)}
            </div>
          </section>
        )}

        {isMounted&&history.length>2&&<GenreDNA history={history as Movie[]}/>}

        {isMounted&&watchlist.length>0&&(
          <section className="mb-16">
            <h2 className="text-xl font-black tracking-widest text-white mb-6 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-brand"/>SECURED_VAULT
            </h2>
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
              {(watchlist as any[]).slice(0,15).map((m:any)=><div key={m.id} className="flex-none"><MovieCard movie={m}/></div>)}
            </div>
          </section>
        )}

        {/* Genre Nexus */}
        <FullGenreNexus/>

        {/* Category Filter + View Toggle */}
        <div className="flex items-center gap-3 mb-10 flex-wrap">
          <Filter className="w-4 h-4 text-white/30 flex-none"/>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all ${!activeCategory?'bg-white text-black':'bg-white/5 text-white/40 hover:text-white/70 border border-white/8'}`}>ALL</button>
            {SECTION_CONFIGS.map(s=>{
              const IconComp=s.icon;
              return (
                <button key={s.key} onClick={()=>setActiveCategory(activeCategory===s.key?null:s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all ${activeCategory===s.key?'bg-white text-black':'bg-white/5 text-white/40 hover:text-white/70 border border-white/8'}`}>
                  <IconComp className="w-3 h-3"/>{s.title.split(' ')[0]}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex gap-1">
            <button onClick={()=>setViewMode('rows')} className={`p-2 rounded-lg border transition-all ${viewMode==='rows'?'bg-white/10 border-white/20':'bg-white/3 border-white/8 hover:bg-white/7'}`}><List className="w-3.5 h-3.5"/></button>
            <button onClick={()=>setViewMode('grid')} className={`p-2 rounded-lg border transition-all ${viewMode==='grid'?'bg-white/10 border-white/20':'bg-white/3 border-white/8 hover:bg-white/7'}`}><LayoutGrid className="w-3.5 h-3.5"/></button>
          </div>
        </div>

        {/* Content Sections */}
        {loadingAll?(
          <div className="space-y-16">
            {[...Array(4)].map((_,i)=>(
              <div key={i} className="animate-pulse">
                <div className="h-6 w-48 bg-white/5 rounded-lg mb-6"/>
                <div className="flex gap-4">{[...Array(8)].map((_,j)=><div key={j} className="flex-none w-44 h-64 bg-white/5 rounded-2xl"/>)}</div>
              </div>
            ))}
          </div>
        ):viewMode==='rows'?(
          visibleSections.map(config=>sections[config.key]?.length?<ContentRow key={config.key} config={config} data={sections[config.key]}/>:null)
        ):(
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {visibleSections.flatMap(c=>sections[c.key]||[]).filter((m:any,i,arr)=>arr.findIndex((x:any)=>x.id===m.id)===i).map((m:any,i:number)=>(
              <motion.div key={m.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:Math.min(i*0.02,0.5)}}>
                <MovieCard movie={m}/>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Box Office */}
        <BoxOfficeLeaderboard/>

        {/* Mood Engine */}
        <MoodEngine/>

        {/* Random CTA */}
        <RandomDiscoveryCTA movies={allMovies}/>

        {/* Footer AI CTA */}
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          className="mt-8 mb-8 rounded-3xl overflow-hidden relative bg-gradient-to-br from-indigo-950/80 to-violet-950/80 border border-indigo-500/20 p-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.2)_0%,transparent_60%)]"/>
          <div className="relative z-10">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4"/>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Discover More with AI</h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">Neural search engine — find your perfect next watch by mood, theme, or taste.</p>
            <Link href="/ai-search" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-black px-8 py-3 rounded-2xl transition-colors">
              <Sparkles className="w-4 h-4"/>LAUNCH AI SEARCH
            </Link>
          </div>
        </motion.div>

        {/* End of scroll */}
        <div className="bg-gradient-to-r from-brand/10 to-transparent p-16 md:p-24 rounded-[4rem] border border-white/5 flex flex-col items-center text-center backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(229,9,20,0.15),transparent_70%)]"/>
          <Sparkles className="w-12 h-12 text-brand mb-6 animate-bounce relative z-10"/>
          <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-6 relative z-10 tracking-tighter">END OF THE SCROLL.</h2>
          <p className="text-gray-400 font-black tracking-[0.4em] mb-10 text-[10px] md:text-xs relative z-10">RE-INITIALIZE DISCOVERY ARCHIVE?</p>
          <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
            className="relative z-10 bg-brand text-white px-12 py-5 rounded-2xl font-black tracking-[0.2em] text-[11px] hover:scale-110 transition-transform duration-300 shadow-[0_0_40px_rgba(229,9,20,0.6)]">
            RE-SYNC TO TOP
          </button>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal==='shuffle'&&<ShuffleModal movies={allMovies} onClose={()=>setActiveModal(null)}/>}
      </AnimatePresence>
    </div>
  );
}
