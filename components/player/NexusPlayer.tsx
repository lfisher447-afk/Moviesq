'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Activity,
    PictureInPicture, FastForward, Rewind, MonitorDot,
    Speaker, Lock, Unlock, Zap
} from 'lucide-react';

interface StreamSource { serverId: string; name: string; url: string; isDirect: boolean; tier: number; }
interface NexusPlayerProps { sources: StreamSource[]; poster?: string; mediaId: string; title?: string; }

export const NexusPlayer = forwardRef<HTMLVideoElement, NexusPlayerProps>(
    function NexusPlayer({ sources, poster, mediaId, title = "Unknown Title" }, externalRef) {

    const videoRef = useRef<HTMLVideoElement>(null);
    useImperativeHandle(externalRef, () => videoRef.current as HTMLVideoElement, []);

    const canvasRef = useRef<HTMLCanvasElement>(null); 
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    const [blacklistedNodes, setBlacklistedNodes] = useState<string[]>([]);
    const availableSources = sources.filter(s => !blacklistedNodes.includes(s.serverId));
    const [activeIndex, setActiveIndex] = useState(0);
    const activeSource = availableSources[activeIndex];

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    const [ambientMode, setAmbientMode] = useState(true);
    const [audioBoost, setAudioBoost] = useState(false); 
    const [objectFit, setObjectFit] = useState<'contain' | 'cover' | 'fill'>('contain');
    const [playbackRate, setPlaybackRate] = useState(1);
    const [qualityLevels, setQualityLevels] = useState<{ height: number, index: number }[]>([]);
    const [currentQuality, setCurrentQuality] = useState<number | 'auto'>('auto');
    const [audioTracks, setAudioTracks] = useState<any[]>([]);
    const [stats, setStats] = useState({ res: '', kbps: 0, fps: 0, dropped: 0 });

    const [activeMenu, setActiveMenu] = useState<'main' | 'quality' | 'speed' | 'audio' | 'aspect' | null>(null);
    const [doubleTapAnim, setDoubleTapAnim] = useState<'left' | 'right' | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!activeSource || !activeSource.isDirect) { setLoading(false); return; }
        setLoading(true);

        const video = videoRef.current;
        if (!video) return;

        const storedTime = localStorage.getItem(`nexus_time_${mediaId}`);
        const defaultTime = storedTime ? parseFloat(storedTime) : 0;

        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 60, enableWorker: true,
                lowLatencyMode: true, fragLoadingTimeOut: 20000
            });
            hlsRef.current = hls;

            hls.loadSource(activeSource.url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                setLoading(false);
                setQualityLevels(data.levels.map((l, i) => ({ height: l.height, index: i })).reverse());
                setAudioTracks(hls.audioTracks);
                if (defaultTime > 0) video.currentTime = defaultTime;
            });

            hls.on(Hls.Events.FRAG_CHANGED, (_, _data) => {
                const lvl = hls.levels[hls.currentLevel];
                if (lvl) setStats(s => ({ ...s, res: `${lvl.width}x${lvl.height}`, kbps: Math.round(lvl.bitrate / 1000) }));
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    setBlacklistedNodes(p => [...p, activeSource.serverId]);
                    setActiveIndex(prev => prev < availableSources.length - 1 ? prev + 1 : 0);
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = activeSource.url;
            video.addEventListener('loadedmetadata', () => {
                setLoading(false);
                if (defaultTime > 0) video.currentTime = defaultTime;
            });
            video.addEventListener('error', () => {
                setBlacklistedNodes(p => [...p, activeSource.serverId]);
                setActiveIndex(prev => prev < availableSources.length - 1 ? prev + 1 : 0);
            });
        }
        return () => hlsRef.current?.destroy();
    }, [activeIndex, activeSource, mediaId, availableSources.length]);

    useEffect(() => {
        let animationFrame: number;
        const renderAmbient = () => {
            if (ambientMode && videoRef.current && canvasRef.current && !videoRef.current.paused) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            animationFrame = requestAnimationFrame(renderAmbient);
        };
        if (ambientMode && isPlaying) renderAmbient();
        return () => cancelAnimationFrame(animationFrame);
    }, [ambientMode, isPlaying]);

    const initAudioBoost = () => {
        if (!videoRef.current || audioCtxRef.current) return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
                const source = audioCtxRef.current.createMediaElementSource(videoRef.current);
                gainNodeRef.current = audioCtxRef.current.createGain();
                source.connect(gainNodeRef.current);
                gainNodeRef.current.connect(audioCtxRef.current.destination);
            }
        } catch (e) {}
    };

    useEffect(() => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = audioBoost ? 2.5 : 1.0;
    }, [audioBoost]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title, artist: "Nexus Engine",
                artwork: [{ src: poster || '', sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', () => videoRef.current?.play());
            navigator.mediaSession.setActionHandler('pause', () => videoRef.current?.pause());
        }
    }, [title, poster]);

    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        initAudioBoost();
        isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }, [isPlaying]);

    const handleProgress = () => {
        if (!videoRef.current) return;
        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100 || 0);
        setDuration(videoRef.current.duration);

        if (videoRef.current.currentTime % 5 < 1) {
            localStorage.setItem(`nexus_time_${mediaId}`, videoRef.current.currentTime.toString());
        }

        const videoEl = videoRef.current as HTMLVideoElement & { getVideoPlaybackQuality?: () => { droppedVideoFrames: number }; };
        if (typeof videoEl.getVideoPlaybackQuality === 'function') {
            const quality = videoEl.getVideoPlaybackQuality();
            if (quality) setStats(s => ({ ...s, dropped: quality.droppedVideoFrames }));
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    };

    const handleDoubleTap = (dir: 'left' | 'right') => {
        if (!videoRef.current) return;
        setDoubleTapAnim(dir);
        videoRef.current.currentTime += dir === 'right' ? 10 : -10;
        setTimeout(() => setDoubleTapAnim(null), 400);
    };

    const toggleFullScreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullScreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullScreen(false);
            }
        } catch (e) { console.error(e); }
    };

    const handleMouseMove = () => {
        if (isLocked) return;
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => isPlaying && setShowControls(false), 3000);
    };

    return (
        <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && !activeMenu && setShowControls(false)}
            className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden group shadow-2xl border border-white/5 mx-auto transition-all duration-500">

            {ambientMode && <canvas ref={canvasRef} width="120" height="68" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] object-cover blur-3xl opacity-60 z-0 mix-blend-screen pointer-events-none transition-opacity duration-1000" />}

            {loading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
                    <Activity className="w-14 h-14 animate-pulse text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
                    <p className="font-mono mt-4 text-xs text-white/50 bg-white/5 px-4 py-1 rounded-full uppercase tracking-widest border border-white/10">Extracting Cipher...</p>
                </div>
            )}

            {!activeSource?.isDirect && activeSource && (
                <div className="absolute inset-0 z-10 w-full h-full pt-10 bg-black">
                    <iframe src={activeSource.url} className="w-full h-full border-none outline-none z-10" allowFullScreen />
                </div>
            )}

            {activeSource?.isDirect && (
                <>
                    {doubleTapAnim === 'left' && <div className="absolute left-1/4 top-1/2 -translate-y-1/2 z-30 animate-pulse text-white/50"><Rewind className="w-20 h-20" /></div>}
                    {doubleTapAnim === 'right' && <div className="absolute right-1/4 top-1/2 -translate-y-1/2 z-30 animate-pulse text-white/50"><FastForward className="w-20 h-20" /></div>}

                    {activeMenu === 'main' && stats.res && (
                        <div className="absolute top-6 left-6 z-40 bg-black/80 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl text-[10px] font-mono text-indigo-400 pointer-events-none shadow-2xl">
                            <p className="border-b border-indigo-500/30 pb-2 mb-2 font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4" /> NEXUS_TELEMETRY</p>
                            <p>PROXY_NODE : {activeSource.name}</p>
                            <p>RESOLUTION : {stats.res}</p>
                            <p>BANDWIDTH  : {stats.kbps} Mbps</p>
                            <p>DROP_FRAME : {stats.dropped}</p>
                            <p>CODEC_INFO : avc1.640032, mp4a.40.2</p>
                        </div>
                    )}

                    {isLocked && <button onClick={() => setIsLocked(false)} className="absolute top-6 right-6 z-50 bg-black/50 backdrop-blur p-3 rounded-full text-white/50 hover:text-white transition"><Lock className="w-6 h-6" /></button>}

                    <video
                        ref={videoRef}
                        poster={poster}
                        style={{ objectFit }}
                        className="w-full h-full cursor-pointer relative z-10"
                        onClick={() => !isLocked && togglePlay()}
                        onTimeUpdate={handleProgress}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onDoubleClick={(e) => {
                            if (isLocked) return;
                            e.clientX > e.currentTarget.getBoundingClientRect().width / 2
                                ? handleDoubleTap('right')
                                : handleDoubleTap('left');
                        }}
                    />

                    {/* DURATION WARNING FIX: transition-opacity duration-500 */}
                    <div className={`absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black via-black/80 to-transparent pt-32 pb-6 px-10 transition-opacity duration-500 ease-out flex flex-col gap-4 ${showControls && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>

                        <div className="flex flex-col mb-1 text-white">
                            <h2 className="text-sm font-semibold tracking-wide drop-shadow-md">{title}</h2>
                            <div className="flex items-center gap-4 text-xs font-medium text-white/80 mt-2">
                                <span>{new Date(videoRef.current?.currentTime ? videoRef.current.currentTime * 1000 : 0).toISOString().substr(14, 5)}</span>
                                <div className="flex-1 h-2 relative group/scrub cursor-pointer" onClick={handleSeek}>
                                    <div className="absolute inset-y-0 left-0 right-0 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
                                        <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="absolute top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full opacity-0 group-hover/scrub:opacity-100 shadow-[0_0_10px_rgba(255,255,255,1)]" style={{ left: `calc(${progress}% - 6px)` }} />
                                </div>
                                <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-6">
                                <button onClick={togglePlay} className="hover:text-indigo-400 hover:scale-110 transition-all drop-shadow-lg">
                                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
                                </button>

                                <div className="flex items-center gap-2 group/vol relative">
                                    <button onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }}>
                                        {videoRef.current?.muted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                    </button>
                                    <input type="range" min="0" max="1" step="0.05" value={videoRef.current?.muted ? 0 : volume}
                                        onChange={(e) => { setVolume(parseFloat(e.target.value)); if (videoRef.current) videoRef.current.volume = parseFloat(e.target.value); }}
                                        className="w-0 opacity-0 group-hover/vol:w-24 group-hover/vol:opacity-100 transition-all cursor-pointer h-1.5 bg-white/30 backdrop-blur rounded-lg accent-indigo-500 appearance-none" />
                                </div>

                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur font-mono text-[10px] uppercase hidden sm:flex">
                                    <MonitorDot className="w-3 h-3 text-indigo-400 animate-pulse" /> {activeSource.name}
                                </div>
                            </div>

                            <div className="flex items-center gap-5 relative">
                                <div className="relative">
                                    <button onClick={() => setActiveMenu(activeMenu ? null : 'main')} className={`hover:text-indigo-400 p-2 rounded-full hover:bg-white/10 transition-all ${activeMenu && 'rotate-90 text-indigo-400 bg-white/10'}`}>
                                        <Settings className="w-5 h-5" />
                                    </button>

                                    {activeMenu && (
                                        <div className="absolute bottom-14 right-0 w-52 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-1 z-50 text-sm overflow-hidden text-white/90 origin-bottom-right animate-in fade-in zoom-in-95 duration-200">
                                            {activeMenu === 'main' && (
                                                <>
                                                    <button onClick={() => setActiveMenu('quality')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex justify-between items-center transition">Quality <span className="text-xs text-white/50">{currentQuality === 'auto' ? 'Auto' : `${currentQuality}p`}</span></button>
                                                    <button onClick={() => setActiveMenu('audio')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex justify-between items-center transition">Audio <span className="text-xs text-white/50">{audioBoost ? 'Boosted' : 'Normal'}</span></button>
                                                    <button onClick={() => setActiveMenu('speed')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex justify-between items-center transition">Speed <span className="text-xs text-white/50">{playbackRate}x</span></button>
                                                    <button onClick={() => setActiveMenu('aspect')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex justify-between items-center transition">Display <span className="text-xs text-white/50">{objectFit}</span></button>
                                                    <div className="h-px bg-white/10 my-1" />
                                                    <button onClick={() => setAmbientMode(!ambientMode)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex justify-between items-center transition">Ambient Mode <div className={`w-2 h-2 rounded-full ${ambientMode ? 'bg-indigo-500' : 'bg-white/30'}`} /></button>
                                                </>
                                            )}

                                            {activeMenu !== 'main' && (
                                                <button onClick={() => setActiveMenu('main')} className="w-full text-left px-3 py-2 rounded-lg text-xs tracking-wider uppercase text-white/50 mb-2 border-b border-white/5 pb-2 hover:text-white">&larr; Back</button>
                                            )}

                                            {activeMenu === 'quality' && (
                                                <>
                                                    <button onClick={() => { hlsRef.current!.currentLevel = -1; setCurrentQuality('auto'); setActiveMenu(null); }} className={`px-3 py-2 rounded-xl text-left ${currentQuality === 'auto' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10'}`}>Auto (Adaptive)</button>
                                                    {qualityLevels.map(lvl => (
                                                        <button key={lvl.index} onClick={() => { hlsRef.current!.currentLevel = lvl.index; setCurrentQuality(lvl.height); setActiveMenu(null); }} className={`px-3 py-2 rounded-xl text-left flex justify-between ${currentQuality === lvl.height ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10'}`}>
                                                            {lvl.height}p {lvl.height >= 1080 && <span className="text-[10px] bg-yellow-500 text-black px-1.5 rounded-sm font-bold">HD</span>}
                                                        </button>
                                                    ))}
                                                </>
                                            )}

                                            {activeMenu === 'audio' && (
                                                <>
                                                    <div className="px-2 py-1 text-[10px] font-mono text-white/40 uppercase">Hardware Engine</div>
                                                    <button onClick={() => { setAudioBoost(!audioBoost); setActiveMenu(null); }} className={`px-3 py-2 rounded-xl text-left flex justify-between ${audioBoost ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10'}`}>
                                                        200% Volume Boost <Speaker className="w-4 h-4" />
                                                    </button>
                                                    {audioTracks.length > 1 && <div className="px-2 py-1 text-[10px] font-mono text-white/40 uppercase mt-2">HLS Tracks</div>}
                                                    {audioTracks.map(trk => (
                                                        <button key={trk.id} onClick={() => { hlsRef.current!.audioTrack = trk.id; setActiveMenu(null); }} className={`px-3 py-2 rounded-xl text-left ${hlsRef.current?.audioTrack === trk.id ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10'}`}>{trk.name}</button>
                                                    ))}
                                                </>
                                            )}

                                            {activeMenu === 'speed' && [0.5, 1, 1.25, 1.5, 2].map(s => (
                                                <button key={s} onClick={() => { setPlaybackRate(s); if (videoRef.current) videoRef.current.playbackRate = s; setActiveMenu(null); }} className={`px-3 py-2 rounded-xl text-left ${playbackRate === s ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10'}`}>{s}x Multiplier</button>
                                            ))}

                                            {activeMenu === 'aspect' && ['contain', 'cover', 'fill'].map(fit => (
                                                <button key={fit} onClick={() => { setObjectFit(fit as any); setActiveMenu(null); }} className={`px-3 py-2 rounded-xl text-left capitalize ${objectFit === fit ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10'}`}>{fit} Mode</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => { setIsLocked(true); setShowControls(false); }} title="Lock UI" className="hover:text-indigo-400 p-2 rounded-full hover:bg-white/10 transition"><Unlock className="w-4 h-4" /></button>
                                <button onClick={async () => { if (videoRef.current) document.pictureInPictureElement ? await document.exitPictureInPicture() : await videoRef.current.requestPictureInPicture(); }} className="hover:text-indigo-400 p-2 rounded-full hover:bg-white/10 transition hidden md:block"><PictureInPicture className="w-5 h-5" /></button>
                                <button onClick={toggleFullScreen} className="bg-white/10 p-2.5 rounded-2xl backdrop-blur hover:bg-white/20 transition hover:scale-105 active:scale-95">{isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});
