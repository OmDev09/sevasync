'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Need } from '../../../lib/supabase/database.types';

const TYPE_COLORS: Record<string, string> = {
  Medical: '#ef4444', Food: '#f97316', Shelter: '#6366f1',
  Water: '#06b6d4', Education: '#10b981',
};

// Coordinate lookup for known Mumbai/India locations
const LOCATION_COORDS: Record<string, [number, number]> = {
  'dharavi sector 4': [19.0427, 72.8503],
  'dharavi': [19.041, 72.849],
  'kurla west': [19.0726, 72.8793],
  'kurla': [19.0726, 72.8793],
  'bandra east': [19.0596, 72.8649],
  'bandra': [19.054, 72.8496],
  'andheri west': [19.1196, 72.8474],
  'andheri': [19.1136, 72.8697],
  'govandi': [19.0607, 72.9212],
  'worli': [18.9987, 72.8169],
  'dadar': [19.0178, 72.8478],
  'chembur': [19.0625, 72.9012],
  'mulund': [19.1726, 72.9615],
  'thane': [19.2183, 72.9781],
  'borivali': [19.2315, 72.8575],
  'malad': [19.1863, 72.8488],
  'kandivali': [19.2048, 72.8442],
  'santacruz': [19.0821, 72.8428],
  'vile parle': [19.0988, 72.8497],
  'matunga': [19.027, 72.8607],
  'sion': [19.0392, 72.8619],
  'ghatkopar': [19.0868, 72.9087],
  'vikhroli': [19.1038, 72.9257],
  'bhandup': [19.1397, 72.9419],
};

function getCoords(location: string): [number, number] | null {
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

function getRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(diffMs / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function AdminMapPage() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selected, setSelected] = useState<Need | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const fetchNeeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/needs');
      const data = await res.json();
      setNeeds(data.needs || []);
    } catch {
      console.error('Failed to load needs for map');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNeeds(); }, [fetchNeeds]);

  // Build Leaflet map once the container is ready
  useEffect(() => {
    if (!mapRef.current) return;

    let map: ReturnType<typeof import('leaflet')['map']> | null = null;

    const initMap = async () => {
      // Dynamic import to avoid SSR
      const L = (await import('leaflet')).default;

      // Fix Leaflet's default icon path problem in Next.js
      // @ts-expect-error
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      map = L.map(mapRef.current!, {
        center: [19.076, 72.877],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark themed map tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // run once

  // Update markers whenever needs or filters change
  useEffect(() => {
    const updateMarkers = async () => {
      if (!leafletMapRef.current) return;
      const L = (await import('leaflet')).default;

      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const filtered = needs.filter(n => {
        if (filterType !== 'all' && n.type.toLowerCase() !== filterType) return false;
        if (filterSeverity !== 'all' && n.severity !== filterSeverity) return false;
        return true;
      });

      for (const need of filtered) {
        const coords = getCoords(need.location);
        if (!coords) continue;

        const color = TYPE_COLORS[need.type] || '#6366f1';
        const radius = need.severity === 'critical' ? 18 : need.severity === 'high' ? 14 : need.severity === 'medium' ? 10 : 8;

        // Create circle marker
        const circle = L.circleMarker(coords, {
          radius,
          fillColor: color,
          color: 'rgba(255,255,255,0.4)',
          weight: 2,
          opacity: 1,
          fillOpacity: need.severity === 'critical' ? 0.9 : 0.75,
        });

        // Popup content
        const popupHtml = `
          <div style="font-family:system-ui,sans-serif;min-width:200px;padding:4px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${need.title}</div>
            <div style="font-size:12px;color:#94a3b8;margin-bottom:8px">📍 ${need.location}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
              <span style="background:${color}20;color:${color};border:1px solid ${color}40;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">${need.type}</span>
              <span style="background:rgba(239,68,68,0.15);color:#ef4444;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600;text-transform:uppercase">${need.severity}</span>
            </div>
            <div style="font-size:12px;color:#cbd5e1">👥 ${need.people_affected} people · 🧠 Score: ${need.ai_score}</div>
            ${need.description ? `<div style="font-size:12px;color:#94a3b8;margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px">${need.description.slice(0, 100)}${need.description.length > 100 ? '...' : ''}</div>` : ''}
          </div>
        `;

        circle.bindPopup(popupHtml, {
          maxWidth: 280,
          className: 'sevasync-popup',
        });

        circle.on('click', () => setSelected(need));
        circle.addTo(leafletMapRef.current);
        markersRef.current.push(circle);

        // Pulsing ring for critical
        if (need.severity === 'critical') {
          const pulse = L.circleMarker(coords, {
            radius: radius + 8,
            fillColor: 'transparent',
            color: color,
            weight: 2,
            opacity: 0.4,
            fillOpacity: 0,
            className: 'leaflet-pulse-ring',
          });
          pulse.addTo(leafletMapRef.current);
          markersRef.current.push(pulse);
        }
      }
    };

    updateMarkers();
  }, [needs, filterType, filterSeverity]);

  // Group needs by location for the summary cards
  const locationSummary = needs.reduce((acc: Record<string, { needs: Need[]; topScore: number }>, n) => {
    const locKey = n.location;
    if (!acc[locKey]) acc[locKey] = { needs: [], topScore: 0 };
    acc[locKey].needs.push(n);
    acc[locKey].topScore = Math.max(acc[locKey].topScore, n.ai_score);
    return acc;
  }, {});

  const locationList = Object.entries(locationSummary)
    .sort((a, b) => b[1].topScore - a[1].topScore)
    .slice(0, 9);

  const activeNeeds = needs.filter(n => {
    if (filterType !== 'all' && n.type.toLowerCase() !== filterType) return false;
    if (filterSeverity !== 'all' && n.severity !== filterSeverity) return false;
    return true;
  });

  const mappedCount = activeNeeds.filter(n => getCoords(n.location) !== null).length;
  const unmappedCount = activeNeeds.filter(n => getCoords(n.location) === null).length;

  return (
    <div className="animate-fade-in">
      {/* Leaflet CSS */}
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .sevasync-popup .leaflet-popup-content-wrapper {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .sevasync-popup .leaflet-popup-tip {
          background: #1e293b;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.6) !important;
          color: #666 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: #888 !important; }
        @keyframes leafletPulse {
          0%   { transform: scale(1); opacity: 0.5; }
          50%  { transform: scale(1.4); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        .leaflet-pulse-ring { animation: leafletPulse 2s ease-in-out infinite; }
      `}</style>

      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">🗺️ Regional Needs Map</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${mappedCount} needs mapped · ${unmappedCount} need location review`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select className="form-select" style={{ maxWidth: 180 }} id="map-filter-type" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Need Types</option>
              <option value="medical">🔴 Medical</option>
              <option value="food">🟠 Food</option>
              <option value="shelter">🔵 Shelter</option>
              <option value="water">🩵 Water</option>
              <option value="education">🟢 Education</option>
            </select>
            <select className="form-select" style={{ maxWidth: 160 }} id="map-filter-severity" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">All Severities</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <button className="btn btn-secondary btn-sm" id="map-refresh-btn" onClick={fetchNeeds}>🔄 Refresh</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 16 }}>
        <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Map Legend:</span>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{type}</span>
            </div>
          ))}
          <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size = severity  ·  Click pin for details</span>
          </div>
        </div>
      </div>

      {/* The actual Leaflet Map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗺️</div>
              <div>Loading map data...</div>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height: 500, width: '100%' }} id="map-container" />
        {!loading && activeNeeds.length === 0 && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: '#94a3b8', fontSize: '0.875rem', padding: '8px 20px', borderRadius: 'var(--radius-full)', zIndex: 500 }}>
            No needs match current filters
          </div>
        )}
        {!loading && unmappedCount > 0 && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: '#94a3b8', fontSize: '0.75rem', padding: '6px 12px', borderRadius: 'var(--radius-sm)', zIndex: 500 }}>
            ⚠️ {unmappedCount} need(s) have unrecognized locations
          </div>
        )}
      </div>

      {/* Selected need panel */}
      {selected && (
        <div className="card animate-fade-in" style={{ marginBottom: 24, padding: '16px 20px', borderLeft: `4px solid ${TYPE_COLORS[selected.type] || 'var(--brand-primary)'}` }}>
          <div className="flex items-start justify-between">
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <span className={`badge badge-${selected.severity}`}>{selected.severity}</span>
                <span className="badge" style={{ background: `${TYPE_COLORS[selected.type] || '#6366f1'}18`, color: TYPE_COLORS[selected.type] || '#6366f1', border: `1px solid ${TYPE_COLORS[selected.type] || '#6366f1'}30` }}>{selected.type}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: selected.ai_score >= 80 ? 'var(--critical)' : 'var(--text-secondary)' }}>🧠 {selected.ai_score}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{selected.title}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>📍 {selected.location} · 👥 {selected.people_affected} people · {getRelativeTime(selected.created_at)}</div>
              {selected.description && <div style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{selected.description}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Location breakdown cards — real data */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="h3">Hotspot Summary by Location</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{locationList.length} locations with active needs</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: '14px 16px', opacity: 0.4 }}>
                <div style={{ height: 16, width: '50%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : locationList.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📍</div>
            <p className="text-secondary">No needs data yet. Add needs to see the map populate.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 stagger">
            {locationList.map(([loc, summary]) => {
              const topNeed = summary.needs.sort((a, b) => b.ai_score - a.ai_score)[0];
              const level = summary.topScore >= 80 ? 'critical' : summary.topScore >= 60 ? 'high' : summary.topScore >= 40 ? 'medium' : 'low';
              const severityColor = level === 'critical' ? 'var(--critical)' : level === 'high' ? 'var(--high)' : level === 'medium' ? 'var(--medium)' : 'var(--low)';
              const hasMappedCoords = getCoords(loc) !== null;

              return (
                <div key={loc} className="card animate-fade-in" style={{ padding: '14px 16px', cursor: 'pointer', opacity: hasMappedCoords ? 1 : 0.7 }} id={`map-loc-${loc.toLowerCase().replace(/\s+/g, '-')}-card`}
                  onClick={() => { setSelected(topNeed); }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{loc}</span>
                    <span className={`badge badge-${level}`}>{level}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {topNeed.type} · 👥 {summary.needs.reduce((s, n) => s + n.people_affected, 0)} people · {summary.needs.length} need(s)
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${summary.topScore}%`, background: severityColor }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>AI Score: {summary.topScore}/100</span>
                    {!hasMappedCoords && <span style={{ color: 'var(--brand-warm)' }}>⚠️ coords missing</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
