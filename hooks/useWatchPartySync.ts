import { useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useWatchPartySync(roomCode: string, isHost: boolean) {
  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!roomCode) return;
    const roomRef = doc(db, 'rooms', roomCode);

    const unsub = onSnapshot(roomRef, (snap) => {
      if (!snap.exists() && isHost) {
        setDoc(roomRef, { playing: false, time: 0, hostTimestamp: Date.now(), srcIdx: 0 });
        return;
      }
      // In a real Iframe scenario, you need to use window.postMessage to sync the iframe player.
      // This hook abstracts the Firebase listener logic so the component stays clean.
      // E.g., emitting: videoRef.current?.contentWindow?.postMessage({ type: 'sync', data: snap.data() }, '*');
    });

    return () => unsub();
  }, [roomCode, isHost]);

  const updateHostState = async (playing: boolean, time: number, srcIdx: number) => {
    if (!isHost || !roomCode) return;
    await updateDoc(doc(db, 'rooms', roomCode), { playing, time, srcIdx, hostTimestamp: Date.now() });
  };

  return { videoRef, updateHostState };
}
