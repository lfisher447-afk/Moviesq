'use client';

import {
  useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Activity,
  PictureInPicture2, FastForward, Rewind, ClosedCaptioning, CornerDownLeft,
  Zap, ChevronRight, Gauge, Lock, Unlock, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Make sure you have this utility function

// Export the interface to be used by parent components
export interface StreamSource {
  serverId: string;
  name: string;
  url: string;
  isDirect: boolean;
  tier: number;
}

interface NexusPlayerProps {
  sources: StreamSource[];
  poster?: string;
  mediaId: string;
  title?: string;
  primaryColor?: string;
}

// Utility to format time (e.g., 95 seconds -> 01:35)
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '00:00';
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
};


export const NexusPlayer = forwardRef<HTMLVideoElement, NexusPlayerProps>(
function NexusPlayer({
  sources = [],
  poster,
  mediaId,
  title = "Untitled Media",
  primaryColor = '#6366f1' // Indigo default
}, externalRef) {

  // --- REFS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useImperativeHandle(externalRef, () => videoRef.current as HTMLVideoElement, []);

  // --- STATE ---
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [blacklistedSources, setBlacklistedSources] = useState<string[]>([]);
  const availableSources = sources.filter(s => !blacklistedSources.includes(s.serverId));
  const activeSource = availableSources[activeSourceIndex];

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPip, setIsPip] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'main' | 'quality' | 'speed' | 'subtitles' | 'servers' | null>(null);

  // Data State
  const [qualityLevels, setQualityLevels] = useState<{ height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is 'auto' in HLS.js
  const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
  const [activeSubtitleTrack, setActiveSubtitleTrack] = useState(-1);

  // --- CORE PLAYER LOGIC ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSource) return;

    // Reset state for new source
    setIsLoading(true);
    setError(null);

    const initializePlayer = () => {
      const storedTime = localStorage.getItem(`nexus_time_${mediaId}`);
      
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls({ enableWorker: true, maxBufferLength: 90 });
        hlsRef.current = hls;

        hls.loadSource(activeSource.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setQualityLevels(data.levels);
          setSubtitleTracks(hls.subtitleTracks);
          if (storedTime) video.currentTime = parseFloat(storedTime);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setCurrentQuality(data.level));
        hls.on(Hls.Events.SUBTITLE_TRACK_LOADED, () => setSubtitleTracks(hls.subtitleTracks));
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error(`NexusPlayer FATAL Error on [${activeSource.name}]:`, data);
            setError(`Stream source failed. Trying next available...`);
            setBlacklistedSources(prev => [...prev, activeSource.serverId]);
            setTimeout(() => {
              if (activeSourceIndex < availableSources.length - 1) {
                setActiveSourceIndex(prev => prev + 1);
              } else {
                setError("All stream sources failed.");
              }
            }, 1000);
          }
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeSource.url;
        video.addEventListener('loadedmetadata', () => {
          if (storedTime) video.currentTime = parseFloat(storedTime);
          video.play().catch(() => {});
        });
      }
    };

    initializePlayer();

    // Cleanup
    return () => hlsRef.current?.destroy();
  }, [activeSource, mediaId]);

  // --- EVENT HANDLERS ---
  const togglePlay = useCallback(() => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause(), []);
  const seek = (delta: number) => { if (videoRef.current) videoRef.current.currentTime += delta; };

  const toggleFullScreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  }, []);
  
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await videoRef.current.requestPictureInPicture();
  }, []);

  // --- UI & KEYBOARD SHORTCUTS ---
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
      if (Math.round(video.currentTime) % 5 === 0) { // Save every 5 seconds
        localStorage.setItem(`nexus_time_${mediaId}`, String(video.currentTime));
      }
    };
    const onLoadedData = () => { setIsLoading(false); setDuration(video.duration); };
    const onVolumeChange = () => { setIsMuted(video.muted); setVolume(video.volume); localStorage.setItem('nexus_volume', String(video.volume)); };
    const onEnterPiP = () => setIsPip(true);
    const onLeavePiP = () => setIsPip(false);
    
    // Load persisted volume
    const savedVolume = localStorage.getItem('nexus_volume');
    if (savedVolume) { video.volume = parseFloat(savedVolume); }

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'f': toggleFullScreen(); break;
        case 'm': video.muted = !video.muted; break;
        case 'p': togglePiP(); break;
        case 'arrowright': seek(10); break;
        case 'arrowleft': seek(-10); break;
        case 'arrowup': video.volume = Math.min(1, video.volume + 0.1); break;
        case 'arrowdown': video.volume = Math.max(0, video.volume - 0.1); break;
      }
    };
    
    containerRef.current?.addEventListener('keydown', handleKeyDown);

    // Fullscreen state listener
    const onFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullScreenChange);
    
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', onFullScreenChange);
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [togglePlay, toggleFullScreen, togglePiP, mediaId]);

    return (
        <div 
          ref={containerRef}
          onMouseMove={showControlsTemporarily}
          onMouseLeave={() => isPlaying && setActiveMenu(null) && setShowControls(false)}
          className="relative w-full h-full bg-black rounded-lg overflow-hidden group/player"
          tabIndex={0} // Makes div focusable for keyboard events
        >
            <video
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
            />

            {/* --- OVERLAYS --- */}
            <AnimatePresence>
                {(isLoading || error) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white"
                    >
                      {isLoading && <Activity className="w-12 h-12 text-indigo-400 animate-pulse mb-4"/>}
                      {error && <AlertTriangle className="w-12 h-12 text-red-500 mb-4"/> }
                      <p className="font-semibold">{error || "Calibrating Stream Matrix..."}</p>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {!isPlaying && !isLoading && !error && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    >
                      <button onClick={togglePlay} className="p-4 bg-black/50 backdrop-blur-xl rounded-full pointer-events-auto hover:bg-indigo-600 transition-colors">
                        <Play className="w-16 h-16 text-white fill-white ml-2"/>
                      </button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* --- CONTROLS --- */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                      className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent"
                    >
                        {/* --- PROGRESS BAR --- */}
                        <div className="group/progress h-4 cursor-pointer" 
                          onClick={(e) => videoRef.current && (videoRef.current.currentTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * duration)}
                        >
                          <div className="relative h-1 group-hover/progress:h-1.5 bg-white/20 rounded-full transition-all mt-1.5">
                            <div className="absolute h-full rounded-full bg-indigo-500" style={{ width: `${progress}%`, backgroundColor: primaryColor }}/>
                            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-lg" style={{ left: `${progress}%` }}/>
                          </div>
                        </div>

                        {/* --- MAIN CONTROLS ROW --- */}
                        <div className="flex items-center justify-between mt-2 text-white">
                            {/* Left Controls */}
                            <div className="flex items-center gap-4">
                               <button onClick={togglePlay}>{isPlaying ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6"/>}</button>
                               <button onClick={() => seek(-10)}><Rewind className="w-5 h-5"/></button>
                               <button onClick={() => seek(10)}><FastForward className="w-5 h-5"/></button>
                               <div className="flex items-center gap-2 group/volume">
                                  <button onClick={() => videoRef.current && (videoRef.current.muted = !videoRef.current.muted)}>
                                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
                                  </button>
                                  <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                      const newVol = parseFloat(e.target.value);
                                      if (videoRef.current) {
                                        videoRef.current.volume = newVol;
                                        videoRef.current.muted = newVol === 0;
                                      }
                                    }}
                                    className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 accent-indigo-500"
                                    style={{accentColor: primaryColor}}
                                  />
                               </div>
                               <span className="text-xs font-mono">{formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}</span>
                            </div>

                             {/* Right Controls */}
                            <div className="flex items-center gap-4 relative">
                                <button onClick={() => setActiveMenu(activeMenu ? null : 'main')} className={cn("transition-colors", activeMenu && 'text-indigo-400')}><Settings className="w-5 h-5"/></button>
                                <button onClick={togglePiP} className={cn("hidden sm:block", isPip && 'text-indigo-400')}><PictureInPicture2 className="w-5 h-5"/></button>
                                <button onClick={toggleFullScreen}>{isFullScreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}</button>
                                
                                <AnimatePresence>
                                {activeMenu && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-12 right-0 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl origin-bottom-right"
                                    onMouseLeave={() => setActiveMenu(null)}
                                >
                                    {activeMenu !== 'main' && <button className="w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 rounded-lg text-gray-400 hover:bg-white/10" onClick={() => setActiveMenu('main')}><CornerDownLeft className="w-3 h-3"/> Back</button>}
                                    
                                    {/* Main Menu */}
                                    {activeMenu === 'main' && (
                                       <>
                                        <MenuItem onClick={() => setActiveMenu('quality')} label="Quality" value={currentQuality === -1 ? 'Auto' : `${qualityLevels[currentQuality]?.height}p`} icon={Zap} />
                                        <MenuItem onClick={() => setActiveMenu('subtitles')} label="Subtitles" value={subtitleTracks[activeSubtitleTrack]?.name || 'Off'} icon={ClosedCaptioning} />
                                        <MenuItem onClick={() => setActiveMenu('speed')} label="Playback Speed" value={`${playbackRate}x`} icon={Gauge}/>
                                        <MenuItem onClick={() => setActiveMenu('servers')} label="Stream Server" value={activeSource.name} icon={Activity} />
                                       </>
                                    )}

                                    {/* Sub Menus */}
                                    {activeMenu === 'quality' && (
                                        <>
                                         <SubMenuItem label="Auto" active={currentQuality === -1} onClick={() => hlsRef.current && (hlsRef.current.currentLevel = -1)} />
                                         {qualityLevels.map((level, index) => <SubMenuItem key={level.height} label={`${level.height}p`} active={currentQuality === index} onClick={() => hlsRef.current && (hlsRef.current.currentLevel = index)} />)}
                                        </>
                                    )}
                                    {activeMenu === 'speed' && [0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => <SubMenuItem key={rate} label={`${rate}x`} active={playbackRate === rate} onClick={() => {if(videoRef.current) videoRef.current.playbackRate = rate; setPlaybackRate(rate);}}/>)}
                                    {activeMenu === 'subtitles' && (
                                        <>
                                         <SubMenuItem label="Off" active={activeSubtitleTrack === -1} onClick={() => hlsRef.current && (hlsRef.current.subtitleTrack = -1)} />
                                         {subtitleTracks.map((track, index) => <SubMenuItem key={track.id} label={track.name} active={activeSubtitleTrack === index} onClick={() => hlsRef.current && (hlsRef.current.subtitleTrack = index)}/>)}
                                        </>
                                    )}
                                     {activeMenu === 'servers' && availableSources.map((source, index) => <SubMenuItem key={source.serverId} label={source.name} active={index === activeSourceIndex} onClick={() => setActiveSourceIndex(index)} />)}
                                </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// Helper components for the settings menu UI
function MenuItem({ icon: Icon, label, value, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 flex items-center justify-between">
      <div className="flex items-center gap-2"><Icon className="w-4 h-4"/> {label}</div>
      <span className="text-xs text-gray-400 flex items-center gap-1">{value} <ChevronRight className="w-3 h-3"/></span>
    </button>
  );
}
function SubMenuItem({ label, active, onClick }: any) {
    return <button onClick={onClick} className={cn("w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10", active && 'bg-indigo-600/50 text-white font-semibold')}>{label}</button>
}
