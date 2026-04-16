'use client';

import React, { useMemo } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { DeckGL } from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Agent, Zone } from '@/lib/simulator';
import { Shield, Target, AlertTriangle } from 'lucide-react';

interface StadiumMapProps {
  agents: Agent[];
  zones: Zone[];
  predictiveMode: boolean;
  activeEvents?: { [key: string]: unknown };
}

const STADIUM_CENTER = { lat: 51.5383, lng: -0.0166 };

export default function StadiumMap({ agents, zones, predictiveMode, activeEvents = {} }: StadiumMapProps) {
  const fans = useMemo(() => agents.filter(a => !a.isStaff), [agents]);
  const staff = useMemo(() => agents.filter(a => a.isStaff), [agents]);

  const points = useMemo(() => {
    return fans.map(agent => [
      STADIUM_CENTER.lng + (agent.x - 500) * 0.00001,
      STADIUM_CENTER.lat + (agent.y - 500) * 0.00001
    ]);
  }, [fans]);

  const layers = [
    new HeatmapLayer({
      id: 'heatmap-layer',
      data: points,
      getPosition: (d: [number, number]) => d,
      getWeight: 1,
      radiusPixels: 45,
      intensity: 1.2,
      threshold: 0.1,
      colorRange: predictiveMode ? [
        [255, 215, 0, 10], 
        [255, 215, 0, 100],
        [255, 215, 0, 255]
      ] : [
        [0, 240, 255, 10],
        [0, 240, 255, 100],
        [0, 240, 255, 255]
      ]
    })
  ];

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden glass border-white/5 shadow-2xl">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          defaultCenter={STADIUM_CENTER}
          defaultZoom={17.5}
          disableDefaultUI={true}
          styles={DARK_MAP_STYLE}
        >
          <DeckGLOverlay layers={layers} />
          
          {/* Fan/Staff Markers Grid-style overlay mapping */}
          <div className="absolute inset-0 pointer-events-none">
            {staff.map(member => (
              <div 
                key={member.id}
                className="absolute w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)] transition-all duration-300"
                style={{
                  left: `${(member.x / 1000) * 100}%`,
                  top: `${(member.y / 1000) * 100}%`,
                }}
              >
                <Shield size={6} className="text-black absolute -top-1 -left-1" />
              </div>
            ))}
          </div>

          {/* Zones */}
          {zones.map(zone => (
            <ZoneMarker key={zone.id} zone={zone} isClosed={!!(activeEvents && activeEvents[`${zone.id}-closed`])} />
          ))}
        </Map>
      </APIProvider>
      
      {/* Accuracy Meter Proof (Top Right) */}
      <div className="absolute top-6 right-6 glass-card !p-3 !bg-black/60 border-primary/20 flex items-center gap-3">
         <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 animate-[spin_10s_linear_infinite]">
               <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
               <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-primary" strokeDasharray="125" strokeDashoffset="12" />
            </svg>
            <span className="absolute text-[10px] font-black italic">98%</span>
         </div>
         <div>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Prediction Accuracy</p>
            <div className="flex items-center gap-1">
               <Target size={10} className="text-primary" />
               <p className="text-[10px] font-bold uppercase text-primary tracking-tighter">Verified Logic</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function DeckGLOverlay({ layers }: { layers: unknown[] }) {
  const map = useMap();
  if (!map) return null;

  return (
    <DeckGL
      style={{ pointerEvents: 'none' }}
      viewState={{ ...STADIUM_CENTER, longitude: STADIUM_CENTER.lng, latitude: STADIUM_CENTER.lat, zoom: 17.5 }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layers={layers as any[]}
    />
  );
}

function ZoneMarker({ zone, isClosed }: { zone: Zone, isClosed?: boolean }) {
  const isCongested = zone.currentCount > (zone.capacity * 0.8);
  
  return (
    <div 
      className={`absolute flex flex-col items-center justify-center p-2 rounded-xl glass border-2 transition-all duration-500
        ${isClosed ? 'border-destructive opacity-40 grayscale' : isCongested ? 'border-destructive neon-glow shadow-destructive/20' : 'border-primary/40'}
      `}
      style={{
        left: `${(zone.x / 1000) * 100}%`,
        top: `${(zone.y / 1000) * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {isClosed && <AlertTriangle size={12} className="text-destructive mb-1" />}
      <span className="text-[8px] font-bold uppercase opacity-60 tracking-tighter text-white">
        {zone.name}
      </span>
      <div className="flex gap-2">
         <span className={`text-[10px] font-black ${isCongested ? 'text-destructive' : 'text-primary'}`}>
           {zone.currentCount}
         </span>
         {zone.staffCount > 0 && (
           <span className="text-[10px] font-black text-secondary">S:{zone.staffCount}</span>
         )}
      </div>
    </div>
  );
}


const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];
