import { useState, useEffect } from 'react';

function Responders() {
  const [incidents, setIncidents] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:8000/incidents')
      .then(res => res.json())
      .then(data => setIncidents(data))
      .catch(e => console.error(e));
  }, []);

  const demands = {};
  incidents.filter(i => i.status !== 'resolved').forEach(inc => {
    try {
      const parsed = inc.resources_needed ? JSON.parse(inc.resources_needed) : [];
      const resList = Array.isArray(parsed) ? parsed : [];
      resList.forEach(r => {
        const resName = typeof r === 'object' ? JSON.stringify(r) : String(r);
        demands[resName] = (demands[resName] || 0) + 1;
      });
    } catch(e) {}
  });

  const baseTeams = [
    { name: "Engine 42", type: "Fire", status: "Idle", location: "Station 3", shift: "Ends in 4h", fatigue: 30 },
    { name: "Engine 11", type: "Fire", status: "Idle", location: "Station 1", shift: "Ends in 4h", fatigue: 10 },
    { name: "Medic 12", type: "Medical", status: "Idle", location: "Hospital", shift: "Ends in 4h", fatigue: 85 },
    { name: "Medic 9", type: "Medical", status: "Idle", location: "Station 2", shift: "Ends in 4h", fatigue: 25 },
    { name: "Rescue Squad A", type: "USAR", status: "Idle", location: "Downtown", shift: "Ends in 4h", fatigue: 60 },
    { name: "Hazmat 1", type: "Specialized", status: "Idle", location: "Station 1", shift: "Ends in 4h", fatigue: 5 },
    { name: "Police Cruiser 1", type: "Police", status: "Idle", location: "Precinct 4", shift: "Ends in 4h", fatigue: 45 },
    { name: "Police Cruiser 2", type: "Police", status: "Idle", location: "Precinct 1", shift: "Ends in 4h", fatigue: 15 },
  ];

  const teams = [...baseTeams];
  Object.entries(demands).forEach(([reqType, count]) => {
    let deployed = 0;
    teams.forEach(t => {
      if (t.status === 'Idle' && reqType.toLowerCase().includes(t.type.toLowerCase()) && deployed < count) {
        t.status = 'Deployed';
        deployed++;
      }
    });
  });

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem' }}>Responder Directory & Fleet Capacity</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Live tracking of fleet deployment, personnel shifts, and fatigue levels.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {['Fire', 'Medical', 'Police', 'USAR'].map(type => {
          const typeTeams = teams.filter(t => t.type === type);
          const active = typeTeams.filter(t => t.status === 'Deployed').length;
          const total = typeTeams.length;
          const percent = total > 0 ? (active/total)*100 : 0;
          return (
            <div key={type} className="stat-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{type} Units</strong>
                <span style={{ color: percent === 100 ? 'var(--critical)' : 'var(--text-muted)' }}>{active}/{total} Deployed</span>
              </div>
              <div className="chart-bar-container">
                <div className="chart-bar-fill" style={{ width: `${percent}%`, background: percent === 100 ? 'var(--critical)' : 'var(--high)' }}></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="incident-list">
        {teams.map(t => (
          <div key={t.name} className="incident-row">
            <div className={`dot dot-${t.status === 'Idle' ? 'low' : 'critical'}`}></div>
            <div className="row-main">
              <div className="row-title" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {t.name} <span className="tag">{t.type}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🕒 {t.shift}</span>
              </div>
              <div className="row-subtitle">Location: {t.location}</div>
              
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Fatigue Level: 
                <div style={{ flex: 1, maxWidth: '100px', height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${t.fatigue}%`, height: '100%', background: t.fatigue > 75 ? 'var(--critical)' : t.fatigue > 40 ? 'var(--high)' : '#4ade80' }}></div>
                </div>
              </div>
            </div>
            <div className="status-badge" style={{ color: t.status === 'Deployed' ? 'var(--critical)' : 'var(--text-muted)' }}>{t.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Responders;
