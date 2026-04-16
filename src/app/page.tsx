'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useStadiumSimulation } from '@/lib/simulator';
import { listenToStadiumState } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Bell, User, Activity, Users, Calendar } from 'lucide-react';
// Lazy load heavy rendering components for maximum initial render efficiency
const StadiumMap = dynamic(() => import('@/components/StadiumMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full flex items-center justify-center border border-white/5 rounded-2xl bg-white/5 animate-pulse"><div className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">Loading Topology Engine...</div></div> 
});
const AutopilotPanel = dynamic(() => import('@/components/AutopilotPanel'), { 
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-white/5 rounded-2xl border border-white/5" />
});

export default function Home() {
  const [isPredictive, setIsPredictive] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(true);
  const [isFollowMode, setIsFollowMode] = useState(false); // Sync with Organizer
  
  // Local simulation for standalone testing
  const { state: localState } = useStadiumSimulation(500, !isFollowMode);
  const [syncState, setSyncState] = useState<Record<string, unknown> | null>(null);

  // Listen to Organizer's Master Simulation
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isFollowMode) {
      unsubscribe = listenToStadiumState((state) => {
        setSyncState(state);
      });
    }
    return () => unsubscribe?.();
  }, [isFollowMode]);

  const currentState = isFollowMode && syncState ? syncState : localState;

  // React Render Optimization Callbacks
  const toggleFollowMode = useCallback(() => setIsFollowMode(prev => !prev), []);
  const setLiveFlow = useCallback(() => setIsPredictive(false), []);
  const setPredictiveFlow = useCallback(() => setIsPredictive(true), []);
  const toggleAutopilot = useCallback(() => setIsAutopilotActive(prev => !prev), []);

  return (
    <main className="flex flex-col h-screen bg-[#050505] text-foreground p-4 lg:p-6 gap-6 overflow-hidden">
      {/* Header Stat Bar / Accessible Navigation */}
      <nav aria-label="Main Navigation Framework" className="flex items-center justify-between glass p-4 rounded-2xl border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary neon-glow">
               <Zap size={20} />
             </div>
             <div>
               <h1 className="text-lg font-black tracking-tighter uppercase leading-none">FlowMind AI</h1>
               <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Fan Autopilot v1.5</p>
             </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />
          
          <div className="hidden md:flex gap-8">
            <StatItem icon={<Users size={16}/>} label="Attendance" value={currentState.agents.length.toString()} />
            <StatItem icon={<Activity size={16}/>} label="Sync Status" value={isFollowMode ? "NETWORK" : "LOCAL"} highlight={isFollowMode} />
            <StatItem icon={<Calendar size={16}/>} label="Event Phase" value={currentState.phase.replace('-', ' ')} highlight />
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Follow Mode Toggle */}
           <button 
             onClick={toggleFollowMode}
             aria-pressed={isFollowMode}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${isFollowMode ? 'border-secondary bg-secondary/10 text-secondary' : 'border-white/10 opacity-40 hover:opacity-100'}`}
           >
             {isFollowMode ? 'Following Organizer' : 'Standalone Mode'}
           </button>

           <div className="h-8 w-px bg-white/10 mx-2" />
           <div className="flex gap-2">
             <IconButton Icon={Bell} />
             <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ml-2 border-primary/20">
               <User size={20} className="text-primary" />
             </div>
           </div>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left: Map */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2">
            <div className="flex gap-4">
              <TabButton 
                active={!isPredictive} 
                onClick={setLiveFlow} 
                label="Live Flow"
                controls="stadium-map-panel"
              />
              <TabButton 
                active={isPredictive} 
                onClick={setPredictiveFlow} 
                label="Predicted (T+5)" 
                color="secondary"
                controls="stadium-map-panel"
              />
            </div>
          </div>
          
          <div id="stadium-map-panel" role="tabpanel" tabIndex={0} aria-label="Interactive Live Stadium Density Map" className="flex-1 min-h-[400px]">
            <StadiumMap 
              agents={currentState.agents} 
              zones={currentState.zones} 
              predictiveMode={isPredictive}
              activeEvents={currentState.activeEvents}
            />
          </div>
        </section>

        {/* Right: Autopilot Panel */}
        <aside className="col-span-12 lg:col-span-4 min-h-0">
          <AutopilotPanel 
            simulationState={currentState} 
            isAutopilotActive={isAutopilotActive}
            onToggleAutopilot={toggleAutopilot}
          />
        </aside>
      </div>

      {/* Footer Branding */}
      <footer className="flex items-center justify-between px-2 opacity-30">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{isFollowMode ? 'REMOTE_COMMAND_SYNC_ACTIVE' : 'LOCAL_AUTOPILOT_ONLY'}</span>
        <div className="flex gap-4 text-[10px] font-bold">
           <span>SYSTEM_STABLE</span>
           <span>GEMINI_LINK_OK</span>
        </div>
      </footer>
    </main>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

const StatItem = React.memo(({ icon, label, value, highlight = false }: StatItemProps) => {
  return (
    <div className="flex items-center gap-3" aria-label={`${label} Stat`}>
      <div className="opacity-40" aria-hidden="true">{icon}</div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{label}</p>
        <p className={`text-sm font-black uppercase ${highlight ? 'text-primary' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
});
StatItem.displayName = 'StatItem';

interface IconButtonProps {
  Icon: React.ElementType;
}

const IconButton = React.memo(({ Icon }: IconButtonProps) => {
  return (
    <button 
      className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-primary/20 transition-all text-white/60 hover:text-primary"
      aria-label="System notification control"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
});
IconButton.displayName = 'IconButton';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  controls?: string;
  color?: "primary" | "secondary";
}

const TabButton = React.memo(({ active, onClick, label, controls, color = "primary" }: TabButtonProps) => {
  return (
    <button 
      onClick={onClick}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      className={`relative px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all
        ${active ? (color === 'primary' ? 'text-primary' : 'text-secondary') : 'opacity-40 hover:opacity-100'}
      `}
    >
      {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className={`absolute bottom-0 left-0 w-full h-[2px] ${color === 'primary' ? 'bg-primary' : 'bg-secondary'}`}
        />
      )}
    </button>
  );
});
TabButton.displayName = 'TabButton';

