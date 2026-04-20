'use client';

import { useEffect, useRef } from 'react';

const REGIONS_DATA = [
  { coords: [19.0760, 72.8777] as [number, number], color: '#ef4444', label: 'Mumbai North', score: 94, admin: 'Priya Sharma', size: 16, level: 'critical', vols: 42, tasks: 18 },
  { coords: [28.7041, 77.1025] as [number, number], color: '#ef4444', label: 'Delhi NCR', score: 88, admin: 'Rohit Joshi', size: 14, level: 'critical', vols: 67, tasks: 31 },
  { coords: [17.3850, 78.4867] as [number, number], color: '#F49C27', label: 'Hyderabad East', score: 72, admin: 'Vikram Nair', size: 12, level: 'high', vols: 31, tasks: 15 },
  { coords: [13.0827, 80.2707] as [number, number], color: '#F49C27', label: 'Chennai South', score: 68, admin: 'Kavya Reddy', size: 12, level: 'high', vols: 28, tasks: 24 },
  { coords: [18.5204, 73.8567] as [number, number], color: '#F49C27', label: 'Pune West', score: 62, admin: 'Sneha Kulkarni', size: 10, level: 'high', vols: 19, tasks: 8 },
  { coords: [12.9716, 77.5946] as [number, number], color: '#129A9C', label: 'Bangalore Central', score: 55, admin: 'Arjun Menon', size: 10, level: 'medium', vols: 35, tasks: 12 },
  { coords: [22.5726, 88.3639] as [number, number], color: '#7EB64F', label: 'Kolkata East', score: 35, admin: 'Rahul Das', size: 8, level: 'low', vols: 14, tasks: 4 },
  { coords: [23.0225, 72.5714] as [number, number], color: '#129A9C', label: 'Ahmedabad', score: 48, admin: 'Amit Patel', size: 10, level: 'medium', vols: 21, tasks: 9 },
];

export default function SAMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let map: ReturnType<typeof import('leaflet')['map']> | null = null;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // @ts-expect-error valid hack
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
        center: [22.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      REGIONS_DATA.forEach(region => {
        const isCritical = region.level === 'critical';
        const sizeMultiplier = isCritical ? 36 : region.level === 'high' ? 28 : region.level === 'medium' ? 22 : 18;

        const iconHtml = `
          <div style="
            width: ${sizeMultiplier}px; 
            height: ${sizeMultiplier}px; 
            background: ${region.color}; 
            border-radius: 50%; 
            border: 2px solid var(--bg-surface);
            --glow-color: ${region.color};
            ${isCritical ? 'animation: glowPulse 1.5s ease-in-out infinite alternate;' : `box-shadow: 0 0 10px ${region.color};`}
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
          </div>
        `;

        const divIcon = L.divIcon({
          html: iconHtml,
          className: 'sevasync-custom-marker',
          iconSize: [sizeMultiplier, sizeMultiplier],
          iconAnchor: [sizeMultiplier/2, sizeMultiplier/2],
          popupAnchor: [0, -sizeMultiplier/2]
        });

        const marker = L.marker(region.coords, { icon: divIcon });

        const popupHtml = `
          <div style="font-family:system-ui,sans-serif;min-width:200px;padding:4px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:var(--text-primary)">${region.label}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">🧑‍💻 Admin: ${region.admin}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
              <span style="background:${region.color}30;color:${region.color};border:1px solid ${region.color}60;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;text-transform:uppercase">${region.level}</span>
            </div>
            <div style="font-size:12px;color:var(--text-primary);font-weight:600">🙋 ${region.vols} volunteers · ✅ ${region.tasks} active tasks</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;border-top:1px solid var(--bg-border);padding-top:6px">🧠 AI Severity Score: ${region.score}</div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          maxWidth: 280,
          className: 'sevasync-popup',
        });

        marker.addTo(map!);
      });

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="animate-fade-in">
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .sevasync-popup .leaflet-popup-content-wrapper {
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-xl);
          backdrop-filter: blur(12px);
        }
        .sevasync-popup .leaflet-popup-tip {
          background: var(--bg-card);
          border: 1px solid var(--bg-border);
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.6) !important;
          color: #888 !important;
          font-size: 10px !important;
        }
      `}</style>
      
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">🗺️ Global Map</h1>
            <p className="page-subtitle">All regions · Need severity heatmap across India</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="form-select" style={{ maxWidth: 180 }} id="samap-filter-type">
              <option value="all">All Need Types</option>
              <option value="medical">🔴 Medical</option>
              <option value="food">🟠 Food</option>
              <option value="shelter">🔵 Shelter</option>
            </select>
            <button className="btn btn-secondary btn-sm" id="samap-export-btn">📥 Export Map</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 20 }}>
        <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Severity:</span>
          {[['🔴', 'Critical (80–100)', '#ef4444'], ['🟠', 'High (60–79)', '#F49C27'], ['🔵', 'Medium (40–59)', '#129A9C'], ['🟢', 'Low (0–39)', '#7EB64F']].map(([, label, color]) => (
            <div key={label as string} className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color as string, boxShadow: `0 0 6px ${color}80` }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Global map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        <div ref={mapRef} style={{ height: 500, width: '100%', zIndex: 1 }} id="sa-global-map-container" />
      </div>

      {/* Region cards */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {REGIONS_DATA.map(r => (
          <div key={r.label} className="card animate-fade-in" style={{ padding: '14px 16px' }} id={`samap-region-${r.label.toLowerCase().replace(/\s+/g, '-')}-card`}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{r.label}</span>
              <span className={`badge badge-${r.level}`}>{r.score}</span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Admin: {r.admin}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>🙋 {r.vols} volunteers · ✅ {r.tasks} tasks</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${r.score}%`, background: r.level === 'critical' ? 'var(--critical)' : r.level === 'high' ? 'var(--high)' : r.level === 'medium' ? 'var(--medium)' : 'var(--low)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
