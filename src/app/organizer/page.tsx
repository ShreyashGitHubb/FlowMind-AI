'use client';

import React, { useState, useEffect } from 'react';
import { useStadiumSimulation } from '@/lib/simulator';
import { syncStadiumState } from '@/lib/firebase';
import StadiumMap from '@/components/StadiumMap';
import { Shield, AlertCircle, Users, Zap, TrendingUp, Lock, Unlock, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrganizerDashboard() {
  // Master simulation: This instance drives the reality for all fans
  const { state: simulationState, setState: setSimulationState } = useStadiumSimulation(800, true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Sync to Firebase every 2 seconds for performance
  useEffect(() => {
    const interval = setInterval(() => {
      syncStadiumState(simulationState);
    }, 2000);
    return () => clearInterval(interval);
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
      // Find 2 staff members from other areas and move them
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

  return (
    <main className="flex flex-col h-screen bg-[#050505] text-foreground p-6 gap-6 overflow-hidden">
      {/* Organizer Header */}
      <header className="flex items-center justify-between glass p-4 rounded-2xl border-primary/20 bg-primary/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary neon-glow">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Command Center</h1>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-primary">Organizer Authority Level 5</p>
          </div>
        </div>

        <div className="flex gap-6">
           <OrgStat label="Live Fans" value={simulationState.agents.filter(a => !a.isStaff).length.toString()} />
           <OrgStat label="Staff Active" value={simulationState.agents.filter(a => a.isStaff).length.toString()} color="text-secondary" />
           <OrgStat label="System Load" value="Optimal" color="text-green-500" />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left: Global Map Control */}
        <section className="col-span-12 lg:col-span-8 relative">
           <StadiumMap 
             agents={simulationState.agents} 
             zones={simulationState.zones} 
             predictiveMode={true} // Organizers always see predictions
           />
           
           {/* Zone Quick Actions Overlay */}
           <div className="absolute bottom-6 left-6 right-6 flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {simulationState.zones.filter(z => z.type === 'gate').map(gate => (
                <button 
                  key={gate.id}
                  onClick={() => toggleGate(gate.id)}
                  className={`glass-card min-w-[140px] p-3 flex flex-col items-center gap-2 border-2 transition-all 
                    ${simulationState.activeEvents[`${gate.id}-closed`] ? 'border-destructive bg-destructive/10' : 'border-white/5 hover:border-primary/40'}
                  `}
                >
                  {simulationState.activeEvents[`${gate.id}-closed`] ? <Lock size={16} /> : <Unlock size={16} />}
                  <span className="text-[10px] font-bold uppercase">{gate.name}</span>
                  <span className="text-[9px] opacity-40 uppercase">{simulationState.activeEvents[`${gate.id}-closed`] ? 'CLOSED' : 'OPEN'}</span>
                </button>
              ))}
           </div>
        </section>

        {/* Right: Tactics & AI Recommendations */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto no-scrollbar">
          
          {/* Staff Deployment Control */}
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-secondary" />
              <h3 className="font-black uppercase tracking-widest text-sm">Staff Deployment Hub</h3>
            </div>
            
            <div className="space-y-2">
              {simulationState.zones.slice(0, 6).map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-40">{zone.name}</p>
                    <p className="text-xs font-black">{zone.staffCount} Officers</p>
                  </div>
                  <button 
                    onClick={() => reassignStaff(zone.id)}
                    className="btn-gold !py-1 !px-3 !text-[9px] neon-glow shadow-secondary/20"
                  >
                    DEPLOY +2
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tactical Recommendations */}
          <div className="glass-card border-primary/30 bg-primary/5">
             <div className="flex items-center gap-2 mb-4">
               <Zap size={18} className="text-primary" />
               <h3 className="font-black uppercase tracking-widest text-sm">AI Tactical Engine</h3>
             </div>
             
             <div className="space-y-4">
                <TacticalAlert 
                  title="Predicted Bottleneck: Gate B" 
                  desc="Halftime rush starting in 4 mins. Current staffing (2) insufficient for 150+ incoming fans."
                  action="Deploy 4 extra staff from Gate D."
                />
                <TacticalAlert 
                  title="Efficiency Opportunity" 
                  desc="Gate A is under-utilized. Suggested dynamic discount at Neon Bites to pull crowd North."
                  action="Broadcast Discount"
                  color="primary"
                />
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

function TacticalAlert({ title, desc, action, color = "secondary" }: { title: string, desc: string, action: string, color?: "primary" | "secondary" }) {
  return (
    <div className={`p-4 rounded-2xl border ${color === 'primary' ? 'border-primary/20 bg-primary/5' : 'border-secondary/20 bg-secondary/5'}`}>
       <div className="flex items-start gap-3 mb-2">
         <AlertCircle size={16} className={color === 'primary' ? 'text-primary' : 'text-secondary'} />
         <h4 className="text-xs font-black uppercase leading-tight">{title}</h4>
       </div>
       <p className="text-[10px] opacity-60 mb-3">{desc}</p>
       <button className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all`}>
          Execute: {action}
       </button>
    </div>
  );
}
