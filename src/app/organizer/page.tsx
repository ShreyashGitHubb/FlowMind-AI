'use client';

import React, { useState, useEffect } from 'react';
import { useStadiumSimulation } from '@/lib/simulator';
import { syncStadiumState } from '@/lib/firebase';
import StadiumMap from '@/components/StadiumMap';
import { Shield, AlertCircle, Users, Zap, Lock, Unlock, Camera, User, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

export default function OrganizerDashboard() {
  const { user, isOrganizer, logout } = useAuth();
  const { state: simulationState, setState: setSimulationState } = useStadiumSimulation(800, true);
  const [analyzing, setAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<any>(null);

  // Sync to Firebase for Fan views
  useEffect(() => {
    syncStadiumState(simulationState);
  }, [simulationState]);

  const toggleGate = (gateId: string) => {
    setSimulationState(prev => ({
      ...prev,
      activeEvents: {
        ...prev.activeEvents,
        [`${gateId}-closed`]: !prev.activeEvents[`${gateId}-closed`]
      }
    }));
  };

  const reassignStaff = (targetZoneId: string) => {
    setSimulationState(prev => {
      const agents = [...prev.agents];
      let moved = 0;
      const newAgents = agents.map(a => {
        if (a.isStaff && a.targetId !== targetZoneId && moved < 2) {
          moved++;
          return { ...a, targetId: targetZoneId };
        }
        return a;
      });
      return { ...prev, agents: newAgents };
    });
  };

  const analyzeCCTV = async (imageFile?: File) => {
    setAnalyzing(true);
    try {
      let base64 = "";
      if (imageFile) {
        const reader = new FileReader();
        base64 = await new Promise((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(imageFile);
        });
      }

      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stadiumState: simulationState, 
          role: "organizer",
          image: base64 || undefined
        })
      });
      const data = await res.json();
      setVisionResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isOrganizer) return (
    <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
       <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
         <Lock size={40} />
       </div>
       <h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1>
       <p className="text-sm opacity-40 max-w-xs mt-2">Only accounts with role: stadium_command can access this terminal.</p>
       <button onClick={logout} className="mt-8 text-primary font-bold uppercase text-[10px] tracking-widest border border-primary/20 px-8 py-3 rounded-full hover:bg-primary/5 transition-all">Switch Account</button>
    </div>
  );

  return (
    <main className="flex flex-col h-screen bg-[#050505] text-foreground p-6 gap-6 overflow-hidden">
      <header className="flex items-center justify-between glass p-4 rounded-2xl border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary neon-glow">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Command Center</h1>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-primary">Master Sync Active</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
           <div className="hidden md:flex gap-6 mr-6">
             <OrgStat label="Live Attendance" value={simulationState.agents.filter(a => !a.isStaff).length.toString()} />
             <OrgStat label="Staff Active" value={simulationState.agents.filter(a => a.isStaff).length.toString()} color="text-secondary" />
           </div>
           <div className="h-8 w-px bg-white/10" />
           <div className="flex items-center gap-3 pl-2">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black uppercase tracking-widest leading-none">{user?.displayName}</p>
               <button onClick={logout} className="text-[8px] font-bold text-red-500 uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">Sign Out</button>
             </div>
             <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary">
               <User size={20} />
             </div>
           </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        <section className="col-span-12 lg:col-span-8 relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
           <StadiumMap 
             agents={simulationState.agents} 
             zones={simulationState.zones} 
             predictiveMode={true} 
           />
           
           <div className="absolute top-6 right-6 flex flex-col gap-3">
              {simulationState.zones.filter(z => z.type === 'gate').map(gate => (
                <button 
                  key={gate.id}
                  onClick={() => toggleGate(gate.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border shadow-lg backdrop-blur-md
                    ${simulationState.activeEvents[`${gate.id}-closed`] 
                      ? 'bg-red-500/20 border-red-500/30 text-red-500 shadow-red-500/20' 
                      : 'bg-green-500/20 border-green-500/30 text-green-500'}
                  `}
                >
                  <div className={`w-2 h-2 rounded-full ${simulationState.activeEvents[`${gate.id}-closed`] ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                  {gate.name}: {simulationState.activeEvents[`${gate.id}-closed`] ? 'CLOSED' : 'OPEN'}
                </button>
              ))}
           </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-2">
          
          {/* CCTV Reality IQ */}
          <div className="glass-card border-secondary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <Camera size={80} />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                <Camera size={18} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest">CCTV Reality IQ</h2>
            </div>

            <p className="text-[10px] font-medium opacity-40 uppercase tracking-widest mb-6 leading-relaxed">Cross-verify simulator data against visual crowd imagery via Gemini Vision.</p>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={() => analyzeCCTV()}
                 disabled={analyzing}
                 className="btn-secondary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {analyzing ? (
                   <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <Zap size={16} fill="currentColor" />
                 )}
                 Analyze Live Feed
               </button>

               <label className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-all">
                  <Camera size={14} />
                  Upload CCTV Frame
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && analyzeCCTV(e.target.files[0])} />
               </label>
            </div>

            <AnimatePresence>
              {visionResult && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-6 pt-6 border-t border-white/5 space-y-4"
                >
                  <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20 text-secondary">
                     <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Zap size={12} fill="currentColor" /> Visual Discrepancy Found
                     </p>
                     <p className="text-[10px] font-bold text-white/80 leading-relaxed italic">
                        "{visionResult.visual_analysis}"
                     </p>
                  </div>

                  <div>
                     <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mb-2 block">Detected Bottlenecks</span>
                     <div className="flex flex-wrap gap-2">
                       {visionResult.predicted_hotspots?.map((h: string) => (
                         <span key={h} className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[9px] font-black uppercase">
                           {h}
                         </span>
                       ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass-card flex flex-col gap-4 border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-secondary" />
              <h3 className="font-black uppercase tracking-widest text-sm text-balance">Staff Deployment Hub</h3>
            </div>
            
            <div className="space-y-2">
              {simulationState.zones.slice(0, 6).map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-40">{zone.name}</p>
                    <p className="text-xs font-black">{zone.staffCount} Active</p>
                  </div>
                  <button 
                    onClick={() => reassignStaff(zone.id)}
                    className="px-4 py-2 bg-secondary/20 text-secondary border border-secondary/20 rounded-lg text-[9px] font-black uppercase hover:bg-secondary hover:text-black transition-all"
                  >
                    Deploy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function OrgStat({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) {
  return (
    <div className="text-right">
      <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{label}</p>
      <p className={`text-sm font-black uppercase ${color}`}>{value}</p>
    </div>
  );
}

