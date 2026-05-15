'use client';
import { useNexusAuth } from '@/context/AuthContext';
import { useStore } from '@/store/useStore';
import { useMounted } from '@/hooks/useMounted';
import { MovieCard } from '@/components/MovieCard';
import { Power, ShieldCheck, Database, History, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, signIn, logOut, loading } = useNexusAuth();
  const { watchlist, history, clearHistory } = useStore();
  const mounted = useMounted();

  if (loading || !mounted) return <div className="h-screen bg-surface" />;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full glass-panel p-12 text-center space-y-8 animate-reveal">
          <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-3xl flex items-center justify-center mx-auto shadow-brand-glow">
            <ShieldCheck className="text-brand w-10 h-10 animate-pulse" />
          </div>
          <div className="space-y-4">
            <h1 className="font-nexus text-4xl">Access Denied</h1>
            <p className="text-gray-500 text-sm leading-relaxed">Secure authentication required to access the Omnimux Vault system and Decryption Keys.</p>
          </div>
          <button onClick={signIn} className="btn-nexus bg-white text-black w-full h-16 hover:bg-brand hover:text-white border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            INITIALIZE AUTH_RELAY
          </button>
        </div>
      </div>
    );
  }

  // Safely encode URLs to prevent Next.js Image crash strings
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'Agent')}&background=E50914&color=fff`;

  return (
    <div className="max-w-[1500px] mx-auto px-6 pt-32 pb-40">
      <div className="flex flex-col md:flex-row items-center gap-10 p-12 glass-panel border-brand/10 mb-20 relative overflow-hidden shadow-[0_20px_50px_-20px_rgba(229,9,20,0.2)] animate-reveal">
        <Image 
           src={user.photoURL || fallbackAvatar} 
           width={128} 
           height={128} 
           className="w-32 h-32 rounded-[2rem] border-2 border-brand/50 shadow-[0_0_40px_rgba(229,9,20,0.4)] z-10 object-cover" 
           alt="User" 
           unoptimized // Bypass next.config.js remote patterns restriction if not defined
        />
        <div className="flex-1 text-center md:text-left space-y-2 z-10">
          <h2 className="font-nexus text-6xl break-all drop-shadow-lg">{user.displayName || 'NEXUS AGENT'}</h2>
          <p className="text-brand font-black text-xs tracking-[0.3em] uppercase opacity-80">{user.email || 'SECURE CONNECTION'}</p>
        </div>
        <button onClick={logOut} className="p-5 bg-white/5 hover:bg-brand rounded-2xl border border-white/10 transition-all text-white z-10 group shadow-xl">
          <Power className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-16">
        <div className="xl:col-span-3 space-y-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <h3 className="font-nexus text-4xl flex items-center gap-4"><Database className="text-brand" /> THE_VAULT</h3>
            </div>
            {watchlist.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {watchlist.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                </div>
            ) : (
                <div className="text-center py-24 bg-white/5 rounded-[2rem] border border-white/5 relative overflow-hidden">
                    <p className="font-nexus text-2xl text-white/40 tracking-[0.2em] relative z-10">VAULT IS EMPTY</p>
                </div>
            )}
        </div>

        <div className="space-y-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <h3 className="font-nexus text-3xl flex items-center gap-3"><History className="text-brand"/> LOGS</h3>
            <button onClick={clearHistory} className="text-[10px] font-black text-gray-500 hover:text-brand transition-colors tracking-widest border border-white/10 px-3 py-1.5 rounded-lg">PURGE_SEQ</button>
          </div>
          <div className="space-y-4">
            {history.length > 0 ? history.slice(0, 10).map((item, idx) => {
               // Safely encode history URLs resolving spaces in movie titles
               const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || item.name || 'Unknown')}&background=0a0a0f&color=333`;
               
               return (
                 <Link href={`/movie/${item.id}?type=${item.media_type || 'movie'}`} key={item.id || idx} className="flex gap-5 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-brand/40 hover:bg-white/10 transition-all cursor-pointer shadow-lg backdrop-blur-md relative overflow-hidden">
                    <Image 
                       src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : fallbackImage} 
                       width={56} 
                       height={80} 
                       alt={item.title || item.name || "Media"} 
                       className="w-14 h-20 rounded-xl object-cover shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500 z-10" 
                       unoptimized // Prevents hard crashes if TMDB domain missing from config limit
                    />
                    <div className="flex-1 flex flex-col justify-center z-10">
                      <p className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-brand transition-colors">{item.title || item.name}</p>
                      <p className="text-[9px] text-gray-400 mt-2 uppercase font-black tracking-[0.2em]">{new Date(item.lastWatched || 0).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 self-center group-hover:text-brand transition-colors group-hover:translate-x-1 z-10" />
                 </Link>
               );
            }) : (
              <div className="text-center py-12 bg-white/5 rounded-[2rem] border border-white/5"><p className="font-nexus text-lg text-white/30 tracking-[0.2em]">NO LOGS FOUND</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
