// hooks/useSyncEngine.ts
import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useSyncEngine(roomCode: string | null, isHost: boolean) {
    const [roomState, setRoomState] = useState<any>(null);

    useEffect(() => {
        if (!roomCode) return;

        const roomRef = doc(db, 'rooms', roomCode);
        
        const unsub = onSnapshot(roomRef, (snap) => {
            if (!snap.exists() && isHost) {
                setDoc(roomRef, {
                    playing: false,
                    currentTime: 0,
                    lastUpdated: serverTimestamp(),
                    hostId: 'current-user'
                });
            } else {
                setRoomState(snap.data());
            }
        });

        return () => unsub();
    }, [roomCode, isHost]);

    const broadcastState = async (playing: boolean, time: number) => {
        if (!isHost || !roomCode) return;
        await updateDoc(doc(db, 'rooms', roomCode), {
            playing,
            currentTime: time,
            lastUpdated: serverTimestamp()
        });
    };

    return { roomState, broadcastState };
}
