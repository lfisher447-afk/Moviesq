'use client';
import {
  useState, useEffect, useRef, useCallback, createContext, useContext,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageCircle, Users, Settings,
  Copy, Check, Crown, BarChart2, ListVideo,
  StickyNote, Clock, Eye, Signal, Zap,
  Volume2, Minimize2, Star,
  PartyPopper, Shield, Radio, Film, Music2, X,
  Send, Hash, Smile, Pin,
} from 'lucide-react';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, setDoc, updateDoc,
  arrayUnion, arrayRemove, getDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNexusAuth } from '@/context/AuthContext';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface PartyMember {
  uid: string;
  name: string;
  photo: string;
  role: 'host' | 'mod' | 'member';
  muted: boolean;
  videoOff: boolean;
  handRaised: boolean;
  ping: number;
  bandwidth: 'high' | 'medium' | 'low';
  speaking: boolean;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  photo: string;
  text: string;
  timestamp: any;
  type: 'message' | 'reaction' | 'system' | 'poll' | 'pin';
  reactions?: Record<string, string[]>;
  pinned?: boolean;
  role?: string;
}

interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: string[] }[];
  createdBy: string;
  active: boolean;
}

interface QueueItem {
  id: string;
  title: string;
  thumb: string;
  addedBy: string;
  duration: string;
}

// ─── CONFETTI BURST ───────────────────────────────────────────────────────────
function ConfettiBurst({ trigger }: { trigger: number }) {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#E50914', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 4,
    delay: Math.random() * 0.5,
    drift: (Math.random() - 0.5) * 200,
  }));

  return (
    <AnimatePresence>
      {trigger > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
          {particles.map(p => (
            <motion.div
              key={`${trigger}-${p.id}`}
              initial={{ x: `${p.x}vw`, y: '110vh', opacity: 1, rotate: 0 }}
              animate={{ y: '-10vh', x: `calc(${p.x}vw + ${p.drift}px)`, opacity: 0, rotate: 720 }}
              transition={{ duration: 2.5 + p.delay, delay: p.delay, ease: 'easeOut' }}
              style={{ position: 'absolute', bottom: 0, width: p.size, height: p.size, borderRadius: 2, background: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── FLOATING REACTION ────────────────────────────────────────────────────────
function FloatingReaction({ emoji, id, onDone }: { emoji: string; id: number; onDone: (id: number) => void }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -200, opacity: 0, scale: 1.5 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
      onAnimationComplete={() => onDone(id)}
      className="fixed bottom-32 right-8 text-4xl pointer-events-none z-[9999] select-none"
      style={{ left: `calc(100vw - ${80 + Math.random() * 60}px)` }}
    >
      {emoji}
    </motion.div>
  );
}

// ─── PING & BANDWIDTH INDICATORS ──────────────────────────────────────────────
function PingDot({ ping }: { ping: number }) {
  const color = ping < 80 ? 'bg-green-500' : ping < 200 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[8px] font-mono text-gray-500">{ping}ms</span>
    </div>
  );
}

function BandwidthBars({ level }: { level: 'high' | 'medium' | 'low' }) {
  const heights = [4, 7, 10];
  const active = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  const color = level === 'high' ? 'bg-green-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-end gap-[2px]">
      {heights.map((h, i) => (
        <div key={i} style={{ height: h }} className={`w-[3px] rounded-sm ${i < active ? color : 'bg-white/10'}`} />
      ))}
    </div>
  );
}

// ─── MEMBER AVATAR ────────────────────────────────────────────────────────────
function MemberAvatar({ member, size = 'md' }: { member: PartyMember; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const roleColors = { host: 'border-yellow-500', mod: 'border-blue-500', member: 'border-white/20' };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full border-2 ${roleColors[member.role]} overflow-hidden relative`}>
        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
        {member.speaking && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 border-2 border-green-400 rounded-full"
          />
        )}
      </div>
      {member.muted && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center border border-black">
          <MicOff className="w-2 h-2 text-white" />
        </div>
      )}
      {member.handRaised && <div className="absolute -top-1 -right-1 text-[10px]">✋</div>}
      {member.role === 'host' && <div className="absolute -top-1 -left-1"><Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" /></div>}
    </div>
  );
}

// ─── UTILITY COMPONENTS (Timer, Polls, Queue, Notes, Stats, Chat) ─────────────
function PartyTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(t);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  return (
    <span className="font-mono text-[10px] text-gray-500 tabular-nums">
      {h > 0 && `${h}:`}{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

function PollWidget({ poll, onVote, uid }: { poll: Poll; onVote: (idx: number) => void; uid: string }) {
  const total = poll.options.reduce((a, o) => a + o.votes.length, 0);
  const hasVoted = poll.options.some(o => o.votes.includes(uid));
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 my-2">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-3.5 h-3.5 text-brand" />
        <span className="text-[11px] font-black tracking-widest text-white uppercase">{poll.question}</span>
      </div>
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes.length / total) * 100) : 0;
          const voted = opt.votes.includes(uid);
          return (
            <button
              key={i} onClick={() => !hasVoted && onVote(i)} disabled={hasVoted}
              className={`w-full relative rounded-xl overflow-hidden border text-left px-3 py-2 transition-all ${voted ? 'border-brand' : 'border-white/10 hover:border-white/30'}`}
            >
              <div className="absolute inset-0 bg-brand/20 transition-all" style={{ width: hasVoted ? `${pct}%` : '0%' }} />
              <div className="relative flex justify-between items-center">
                <span className="text-[10px] font-bold text-white">{opt.text}</span>
                {hasVoted && <span className="text-[10px] font-black text-brand">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-[9px] text-gray-600 font-mono">{total} votes · {poll.active ? 'ACTIVE' : 'CLOSED'}</div>
    </div>
  );
}

function QueuePanel({ queue }: { queue: QueueItem[] }) {
  if (!queue.length) return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-600">
      <ListVideo className="w-8 h-8" />
      <span className="text-[10px] font-black tracking-widest uppercase">Queue is empty</span>
    </div>
  );
  return (
    <div className="space-y-2 p-3">
      {queue.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
          <div className="w-6 h-6 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-black text-brand">{i + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-white truncate">{item.title}</div>
            <div className="text-[8px] text-gray-600 font-mono">{item.duration} · by {item.addedBy}</div>
          </div>
          <Film className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand transition-colors" />
        </div>
      ))}
    </div>
  );
}

function NotesPanel() {
  const [notes, setNotes] = useState('');
  useEffect(() => {
    const saved = localStorage.getItem('omnimux-party-notes');
    if (saved) setNotes(saved);
  }, []);
  const save = (v: string) => { setNotes(v); localStorage.setItem('omnimux-party-notes', v); };
  return (
    <div className="p-3 h-full flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-gray-500 uppercase">
        <StickyNote className="w-3 h-3" /> Shared Notes (local)
      </div>
      <textarea
        value={notes} onChange={e => save(e.target.value)}
        placeholder="Jot down timestamps, hot takes, watch order notes..."
        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white placeholder-gray-700 resize-none focus:outline-none focus:border-brand/50 font-mono leading-relaxed"
      />
    </div>
  );
}

function StatsPanel({ members, messages, partyStart }: { members: PartyMember[]; messages: ChatMessage[]; partyStart: number }) {
  const elapsed = Date.now() - partyStart;
  const mins = Math.floor(elapsed / 60000);
  const avgPing = members.length ? Math.round(members.reduce((a, m) => a + m.ping, 0) / members.length) : 0;
  const topChatter = messages.reduce((acc, m) => {
    if (m.type === 'message') acc[m.name] = (acc[m.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const [topName, topCount] = Object.entries(topChatter).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
  const stats = [
    { label: 'RUNTIME', value: `${mins}m`, icon: Clock },
    { label: 'MEMBERS', value: members.length, icon: Users },
    { label: 'MESSAGES', value: messages.filter(m => m.type === 'message').length, icon: MessageCircle },
    { label: 'AVG PING', value: `${avgPing}ms`, icon: Signal },
    { label: 'TOP CHATTER', value: topName, icon: Crown },
    { label: 'MESSAGES/MIN', value: mins > 0 ? (messages.length / mins).toFixed(1) : '—', icon: Zap },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
          <s.icon className="w-3 h-3 text-brand mb-1.5" />
          <div className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase">{s.label}</div>
          <div className="text-[13px] font-black text-white truncate">{String(s.value)}</div>
        </div>
      ))}
    </div>
  );
}

function ChatMsg({ msg, onReact, onPin, isHost, uid }: { msg: ChatMessage; onReact: (msgId: string, emoji: string) => void; onPin: (msgId: string) => void; isHost: boolean; uid: string; }) {
  const [hover, setHover] = useState(false);
  if (msg.type === 'system') return (
    <div className="flex items-center gap-2 px-4 py-1.5 my-1">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[8px] font-black tracking-[0.2em] text-gray-600 uppercase">{msg.text}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
  const roleColors: Record<string, string> = { host: 'text-yellow-400', mod: 'text-blue-400', member: 'text-white' };
  return (
    <div
      className={`group flex gap-2.5 px-4 py-1.5 hover:bg-white/[0.03] rounded-xl transition-all relative ${msg.pinned ? 'bg-brand/5 border-l-2 border-brand' : ''}`}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    >
      <img src={msg.photo} alt={msg.name} className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 border border-white/10" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-[10px] font-black ${roleColors[msg.role || 'member']}`}>{msg.name}</span>
          {msg.role === 'host' && <Crown className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />}
          {msg.pinned && <Pin className="w-2.5 h-2.5 text-brand" />}
          <span className="text-[8px] text-gray-700 font-mono">
            {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed break-words">{msg.text}</p>
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(msg.reactions).map(([emoji, uids]) =>
              uids.length > 0 ? (
                <button
                  key={emoji} onClick={() => onReact(msg.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-all ${uids.includes(uid) ? 'bg-brand/20 border-brand/50 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                >
                  {emoji} <span className="font-black">{uids.length}</span>
                </button>
              ) : null
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-3 top-1 flex items-center gap-1 bg-[#0d0d12] border border-white/10 rounded-xl px-2 py-1 shadow-xl"
          >
            {['❤️', '😂', '😮', '🔥'].map(e => (
              <button key={e} onClick={() => onReact(msg.id, e)} className="text-[13px] hover:scale-125 transition-transform">{e}</button>
            ))}
            {isHost && (
              <button onClick={() => onPin(msg.id)} className="ml-1 p-0.5 hover:text-brand text-gray-600 transition-colors"><Pin className="w-3 h-3" /></button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const REACTIONS = ['❤️', '😂', '😮', '👍', '🔥', '👻', '🎉', '💀'];
const PARTY_MODES = [
  { id: 'cinema', label: 'CINEMA', icon: Film, desc: 'Quiet. No reactions. Immersive.', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
  { id: 'party', label: 'PARTY', icon: PartyPopper, desc: 'Reactions on. Confetti. Hype.', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { id: 'chill', label: 'CHILL', icon: Music2, desc: 'Relaxed. Low-key chat.', color: 'text-green-400 border-green-500/40 bg-green-500/10' },
  { id: 'focus', label: 'FOCUS', icon: Eye, desc: 'No chat. Just watch.', color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
] as const;

// ─── MAIN OVERLAY COMPONENT ───────────────────────────────────────────────────
export function WatchPartyOverlay({ roomCode, onLeave, videoRef }: { roomCode: string; onLeave: () => void; videoRef?: React.RefObject<HTMLVideoElement>; }) {
  const { user } = useNexusAuth();
  const uid = user?.uid || `anon-${Math.floor(Math.random() * 1000)}`;
  const displayName = user?.displayName || 'Agent';
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=E50914&color=fff`;

  // ── STATE
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'queue' | 'notes' | 'stats' | 'settings'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [partyMode, setPartyModeState] = useState<'cinema' | 'party' | 'chill' | 'focus'>('chill');
  const [slowMode, setSlowMode] = useState(0);
  const [slowModeTimer, setSlowModeTimer] = useState(0);
  const [spotlightUid, setSpotlightUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);
  const [confettiBurst, setConfettiBurst] = useState(0);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isHost, setIsHost] = useState(false);
  const [partyStartTime] = useState(Date.now());
  const [minimized, setMinimized] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [chatTheme, setChatTheme] = useState<'dark' | 'glass' | 'neon'>('dark');
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [showPinned, setShowPinned] = useState(false);

  // ── REFS
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const reactionIdRef = useRef(0);
  const slowModeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── EFFECTS ─────────────────────────────────────────────────────────────────

  // Auto-pause on host tab leave
  useEffect(() => {
    const handle = () => {
      if (document.hidden && videoRef?.current && !videoRef.current.paused) {
        videoRef.current.pause();
        sendSystemMsg('⏸ Auto-paused: host left tab');
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [videoRef]);

  // Video Sync & Room Initialization (Merged logic)
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = doc(db, 'rooms', roomCode);

    getDoc(roomRef).then((snap) => {
        if (!snap.exists()) {
            setIsHost(true);
            setDoc(roomRef, { hostId: uid, playing: false, time: 0, ts: Date.now(), partyMode: 'chill', slowMode: 0 });
        } else {
            setIsHost(snap.data().hostId === uid);
        }
    });

    const unsubRoom = onSnapshot(roomRef, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            setIsHost(data.hostId === uid);
            if (data.partyMode) setPartyModeState(data.partyMode);
            if (data.slowMode !== undefined) setSlowMode(data.slowMode);

            // Sync Video Time
            try {
               const el = videoRef?.current;
               if (!isHost && el && el.nodeName === 'VIDEO' && 'currentTime' in el) {
                  const expected = data.playing ? data.time + (Date.now() - data.ts) / 1000 : data.time;
                  if (Math.abs(el.currentTime - expected) > 2) el.currentTime = expected;
                  if (data.playing && el.paused) el.play().catch(() => {});
                  if (!data.playing && !el.paused) el.pause();
               }
            } catch (e) { console.error("Sync error:", e); }
        } else {
            if (!isHost) onLeave(); // Room deleted, guests kicked
        }
    });

    return () => { unsubRoom(); };
  }, [roomCode, uid, videoRef, isHost, onLeave]);

  // Members Listener
  useEffect(() => {
    if (!roomCode || !uid) return;
    const memberRef = doc(db, 'rooms', roomCode, 'members', uid);
    const meData: PartyMember = {
      uid, name: displayName, photo: photoURL, role: isHost ? 'host' : 'member',
      muted, videoOff, handRaised, ping: Math.floor(Math.random() * 60 + 20),
      bandwidth: 'high', speaking: false, joinedAt: Date.now(),
    };
    setDoc(memberRef, meData, { merge: true });

    const unsub = onSnapshot(collection(db, 'rooms', roomCode, 'members'), snap => {
      const list = snap.docs.map(d => d.data() as PartyMember);
      setMembers(list);
    });
    return () => { unsub(); };
  }, [roomCode, uid, isHost, muted, videoOff, handRaised, displayName, photoURL]);

  // Chat Listener
  useEffect(() => {
    if (!roomCode) return;
    return onSnapshot(query(collection(db, 'rooms', roomCode, 'chat'), orderBy('timestamp', 'asc')), snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      setPinnedMessages(msgs.filter(m => m.pinned));
    });
  }, [roomCode]);

  // Polls & Queue Listeners
  useEffect(() => {
    if (!roomCode) return;
    const unsubPolls = onSnapshot(collection(db, 'rooms', roomCode, 'polls'), snap => setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() } as Poll))));
    const unsubQueue = onSnapshot(query(collection(db, 'rooms', roomCode, 'queue'), orderBy('addedAt', 'asc')), snap => setQueue(snap.docs.map(d => ({ id: d.id, ...d.data() } as QueueItem))));
    return () => { unsubPolls(); unsubQueue(); };
  }, [roomCode]);

  // Auto-scroll mechanics
  useEffect(() => { if (!autoScrollPaused) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, autoScrollPaused]);
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const handle = () => setAutoScrollPaused(el.scrollHeight - el.scrollTop - el.clientHeight >= 50);
    el.addEventListener('scroll', handle);
    return () => el.removeEventListener('scroll', handle);
  }, []);

  // ── ACTIONS ─────────────────────────────────────────────────────────────────
  const startSlowMode = () => {
    if (slowMode <= 0) return;
    setSlowModeTimer(slowMode);
    if (slowModeRef.current) clearInterval(slowModeRef.current);
    slowModeRef.current = setInterval(() => {
      setSlowModeTimer(v => {
        if (v <= 1) { if (slowModeRef.current) clearInterval(slowModeRef.current); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !roomCode || partyMode === 'focus' || slowModeTimer > 0) return;
    await addDoc(collection(db, 'rooms', roomCode, 'chat'), {
      uid, name: displayName, photo: photoURL, text,
      timestamp: serverTimestamp(), type: 'message',
      role: isHost ? 'host' : 'member', reactions: {},
    });
    if (slowMode > 0) startSlowMode();
  }, [roomCode, uid, displayName, photoURL, partyMode, slowModeTimer, slowMode, isHost]);

  const sendSystemMsg = useCallback(async (text: string) => {
    if (!roomCode) return;
    await addDoc(collection(db, 'rooms', roomCode, 'chat'), {
      uid: 'system', name: 'SYSTEM', photo: '', text, timestamp: serverTimestamp(), type: 'system',
    });
  }, [roomCode]);

  const sendReaction = useCallback(async (emoji: string) => {
    if (!roomCode || partyMode === 'cinema' || partyMode === 'focus') return;
    const id = ++reactionIdRef.current;
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    if (partyMode === 'party') setConfettiBurst(v => v + 1);
  }, [roomCode, partyMode]);

  const reactToMessage = useCallback(async (msgId: string, emoji: string) => {
    if (!roomCode) return;
    const msgRef = doc(db, 'rooms', roomCode, 'chat', msgId);
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    await updateDoc(msgRef, { [`reactions.${emoji}`]: msg.reactions?.[emoji]?.includes(uid) ? arrayRemove(uid) : arrayUnion(uid) });
  }, [roomCode, messages, uid]);

  const pinMessage = useCallback(async (msgId: string) => {
    if (!roomCode || !isHost) return;
    const msgRef = doc(db, 'rooms', roomCode, 'chat', msgId);
    const msg = messages.find(m => m.id === msgId);
    await updateDoc(msgRef, { pinned: !msg?.pinned });
  }, [roomCode, isHost, messages]);

  const sendPoll = useCallback(async (question: string, options: string[]) => {
    if (!roomCode || !isHost) return;
    await addDoc(collection(db, 'rooms', roomCode, 'polls'), {
      question, options: options.map(o => ({ text: o, votes: [] })), createdBy: displayName, active: true,
    });
    await sendSystemMsg(`📊 Poll: "${question}"`);
  }, [roomCode, isHost, displayName, sendSystemMsg]);

  const votePoll = useCallback(async (pollId: string, optIdx: number) => {
    if (!roomCode) return;
    await updateDoc(doc(db, 'rooms', roomCode, 'polls', pollId), { [`options.${optIdx}.votes`]: arrayUnion(uid) });
  }, [roomCode, uid]);

  const toggleHandRaise = useCallback(async () => {
    if (!roomCode) return;
    setHandRaised(!handRaised);
    await setDoc(doc(db, 'rooms', roomCode, 'members', uid), { handRaised: !handRaised }, { merge: true });
    if (!handRaised) sendSystemMsg(`✋ ${displayName} raised their hand`);
  }, [roomCode, handRaised, uid, displayName, sendSystemMsg]);

  const setPartyMode = useCallback(async (mode: typeof partyMode) => {
    setPartyModeState(mode);
    if (roomCode && isHost) {
      await updateDoc(doc(db, 'rooms', roomCode), { partyMode: mode });
      sendSystemMsg(`🎭 Party mode: ${mode.toUpperCase()}`);
    }
  }, [roomCode, isHost, sendSystemMsg]);

  const addToQueue = useCallback(async (item: Omit<QueueItem, 'id'>) => {
    if (!roomCode) return;
    await addDoc(collection(db, 'rooms', roomCode, 'queue'), { ...item, addedAt: serverTimestamp() });
    sendSystemMsg(`🎬 ${item.addedBy} added "${item.title}" to the queue`);
  }, [roomCode, sendSystemMsg]);

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) { sendMessage(chatInput); setChatInput(''); }
  };

  const handleLeave = async () => {
    if (isHost && roomCode) { await deleteDoc(doc(db, 'rooms', roomCode)); }
    onLeave();
  };

  const currentMode = PARTY_MODES.find(m => m.id === partyMode)!;
  const ModeIcon = currentMode.icon;
  const themeClasses = {
    dark: 'bg-[#0a0a0f] border-white/8',
    glass: 'bg-white/5 border-white/10 backdrop-blur-3xl',
    neon: 'bg-[#050510] border-brand/30 shadow-[0_0_40px_rgba(229,9,20,0.1)]',
  };

  return (
    <>
      <ConfettiBurst trigger={confettiBurst} />
      {floatingReactions.map(r => (
        <FloatingReaction key={r.id} emoji={r.emoji} id={r.id} onDone={id => setFloatingReactions(prev => prev.filter(x => x.id !== id))} />
      ))}

      <AnimatePresence>
        {minimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 100 }}
            onClick={() => setMinimized(false)}
            className="fixed bottom-20 right-4 z-[9995] cursor-pointer"
          >
            <div className="flex items-center gap-3 bg-[#0a0a0f]/95 border border-brand/40 rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(229,9,20,0.2)] backdrop-blur-xl">
              <div className="flex -space-x-2">
                {members.slice(0, 4).map(m => (<img key={m.uid} src={m.photo} className="w-6 h-6 rounded-full border border-black" alt="avatar" />))}
              </div>
              <div>
                <div className="text-[9px] font-black tracking-widest text-brand uppercase">WATCH PARTY</div>
                <div className="text-[8px] text-gray-500 font-mono">{members.length} connected · {roomCode}</div>
              </div>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 rounded-full bg-green-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className={`fixed right-0 top-0 bottom-0 z-[9990] flex flex-col w-[380px] border-l ${themeClasses[chatTheme]} overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.8)]`}
          >
            <div className="flex-shrink-0 border-b border-white/8 bg-black/60 backdrop-blur-xl">
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-black tracking-widest text-white uppercase">Watch Party</div>
                    <div className="text-[8px] font-mono text-gray-600 flex items-center gap-1">
                      <span className="text-brand font-black">{roomCode}</span> <span>·</span> <span>{members.length} agents</span> <span>·</span> <PartyTimer startTime={partyStartTime} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setShowModeSelect(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[8px] font-black tracking-widest uppercase transition-all ${currentMode.color}`}>
                    <ModeIcon className="w-2.5 h-2.5" /> {currentMode.label}
                  </button>
                  <button onClick={() => setMinimized(true)} className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleLeave} className="w-7 h-7 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center hover:bg-red-600/40 transition-all text-red-400 hover:text-white">
                    <PhoneOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showModeSelect && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                    <div className="grid grid-cols-4 gap-1.5 p-3">
                      {PARTY_MODES.map(m => {
                        const Icon = m.icon;
                        return (
                          <button key={m.id} onClick={() => { setPartyMode(m.id as any); setShowModeSelect(false); }} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${partyMode === m.id ? m.color : 'border-white/5 bg-white/3 text-gray-500 hover:border-white/20'}`}>
                            <Icon className="w-4 h-4" /> <span className="text-[8px] font-black tracking-wider">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-3 pb-2 text-[9px] text-gray-600 text-center">{currentMode.desc}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between px-4 pb-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setMuted(v => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black transition-all ${muted ? 'bg-red-600/20 border-red-600/40 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}>
                    {muted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />} {muted ? 'MUTED' : 'MIC'}
                  </button>
                  <button onClick={() => setVideoOff(v => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black transition-all ${videoOff ? 'bg-red-600/20 border-red-600/40 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}>
                    {videoOff ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />} CAM
                  </button>
                  <button onClick={toggleHandRaise} className={`px-3 py-1.5 rounded-xl border text-[9px] font-black transition-all ${handRaised ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}>✋</button>
                  <button onClick={copyInvite} className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[9px] font-black text-gray-400 hover:text-white hover:border-white/30 transition-all flex items-center gap-1">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} {copied ? 'COPIED' : 'INVITE'}
                  </button>
                </div>
                <button onClick={() => setShowReactionBar(v => !v)} className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[13px] hover:bg-white/10 transition-all">😄</button>
              </div>

              <AnimatePresence>
                {showReactionBar && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                    <div className="flex items-center justify-around px-4 py-2">
                      {REACTIONS.map(e => (<button key={e} onClick={() => sendReaction(e)} className="text-[22px] hover:scale-150 transition-transform active:scale-90">{e}</button>))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
                {members.map(m => (
                  <div key={m.uid} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <MemberAvatar member={m} size="sm" />
                    <BandwidthBars level={m.bandwidth} />
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {pinnedMessages.length > 0 && showPinned && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-brand/20 bg-brand/5">
                    <div className="px-4 py-2 flex items-start gap-2">
                      <Pin className="w-3 h-3 text-brand flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] font-black text-brand tracking-widest uppercase mb-0.5">Pinned</div>
                        <p className="text-[10px] text-gray-300 truncate">{pinnedMessages[pinnedMessages.length - 1]?.text}</p>
                      </div>
                      <button onClick={() => setShowPinned(false)} className="text-gray-600 hover:text-white"><X className="w-3 h-3" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!showPinned && pinnedMessages.length > 0 && (
                <button onClick={() => setShowPinned(true)} className="w-full text-[8px] font-black tracking-widest text-brand/60 hover:text-brand uppercase py-1 border-t border-white/5 transition-colors flex items-center justify-center gap-1">
                  <Pin className="w-2.5 h-2.5" /> {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
                </button>
              )}

              <div className="flex border-t border-white/5">
                {([ { id: 'chat', icon: MessageCircle, label: 'Chat' }, { id: 'members', icon: Users, label: 'Members' }, { id: 'queue', icon: ListVideo, label: 'Queue' }, { id: 'notes', icon: StickyNote, label: 'Notes' }, { id: 'stats', icon: BarChart2, label: 'Stats' }, { id: 'settings', icon: Settings, label: 'Settings' } ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[8px] font-black tracking-wider uppercase transition-all border-b-2 ${activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {activeTab === 'chat' && (
                <>
                  {partyMode === 'focus' ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
                      <Eye className="w-10 h-10" /> <span className="text-[10px] font-black tracking-widest uppercase">Focus Mode Active</span> <span className="text-[9px]">Chat disabled. Just watch.</span>
                    </div>
                  ) : (
                    <>
                      <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                        {messages.map(msg => msg.type === 'poll' ? null : (<ChatMsg key={msg.id} msg={msg} onReact={reactToMessage} onPin={pinMessage} isHost={isHost} uid={uid} />))}
                        {polls.map(poll => (<div key={poll.id} className="px-4"><PollWidget poll={poll} onVote={idx => votePoll(poll.id, idx)} uid={uid} /></div>))}
                        <div ref={messagesEndRef} />
                      </div>

                      <AnimatePresence>
                        {autoScrollPaused && (
                          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={() => { setAutoScrollPaused(false); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="mx-4 mb-2 py-1.5 rounded-xl bg-brand/20 border border-brand/40 text-[9px] font-black text-brand tracking-widest uppercase text-center">
                            ↓ New messages
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {slowModeTimer > 0 && (<div className="mx-4 mb-2 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-[9px] font-black text-yellow-500 tracking-widest uppercase text-center">⏱ Slow mode: {slowModeTimer}s</div>)}

                      <AnimatePresence>
                        {showPollCreator && isHost && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5">
                            <div className="p-3 space-y-2">
                              <div className="text-[9px] font-black tracking-widest text-brand uppercase flex items-center gap-2"><BarChart2 className="w-3 h-3" /> Create Poll</div>
                              <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Question..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder-gray-700 focus:outline-none focus:border-brand/50" />
                              {pollOptions.map((o, i) => (
                                <input key={i} value={o} onChange={e => setPollOptions(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} placeholder={`Option ${i + 1}`} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder-gray-700 focus:outline-none focus:border-brand/50" />
                              ))}
                              <div className="flex gap-2">
                                <button onClick={() => setPollOptions(prev => [...prev, ''])} className="text-[9px] font-black text-brand border border-brand/30 rounded-lg px-3 py-1.5 hover:bg-brand/10 transition-all">+ Option</button>
                                <button onClick={() => { if (pollQuestion && pollOptions.filter(Boolean).length >= 2) { sendPoll(pollQuestion, pollOptions.filter(Boolean)); setPollQuestion(''); setPollOptions(['', '']); setShowPollCreator(false); } }} className="flex-1 text-[9px] font-black bg-brand text-white rounded-lg px-3 py-1.5 hover:bg-red-700 transition-all">Launch Poll</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex-shrink-0 border-t border-white/5 p-3">
                        <form onSubmit={handleSend} className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-brand/40 transition-all">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={slowModeTimer > 0 ? `Slow mode (${slowModeTimer}s)...` : 'Message the party...'} disabled={slowModeTimer > 0} className="flex-1 bg-transparent text-[11px] text-white placeholder-gray-700 focus:outline-none" />
                            {isHost && (<button type="button" onClick={() => setShowPollCreator(v => !v)} className="text-gray-600 hover:text-brand transition-colors flex-shrink-0"><BarChart2 className="w-3.5 h-3.5" /></button>)}
                            <button type="button" onClick={() => setShowReactionBar(v => !v)} className="text-gray-600 hover:text-yellow-400 transition-colors flex-shrink-0"><Smile className="w-3.5 h-3.5" /></button>
                          </div>
                          <button type="submit" disabled={!chatInput.trim() || slowModeTimer > 0} className="w-9 h-9 rounded-2xl bg-brand flex items-center justify-center hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"><Send className="w-4 h-4 text-white" /></button>
                        </form>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'members' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {members.map(m => (
                    <div key={m.uid} className="flex items-center gap-3 p-3 rounded-2xl bg-white/3 border border-white/5 hover:border-white/10 transition-all group">
                      <MemberAvatar member={m} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-black ${m.role === 'host' ? 'text-yellow-400' : m.role === 'mod' ? 'text-blue-400' : 'text-white'}`}>{m.name}</span>
                          {m.role === 'host' && <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />} {m.handRaised && <span className="text-[10px]">✋</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <PingDot ping={m.ping} /> <BandwidthBars level={m.bandwidth} />
                          {m.muted && <span className="text-[8px] text-red-400 font-black uppercase">MUTED</span>}
                          {m.speaking && <span className="text-[8px] text-green-400 font-black uppercase animate-pulse">SPEAKING</span>}
                        </div>
                      </div>
                      {isHost && m.uid !== uid && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                          <button onClick={() => setSpotlightUid(spotlightUid === m.uid ? null : m.uid)} className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${spotlightUid === m.uid ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-white/10 bg-white/5 text-gray-500 hover:text-white'}`}><Star className="w-3 h-3" /></button>
                          <button onClick={() => sendSystemMsg(`🚫 ${m.name} was removed from the party`)} className="w-7 h-7 rounded-xl border border-red-600/30 bg-red-600/10 flex items-center justify-center text-red-500 hover:bg-red-600/20 transition-all"><X className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {members.length === 0 && (<div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-700"><Users className="w-10 h-10" /> <span className="text-[10px] font-black tracking-widest uppercase">No members yet</span></div>)}
                </div>
              )}

              {activeTab === 'queue' && (
                <div className="flex-1 overflow-y-auto">
                  <QueuePanel queue={queue} />
                  {isHost && (
                    <div className="p-3 border-t border-white/5">
                      <button onClick={() => addToQueue({ title: 'Movie Title', thumb: '', addedBy: displayName, duration: '2h 10m' })} className="w-full py-2.5 rounded-2xl border border-brand/30 bg-brand/10 text-[10px] font-black text-brand tracking-widest uppercase hover:bg-brand/20 transition-all flex items-center justify-center gap-2">
                        <ListVideo className="w-3.5 h-3.5" /> Add to Queue
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (<div className="flex-1 overflow-hidden"><NotesPanel /></div>)}

              {activeTab === 'stats' && (<div className="flex-1 overflow-y-auto"><StatsPanel members={members} messages={messages} partyStart={partyStartTime} /></div>)}

              {activeTab === 'settings' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <div>
                    <div className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase mb-3 flex items-center gap-2"><Hash className="w-3 h-3" /> Chat Theme</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['dark', 'glass', 'neon'] as const).map(t => (<button key={t} onClick={() => setChatTheme(t)} className={`py-2 rounded-xl border text-[9px] font-black tracking-widest uppercase transition-all ${chatTheme === t ? 'bg-brand/20 border-brand/50 text-brand' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>{t}</button>))}
                    </div>
                  </div>

                  {isHost && (
                    <div>
                      <div className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase mb-3 flex items-center gap-2"><Clock className="w-3 h-3" /> Slow Mode</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 5, 10, 30].map(s => (<button key={s} onClick={() => { setSlowMode(s); if (roomCode) updateDoc(doc(db, 'rooms', roomCode), { slowMode: s }); sendSystemMsg(s > 0 ? `⏱ Slow mode: ${s}s` : '⏱ Slow mode disabled'); }} className={`py-2 rounded-xl border text-[9px] font-black tracking-widest transition-all ${slowMode === s ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>{s === 0 ? 'OFF' : `${s}s`}</button>))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase mb-3 flex items-center gap-2"><Volume2 className="w-3 h-3" /> Master Volume</div>
                    <input type="range" min="0" max="100" defaultValue="100" onChange={e => { if (videoRef?.current) videoRef.current.volume = parseInt(e.target.value) / 100; }} className="w-full accent-brand" />
                  </div>

                  <div>
                    <div className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase mb-3 flex items-center gap-2"><Radio className="w-3 h-3" /> My Status</div>
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between p-3 rounded-xl border ${muted ? 'border-red-600/30 bg-red-600/5' : 'border-white/5 bg-white/3'}`}>
                        <span className="text-[10px] font-black text-white">Microphone</span>
                        <button onClick={() => setMuted(v => !v)} className={`w-6 h-3 rounded-full transition-all relative ${muted ? 'bg-red-600' : 'bg-green-500'}`}><div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${muted ? 'left-0.5' : 'left-3.5'}`} /></button>
                      </div>
                      <div className={`flex items-center justify-between p-3 rounded-xl border ${videoOff ? 'border-red-600/30 bg-red-600/5' : 'border-white/5 bg-white/3'}`}>
                        <span className="text-[10px] font-black text-white">Camera</span>
                        <button onClick={() => setVideoOff(v => !v)} className={`w-6 h-3 rounded-full transition-all relative ${videoOff ? 'bg-red-600' : 'bg-green-500'}`}><div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${videoOff ? 'left-0.5' : 'left-3.5'}`} /></button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase mb-3 flex items-center gap-2"><Shield className="w-3 h-3" /> Room Code</div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="flex-1 font-mono text-[13px] font-black text-brand tracking-widest">{roomCode}</span>
                      <button onClick={copyInvite} className="text-gray-500 hover:text-white transition-colors">{copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}</button>
                    </div>
                  </div>

                  <button onClick={handleLeave} className="w-full py-3 rounded-2xl bg-red-600/20 border border-red-600/40 text-[10px] font-black text-red-400 tracking-widest uppercase hover:bg-red-600/30 transition-all flex items-center justify-center gap-2">
                    <PhoneOff className="w-3.5 h-3.5" /> Leave Party
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
