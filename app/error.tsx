'use client';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div className="h-screen flex items-center justify-center p-6 relative bg-surface overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="glass-panel p-12 max-w-xl text-center space-y-8 relative z-10 border-brand/20 shadow-[0_0_50px_rgba(229,9,20,0.15)]">
         <div className="w-20 h-20 bg-brand/10 border border-brand/30 rounded-full flex items-center justify-center mx-auto">
           <AlertTriangle className="w-10 h-10 text-brand" />
         </div>
         <div>
            <h1 className="font-nexus text-5xl mb-2">SYSTEM OVERRIDE</h1>
            <p className="text-gray-400 text-sm font-medium">A core exception occurred in the Omnimux pipeline.</p>
         </div>
         
         <div className="flex flex-col gap-4">
            <button onClick={reset} className="btn-nexus bg-brand hover:brightness-110 text-white w-full">
               <RotateCcw className="w-5 h-5"/> REBOOT NODE
            </button>
            <Link href="/" className="btn-nexus bg-white/5 border border-white/10 text-white w-full">
               <Home className="w-5 h-5"/> RETURN TO NEXUS
            </Link>
         </div>
      </div>
    </div>
  );
}
