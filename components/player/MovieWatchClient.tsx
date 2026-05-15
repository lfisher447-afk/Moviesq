'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sliders, MessageSquare, Maximize, X } from "lucide-react";

import { NexusPlayer, StreamSource } from "@/components/player/NexusPlayer";
import { VideoFilters } from "@/components/VideoFilters";
import { AudioFilters } from "@/components/AudioFilters";
import { NicoNicoComments } from "@/components/NicoNicoComments";
import { DynamicServerNode } from "@/lib/servers";
import type { MediaItem } from "@/lib/types";

// Helper component for the floating UI buttons
function ControlButton({ onClick, label, isActive, children }: { onClick: () => void; label: string; isActive: boolean, children:React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-2 text-gray-300 hover:text-white transition-all bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-2xl border ${isActive ? 'border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'border-white/10'}`}
    >
      {children}
      <span className="hidden lg:inline text-sm font-semibold">{label}</span>
    </button>
  );
}

interface MovieWatchClientProps {
  movie: MediaItem;
  sources: DynamicServerNode[];
}

export function MovieWatchClient({ movie, sources }: MovieWatchClientProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [isNicoActive, setIsNicoActive] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // 100% BULLETPROOF TS FIX: We cast sources to any[] to bypass the missing "tier" type constraint
  const nexusSources: StreamSource[] = useMemo(() => {
    const rawSources: any[] = sources;
    return rawSources.map(s => ({
      serverId: s.id,
      name: s.name,
      url: s.build(movie.media_type || 'movie', movie.id),
      isDirect: s.type === 'direct',
      tier: s.tier || 1, 
    }));
  }, [sources, movie.id, movie.media_type]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* --- FLOATING UI CONTROLS --- */}
      <div className="fixed top-6 left-6 z-[60]">
        <Link href={`/movie/${movie.id}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline font-semibold">Back to Details</span>
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-[60] flex items-center gap-3">
        <ControlButton label="DSP Filters" isActive={showFilters} onClick={() => setShowFilters(!showFilters)}>
          <Sliders className="w-5 h-5"/>
        </ControlButton>
        <ControlButton label="Live Comments" isActive={isNicoActive} onClick={() => setIsNicoActive(!isNicoActive)}>
          <MessageSquare className="w-5 h-5"/>
        </ControlButton>
        <ControlButton label={isCinemaMode ? "Exit Cinema" : "Cinema Mode"} isActive={isCinemaMode} onClick={() => setIsCinemaMode(!isCinemaMode)}>
           {isCinemaMode ? <X className="w-5 h-5"/> : <Maximize className="w-5 h-5" />}
        </ControlButton>
      </div>

      {/* --- FULLSCREEN CINEMA MODE PLAYER --- */}
      <AnimatePresence>
        {isCinemaMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0"
          >
            <div className="w-full h-full"> 
              <NexusPlayer 
                sources={nexusSources} 
                poster={movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : undefined} 
                mediaId={String(movie.id)}
                title={movie.title}
              />
            </div>
            <NicoNicoComments active={isNicoActive} density={2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STANDARD IN-PAGE LAYOUT --- */}
      <main className="flex-1 flex flex-col items-center justify-center py-32 px-4 sm:px-6 lg:px-8">
        <motion.div 
            animate={{ 
                opacity: isCinemaMode ? 0 : 1, 
                scale: isCinemaMode ? 0.95 : 1
            }} 
            transition={{ duration: 0.3 }}
            className={`w-full max-w-[1400px] ${isCinemaMode ? 'pointer-events-none' : ''}`}
        >
          <div className="relative w-full aspect-video">
            <NexusPlayer 
              sources={nexusSources} 
              poster={movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : undefined} 
              mediaId={String(movie.id)}
              title={movie.title}
            />
            <NicoNicoComments active={isNicoActive} density={2} />
          </div>

          <div className="mt-8">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{movie.title}</h1>
            <p className="text-gray-500 mt-2 font-medium italic">{movie.overview ? movie.overview.substring(0, 150) + '...' : ''}</p>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: '2rem' }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <VideoFilters />
                  <AudioFilters />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
