'use client';

import React, { useMemo } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { DeckProps } from '@deck.gl/core';
import { DeckGL } from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Agent, Zone } from '@/lib/simulator';

interface StadiumMapProps {
  agents: Agent[];
  zones: Zone[];
  predictiveMode: boolean;
}

const STADIUM_CENTER = { lat: 51.5383, lng: -0.0166 }; // London Olympic Stadium coords

export default function StadiumMap({ agents, zones, predictiveMode }: StadiumMapProps) {
  // Convert simulation coords (0-1000) to relative lat/lng for visualization
  // In a real app, these would be precise stadium coordinates
  const points = useMemo(() => {
    return agents.map(agent => [
      STADIUM_CENTER.lng + (agent.x - 500) * 0.00001,
      STADIUM_CENTER.lat + (agent.y - 500) * 0.00001
    ]);
  }, [agents]);

  // Layer for the heatmap
  const layers = [
    new HeatmapLayer({
      id: 'heatmap-layer',
      data: points,
      getPosition: d => d,
      getWeight: 1,
      radiusPixels: 40,
      intensity: 1,
      threshold: 0.1,
      colorRange: predictiveMode ? [
        [255, 215, 0, 50], // Gold (Predicted)
        [255, 215, 0, 150],
        [255, 215, 0, 255]
      ] : [
        [0, 240, 255, 50], // Cyan (Live)
        [0, 240, 255, 150],
        [0, 240, 255, 255]
      ]
    })
  ];

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden glass border-primary/20 shadow-2xl">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          defaultCenter={STADIUM_CENTER}
          defaultZoom={17}
          mapId="bf51a910020fa566" // Premium vector map ID (if available)
          disableDefaultUI={true}
          styles={DARK_MAP_STYLE}
        >
          <DeckGLOverlay layers={layers} />
          
          {/* Static Zone Markers */}
          {zones.map(zone => (
            <ZoneMarker key={zone.id} zone={zone} />
          ))}
        </Map>
      </APIProvider>
      
      {/* Legend */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="glass-card py-2 px-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${predictiveMode ? 'bg-secondary' : 'bg-primary'} pulsing-marker`} />
          <span className="text-xs font-bold tracking-widest uppercase">
            {predictiveMode ? 'Predictive Mode (T+5m)' : 'Live Crowd Status'}
          </span>
        </div>
      </div>
    </div>
  );
}

function DeckGLOverlay({ layers }: { layers: any[] }) {
  const map = useMap();
  if (!map) return null;

  return (
    <DeckGL
      style={{ pointerEvents: 'none' }}
      viewState={{
        longitude: STADIUM_CENTER.lng,
        latitude: STADIUM_CENTER.lat,
        zoom: 17,
        pitch: 0,
        bearing: 0
      }}
      layers={layers}
    />
  );
}

function ZoneMarker({ zone }: { zone: Zone }) {
  const isCongested = zone.currentCount > (zone.capacity * 0.8);
  
  return (
    <div 
      className={`absolute flex flex-col items-center justify-center p-2 rounded-xl glass border-2 transition-all duration-500
        ${isCongested ? 'border-destructive neon-glow shadow-destructive/20' : 'border-primary/40'}
      `}
      style={{
        left: `calc(50% + ${(zone.x - 500) * 0.1}%)`, // Rough mapping
        top: `calc(50% + ${(zone.y - 500) * 0.1}%)`,
      }}
    >
      <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60 text-white">
        {zone.name}
      </span>
      <span className={`text-sm font-black ${isCongested ? 'text-destructive' : 'text-primary'}`}>
        {zone.currentCount}
      </span>
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
