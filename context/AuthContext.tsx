'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signInWithPopup, 
    signOut, 
    User, 
    setPersistence, 
    browserLocalPersistence 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface AuthNexusProps {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    logOut: () => Promise<void>;
}

const AuthNexus = createContext<AuthNexusProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Enforce browser-wide persistence so sessions survive tab closures
        setPersistence(auth, browserLocalPersistence).catch((e) => {
            console.error("Nexus Persistence Protocol Failed:", e);
        });

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    },[]);

    const signIn = async () => {
        try { 
            const payload = await signInWithPopup(auth, googleProvider); 
            const agentName = payload.user.displayName?.split(' ')[0] || 'Agent';
            toast.success(`Nexus Synced. Welcome, ${agentName}`);
        } 
        catch (e: any) { 
            console.error("Nexus Auth Error:", e); 
            toast.error(e.message || "Authentication Blocked by Firewall");
        }
    };

    const logOut = async () => {
        try { 
            await signOut(auth); 
            toast.success("Connection Severed");
            setTimeout(() => { window.location.href = "/"; }, 600);
        } 
        catch (e: any) { 
            console.error("Nexus Signout Error:", e); 
            toast.error("Failed to decouple from Nexus.");
        }
    };

    return (
        <AuthNexus.Provider value={{ user, loading, signIn, logOut }}>
            {children}
        </AuthNexus.Provider>
    );
};

// FIXED: Exporting exactly as 'useNexusAuth' to resolve the import warning in movie/[id]/page.tsx
export const useNexusAuth = () => {
    const context = useContext(AuthNexus);
    if (context === undefined) {
        throw new Error("FATAL EXCEPTION: useNexusAuth must be executed within an <AuthProvider> wrapper.");
    }
    return context;
};
