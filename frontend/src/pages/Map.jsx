import React, { useState, useEffect, useRef } from 'react';

function Map() {
  const [incidents, setIncidents] = useState([]);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  useEffect(() => {
    fetch('http://localhost:8000/incidents')
      .then(res => res.json())
      .then(data => setIncidents(data))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    const initMap = () => {
      if (!mapInstance.current && mapRef.current && window.L) {
        mapInstance.current = window.L.map(mapRef.current).setView([20, 0], 2); // Start with global view

        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(mapInstance.current);

        markersLayer.current = window.L.layerGroup().addTo(mapInstance.current);
        return true;
      }
      return false;
    };

    // Try immediately
    if (!initMap()) {
      // If Leaflet isn't ready yet, check every 500ms
      const interval = setInterval(() => {
        if (initMap()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const formatLocation = (value) => {
    if (!value && value !== 0) return '';
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string') return parsed;
      if (Array.isArray(parsed)) return parsed.join(', ');
      if (parsed && typeof parsed === 'object') return Object.values(parsed).join(', ');
    } catch (_e) {
      return String(value);
    }
    return String(value);
  };

  useEffect(() => {
    if (mapInstance.current && markersLayer.current && incidents.length > 0) {
      // Clear old markers
      markersLayer.current.clearLayers();

      const bounds = [];

      incidents.forEach(inc => {
        const lat = inc.lat != null ? Number(inc.lat) : null;
        const lng = inc.lng != null ? Number(inc.lng) : null;
        if (lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
          const color = inc.severity === 'critical' ? '#ff4d4d' : (inc.severity === 'high' ? '#ff9900' : (inc.severity === 'medium' ? '#00ccff' : '#94a3b8'));
          
          // Create custom pulsing icon
          const icon = window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: ${color}; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 15px ${color}, 0 0 5px white; animation: pulse 2s infinite;"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const marker = window.L.marker([lat, lng], { icon })
            .bindPopup(`
              <div style="background: #0f172a; color: white; padding: 5px; border-radius: 4px;">
                <strong style="color: ${color}; text-transform: uppercase; font-size: 0.7rem;">${inc.severity}</strong>
                <div style="font-weight: bold; margin-bottom: 5px;">${inc.disaster_type}</div>
                <div style="font-size: 0.8rem; color: #94a3b8;">${formatLocation(inc.location)}</div>
              </div>
            `);
          
          markersLayer.current.addLayer(marker);
          bounds.push([lat, lng]);
        }
      });

      // Fit map to markers if there are any
      if (bounds.length > 0) {
        mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [incidents]);

  return (
    <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Mission Control: Global Incident Map</h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Real-time tracking of all active emergencies
        </div>
      </div>
      
      <div className="detail-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#070b14', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
        
        {/* CSS for the markers since we're using divIcon */}
        <style>{`
          .leaflet-popup-content-wrapper {
            background: #0f172a !important;
            color: white !important;
            border: 1px solid #1e293b !important;
          }
          .leaflet-popup-tip {
            background: #0f172a !important;
          }
          .leaflet-container {
            font-family: inherit;
          }
        `}</style>
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff4d4d', boxShadow: '0 0 10px #ff4d4d' }}></div> Critical</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff9900', boxShadow: '0 0 10px #ff9900' }}></div> High</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00ccff', boxShadow: '0 0 10px #00ccff' }}></div> Medium</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Displaying {incidents.filter(i => i.lat != null && i.lng != null).length} geotagged incidents
        </div>
      </div>
    </div>
  );
}

export default Map;
