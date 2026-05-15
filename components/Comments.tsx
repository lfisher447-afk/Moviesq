// components/Comments.tsx
'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, Send, TerminalSquare } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

export function Comments({ movieId }: { movieId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setUser);
    const q = query(collection(db, 'comments'), where('movieId', '==', movieId), orderBy('createdAt', 'desc'));
    const unsubDB = onSnapshot(q, (snap) => setComments(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubAuth(); unsubDB(); };
  }, [movieId]);

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    await addDoc(collection(db, 'comments'), {
      movieId,
      text,
      userId: user.uid,
      userName: user.displayName || user.email.split('@')[0],
      userAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`,
      createdAt: serverTimestamp()
    });
    setText('');
  };

  return (
    <div className="glass-panel p-8 md:p-14 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-brand/10 transition-colors" />
      <h2 className="font-nexus text-4xl flex items-center gap-4 mb-12 text-white relative z-10"><TerminalSquare className="text-brand w-8 h-8 drop-shadow-md"/> SECURE_COMMS_LINK</h2>
      
      {user ? (
        <form onSubmit={postComment} className="flex gap-6 mb-16 relative z-10">
          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-14 h-14 rounded-2xl border border-brand/30 shadow-brand-glow object-cover"/>
          <div className="flex-1 relative">
            <input value={text} onChange={e => setText(e.target.value)} type="text" placeholder="TRANSMIT MESSAGE TO THE NEXUS..." className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand focus:shadow-[0_0_25px_rgba(229,9,20,0.2)] outline-none transition-all pr-16 text-sm font-medium placeholder:text-gray-600 shadow-inner"/>
            <button type="submit" disabled={!text} className="absolute right-3 top-3 p-3 bg-white/10 hover:bg-brand text-white rounded-xl disabled:opacity-50 transition-all drop-shadow-xl disabled:hover:bg-white/10 shadow-lg"><Send className="w-5 h-5"/></button>
          </div>
        </form>
      ) : (
        <div className="bg-black/50 p-10 rounded-[2rem] text-center mb-16 border border-white/10 shadow-inner relative z-10 flex flex-col items-center justify-center gap-5">
          <MessageSquare className="w-12 h-12 text-white/20" />
          <p className="text-gray-400 font-black text-xs tracking-widest uppercase">Nexus Authentication Required to Transmit Comm Logs to Node.</p>
          <a href="/profile" className="btn-nexus bg-white text-black px-10 py-4 rounded-full hover:bg-brand hover:text-white transition-all shadow-xl hover:shadow-brand-glow">INITIALIZE AGENT</a>
        </div>
      )}

      <div className="space-y-6 relative z-10 max-h-[800px] overflow-y-auto custom-scrollbar pr-4">
        {comments.map(c => (
          <div key={c.id} className="flex gap-6 group/comment">
            <img src={c.userAvatar} className="w-12 h-12 rounded-2xl border border-white/10 flex-shrink-0 shadow-lg object-cover grayscale opacity-80 group-hover/comment:grayscale-0 group-hover/comment:opacity-100 transition-all duration-500"/>
            <div className="flex-1 bg-white/[0.02] hover:bg-white/5 transition-colors p-6 rounded-3xl rounded-tl-none border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-black tracking-widest text-[11px] uppercase text-white group-hover/comment:text-brand transition-colors">{c.userName}</span>
                <span className="text-[9px] text-gray-500 font-black tracking-widest bg-black/40 px-2 py-1 rounded-md">{c.createdAt?.toDate().toLocaleDateString() || 'JUST_NOW'}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed font-medium">{c.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
            <div className="text-center text-gray-600 font-black tracking-widest text-xs uppercase pt-10">No communication logs detected in this sector</div>
        )}
      </div>
    </div>
  );
}
