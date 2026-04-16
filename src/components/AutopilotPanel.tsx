'use client';

import React, { useState, useEffect } from 'react';
import { Bot, MapPin, Clock, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { SimulationState } from '@/lib/simulator';
import { motion, AnimatePresence } from 'framer-motion';
import { joinQueue, QueueTicket } from '@/lib/queue';
import { Coffee } from 'lucide-react';

interface Decision {
  id: number;
  action: 'MOVE' | 'WAIT' | 'PATH';
  from: string;
  to: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

interface AutopilotPanelProps {
  simulationState: SimulationState;
  isAutopilotActive: boolean;
  onToggleAutopilot: () => void;
}

export default function AutopilotPanel({ simulationState, isAutopilotActive, onToggleAutopilot }: AutopilotPanelProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const [activeTicket, setActiveTicket] = useState<QueueTicket | null>(null);

  const handleJoinQueue = (zoneId: string) => {
    const ticket = joinQueue(zoneId);
    setActiveTicket(ticket);
  };

  const fetchDecisions = async () => {
    if (!isAutopilotActive) return;
    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadiumState: simulationState })
      });
      const data = await res.json();
      if (data.decisions) setDecisions(data.decisions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAutopilotActive) {
      fetchDecisions();
      const interval = setInterval(fetchDecisions, 10000); // Pulse every 10s
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutopilotActive]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Autopilot Activation */}
      <div className={`glass-card relative overflow-hidden transition-all duration-500 ${isAutopilotActive ? 'border-primary/50' : 'border-white/5'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isAutopilotActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm">FlowMind Autopilot</h3>
              <p className="text-[10px] opacity-60 uppercase">{isAutopilotActive ? 'Analyzing Current & Predicted Flows' : 'Manual Navigation Active'}</p>
            </div>
          </div>
          <button 
            onClick={onToggleAutopilot}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isAutopilotActive ? 'bg-primary' : 'bg-white/20'}`}
          >
            <motion.div 
              animate={{ x: isAutopilotActive ? 24 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-lg"
            />
          </button>
        </div>
        
        {isAutopilotActive && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-4 border-t border-white/10"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-primary animate-pulse">
              <Zap size={14} />
              <span>LIVE AI GUIDANCE ENABLED</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Decision Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {!isAutopilotActive ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40"
            >
              <MapPin size={48} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Enable Autopilot for Predictive Decisions</p>
            </motion.div>
          ) : (
            decisions.map((decision, idx) => (
              <motion.div
                key={decision.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-card bg-white/5 border-l-4 p-4 ${
                  decision.urgency === 'high' ? 'border-l-destructive shadow-destructive/5' : 
                  decision.urgency === 'medium' ? 'border-l-secondary shadow-secondary/5' : 'border-l-primary shadow-primary/5'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                         decision.action === 'MOVE' ? 'bg-primary/20 text-primary' : 
                         decision.action === 'WAIT' ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-white'
                       }`}>
                          {decision.action}
                       </span>
                       <span className="text-[10px] opacity-40 font-bold uppercase tracking-tighter">
                         From {decision.from}
                       </span>
                    </div>
                    <h4 className="text-sm font-black uppercase text-white/90">To {decision.to}</h4>
                  </div>
                  {decision.urgency === 'high' && <AlertTriangle size={16} className="text-destructive animate-bounce" />}
                </div>
                
                <p className="text-xs leading-relaxed opacity-60 font-medium mb-3">
                  {decision.reason}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-40 uppercase">
                    <Clock size={12} />
                    <span>Predicted Impact: 5m</span>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/40 pb-0.5 hover:text-white hover:border-white transition-all">
                    ACCEPT PATH
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Queue System */}
      <div className="glass-card border-white/5 bg-gradient-to-br from-white/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-secondary" />
            <h3 className="font-black uppercase tracking-widest text-sm">Virtual Vault</h3>
          </div>
          {activeTicket && (
            <span className="text-[10px] font-black text-secondary animate-pulse">SLOT ACTIVE</span>
          )}
        </div>

        <div className="space-y-3">
          {activeTicket ? (
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
              <span className="block text-[10px] opacity-60 uppercase font-bold mb-1">Your {activeTicket.zoneId} Reservation</span>
              <span className="text-2xl font-black text-secondary">{activeTicket.slotStartTime}</span>
              <p className="text-[9px] mt-2 opacity-40 uppercase">Show code at entry</p>
            </div>
          ) : (
            simulationState.zones.filter(z => z.type === 'stall').map(zone => (
              <div key={zone.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <Coffee size={14} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase">{zone.name}</span>
                </div>
                <button 
                  onClick={() => handleJoinQueue(zone.id)}
                  className="px-3 py-1 rounded bg-primary/20 text-primary text-[9px] font-black uppercase hover:bg-primary hover:text-black transition-all"
                >
                  Join Queue
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
