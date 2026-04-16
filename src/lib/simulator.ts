import { useState, useEffect, useCallback } from 'react';

export interface Zone {
  id: string;
  name: string;
  type: 'gate' | 'stall' | 'seat' | 'concourse';
  x: number;
  y: number;
  capacity: number;
  currentCount: number;
}

export interface Agent {
  id: string;
  x: number;
  y: number;
  targetId: string;
  speed: number;
  state: 'arriving' | 'seated' | 'hungry' | 'leaving';
}

export interface SimulationState {
  agents: Agent[];
  zones: Zone[];
  phase: 'pre-game' | 'first-half' | 'halftime' | 'second-half' | 'post-game';
  time: number; // minutes into event
}

const STADIUM_ZONES: Zone[] = [
  { id: 'gate-a', name: 'Gate A (North)', type: 'gate', x: 500, y: 50, capacity: 50, currentCount: 0 },
  { id: 'gate-b', name: 'Gate B (East)', type: 'gate', x: 950, y: 500, capacity: 50, currentCount: 0 },
  { id: 'gate-c', name: 'Gate C (South)', type: 'gate', x: 500, y: 950, capacity: 50, currentCount: 0 },
  { id: 'gate-d', name: 'Gate D (West)', type: 'gate', x: 50, y: 500, capacity: 50, currentCount: 0 },
  { id: 'stall-1', name: 'Neon Bites', type: 'stall', x: 250, y: 250, capacity: 20, currentCount: 0 },
  { id: 'stall-2', name: 'Cyber Coffee', type: 'stall', x: 750, y: 250, capacity: 20, currentCount: 0 },
  { id: 'stall-3', name: 'Volt Drinks', type: 'stall', x: 250, y: 750, capacity: 20, currentCount: 0 },
  { id: 'stall-4', name: 'Sync Snacks', type: 'stall', x: 750, y: 750, capacity: 20, currentCount: 0 },
  { id: 'seats-n', name: 'North Stand', type: 'seat', x: 500, y: 200, capacity: 300, currentCount: 0 },
  { id: 'seats-s', name: 'South Stand', type: 'seat', x: 500, y: 800, capacity: 300, currentCount: 0 },
  { id: 'seats-e', name: 'East Stand', type: 'seat', x: 800, y: 500, capacity: 300, currentCount: 0 },
  { id: 'seats-w', name: 'West Stand', type: 'seat', x: 200, y: 500, capacity: 300, currentCount: 0 },
];

export function useStadiumSimulation(initialAgentCount: number = 500) {
  const [state, setState] = useState<SimulationState>(() => {
    const freshAgents: Agent[] = Array.from({ length: initialAgentCount }).map((_, i) => ({
      id: `agent-${i}`,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      targetId: 'gate-a',
      speed: 1 + Math.random() * 2,
      state: 'arriving',
    }));
    return {
      agents: freshAgents,
      zones: STADIUM_ZONES,
      phase: 'pre-game',
      time: 0,
    };
  });


  const tick = useCallback(() => {
    setState(prev => {
      let newPhase = prev.phase;
      const newTime = prev.time + 0.1; // simulation minutes

      // Phase transitions
      if (newTime > 30 && prev.phase === 'pre-game') newPhase = 'first-half';
      if (newTime > 75 && prev.phase === 'first-half') newPhase = 'halftime';
      if (newTime > 90 && prev.phase === 'halftime') newPhase = 'second-half';
      if (newTime > 135 && prev.phase === 'second-half') newPhase = 'post-game';

      const newAgents = prev.agents.map(agent => {
        const targetZone = prev.zones.find(z => z.id === agent.targetId);
        if (!targetZone) return agent;

        // Directional logic
        const dx = targetZone.x - agent.x;
        const dy = targetZone.y - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // State machine logic
        let nextTarget = agent.targetId;
        let nextState = agent.state;

        if (dist < 10) {
          if (agent.state === 'arriving') {
            nextState = 'seated';
            const seatZones = ['seats-n', 'seats-s', 'seats-e', 'seats-w'];
            nextTarget = seatZones[Math.floor(Math.random() * seatZones.length)];
          } else if (agent.state === 'seated' && newPhase === 'halftime' && Math.random() > 0.95) {
            nextState = 'hungry';
            const stalls = ['stall-1', 'stall-2', 'stall-3', 'stall-4'];
            nextTarget = stalls[Math.floor(Math.random() * stalls.length)];
          } else if (agent.state === 'hungry' && newPhase !== 'halftime' && Math.random() > 0.9) {
            nextState = 'seated';
            const seatZones = ['seats-n', 'seats-s', 'seats-e', 'seats-w'];
            nextTarget = seatZones[Math.floor(Math.random() * seatZones.length)];
          } else if (newPhase === 'post-game') {
            nextState = 'leaving';
            const gates = ['gate-a', 'gate-b', 'gate-c', 'gate-d'];
            nextTarget = gates[Math.floor(Math.random() * gates.length)];
          }
        }

        // Crowding penalty logic
        const zoneDensity = prev.zones.find(z => z.id === agent.targetId)?.currentCount || 0;
        const effectiveSpeed = zoneDensity > 50 ? agent.speed * 0.2 : agent.speed;

        if (dist === 0) return agent;
        
        return {
          ...agent,
          x: agent.x + (dx / dist) * effectiveSpeed,
          y: agent.y + (dy / dist) * effectiveSpeed,
          targetId: nextTarget,
          state: nextState,
        };
      });

      // Update zone counts
      const updatedZones = prev.zones.map(zone => ({
        ...zone,
        currentCount: newAgents.filter(a => {
          const dx = a.x - zone.x;
          const dy = a.y - zone.y;
          return Math.sqrt(dx * dx + dy * dy) < 50;
        }).length
      }));

      return {
        ...prev,
        agents: newAgents,
        zones: updatedZones,
        phase: newPhase,
        time: newTime,
      };
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [tick]);

  return state;
}
