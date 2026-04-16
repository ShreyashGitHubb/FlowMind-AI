'use client';

import React, { useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function AuthOverlay({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useAuth();
  
  const optimizedLoadingSpinner = useMemo(() => (
    <div className="h-screen w-screen bg-[#050505] flex items-center justify-center" aria-live="polite" aria-busy="true" role="status">
      <span className="sr-only">Loading FlowMind AI Auth State...</span>
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  ), []);

  if (loading) return optimizedLoadingSpinner;

  return (
    <>
      <AnimatePresence>
        {!user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center p-6"
            role="dialog"
            aria-labelledby="auth-modal-title"
            aria-modal="true"
          >
            <div className="absolute inset-0 overflow-hidden opacity-20" aria-hidden="true">
               <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]" />
            </div>

            <motion.main 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card max-w-md w-full p-10 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center text-primary neon-glow mb-8" aria-hidden="true">
                <Zap size={40} fill="currentColor" />
              </div>

              <h1 id="auth-modal-title" className="text-3xl font-black tracking-tighter uppercase mb-2">FlowMind AI</h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em] mb-8" aria-live="polite">Predictive Crowd Autopilot</p>

              <section className="space-y-4 w-full" aria-label="Authentication Options">
                <button 
                  onClick={login}
                  className="w-full btn-primary flex items-center justify-center gap-3 py-4 shadow-primary/20"
                  aria-label="Continue authenticating safely using Google Single Sign-on"
                >
                  <Image src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google Identity Architecture" />
                  Continue with Google
                </button>
                
                <div className="flex items-center gap-3 py-4 opacity-40 justify-center">
                   <ShieldCheck size={16} aria-hidden="true" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Privacy Secure</span>
                </div>
              </section>

              <p className="mt-8 text-[10px] opacity-40 font-bold max-w-[240px]">
                By entering, you agree to allow FlowMind AI to guide your movement for stadium safety.
              </p>
            </motion.main>
          </motion.div>
        )}
      </AnimatePresence>
      {user && children}
    </>
  );
}
