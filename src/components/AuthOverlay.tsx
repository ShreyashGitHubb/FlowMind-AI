'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck } from 'lucide-react';

export default function AuthOverlay({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {!user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 overflow-hidden opacity-20">
               <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]" />
            </div>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card max-w-md w-full p-10 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center text-primary neon-glow mb-8">
                <Zap size={40} fill="currentColor" />
              </div>

              <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">FlowMind AI</h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em] mb-8">Predictive Crowd Autopilot</p>

              <div className="space-y-4 w-full">
                <button 
                  onClick={login}
                  className="w-full btn-primary flex items-center justify-center gap-3 py-4 shadow-primary/20"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>
                
                <div className="flex items-center gap-3 py-4 opacity-40 justify-center">
                   <ShieldCheck size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Privacy Secure</span>
                </div>
              </div>

              <p className="mt-8 text-[10px] opacity-40 font-bold max-w-[240px]">
                By entering, you agree to allow FlowMind AI to guide your movement for stadium safety.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {user && children}
    </>
  );
}
