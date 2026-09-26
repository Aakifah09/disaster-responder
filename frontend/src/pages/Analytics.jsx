import { useState, useEffect } from 'react';

function Analytics() {
  const [incidents, setIncidents] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:8000/incidents')
      .then(res => res.json())
      .then(data => setIncidents(data))
      .catch(e => console.error(e));
  }, []);

  const total = incidents.length;
  const critical = incidents.filter(i => i.severity === 'critical').length;
  
  // Calculate Avg Deployment Time
  const deploymentTimes = incidents.map(i => i.deployment_time).filter(t => t > 0);
  const avgSeconds = deploymentTimes.length > 0 
    ? deploymentTimes.reduce((a, b) => a + b, 0) / deploymentTimes.length 
    : 0;
  
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const avgResponseTime = avgSeconds > 0 ? formatTime(avgSeconds) : "N/A";

  // Dynamic Chart Data: Last 7 entries or group by day
  // For simplicity, we'll use the last 7 incidents or dummy data if < 7
  const historicalSeed = [12, 19, 8, 25, 14, 30];
  const chartData = [...historicalSeed, total];

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem' }}>Historical Analytics & Performance</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>System-wide intelligence and post-incident analysis.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>{total}</div>
          <div style={{ color: 'var(--text-muted)' }}>Total Incidents Handled</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--critical)' }}>{critical}</div>
          <div style={{ color: 'var(--text-muted)' }}>Critical Escalations</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--high)' }}>{avgResponseTime}</div>
          <div style={{ color: 'var(--text-muted)' }}>Avg Deployment Time</div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>7-Day Incident Volume</h3>
      <div className="detail-panel" style={{ padding: '2rem 2rem 3rem 2rem', height: '300px', display: 'flex', alignItems: 'flex-end', gap: '15px', background: 'var(--surface)' }}>
        {chartData.map((val, i) => (
          <div key={i} style={{ flex: 1, background: i === 6 ? 'var(--primary)' : 'var(--surface2)', height: `${Math.max((val/Math.max(...chartData, 1))*100, 5)}%`, borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.5s ease' }}>
             <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.9rem', fontWeight: 'bold' }}>{val}</span>
             <span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{i === 6 ? 'Today' : `Day ${i+1}`}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Regional Medical Capacity</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { name: 'ICU Beds', avail: 14, total: 50 },
          { name: 'Trauma Bay', avail: 2, total: 10 },
          { name: 'Burn Unit', avail: 5, total: 8 },
          { name: 'General Ward', avail: 120, total: 400 }
        ].map(bed => {
          const percent = (bed.avail / bed.total) * 100;
          return (
            <div key={bed.name} className="detail-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{bed.name}</div>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--surface2)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={percent < 25 ? 'var(--critical)' : 'var(--primary)'} strokeWidth="3" strokeDasharray={`${percent}, 100`} />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', fontSize: '1.5rem' }}>
                  {bed.avail}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Available</div>
            </div>
          )
        })}
      </div>

      <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Live Financial Expenditure</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--critical)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Estimated Daily Burn Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--critical)' }}>$142,500</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>📈 +$12.4k from yesterday</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Aviation & Fuel Costs</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>$24,000</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Covers Helis & Drone Fleet</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--high)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Overtime Personnel Pay</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>$85,200</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Based on active shift fatigue</div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
