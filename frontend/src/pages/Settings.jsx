import React, { useState } from 'react';

function Settings() {
  const [notifs, setNotifs] = useState(true);
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [gps, setGps] = useState(true);
  const [sound, setSound] = useState(true);

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem' }}>System Configuration</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Manage your dispatcher preferences and automated routing rules.</p>
      
      <div className="detail-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Dispatcher Profile</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
            D4
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Dispatcher #402</div>
            <div style={{ color: 'var(--text-muted)' }}>Status: On Duty • Shift ends in 4h</div>
          </div>
        </div>

        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Preferences & Automation</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>🔊 Enable Radio & Alert Sounds</span>
            <input type="checkbox" checked={sound} onChange={() => setSound(!sound)} style={{ transform: 'scale(1.5)' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>🔔 Desktop Push Notifications</span>
            <input type="checkbox" checked={notifs} onChange={() => setNotifs(!notifs)} style={{ transform: 'scale(1.5)' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>🤖 Auto-Deploy Idle Units to Criticals</span>
            <input type="checkbox" checked={autoDeploy} onChange={() => setAutoDeploy(!autoDeploy)} style={{ transform: 'scale(1.5)' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>📍 High-Precision GPS Tracking</span>
            <input type="checkbox" checked={gps} onChange={() => setGps(!gps)} style={{ transform: 'scale(1.5)' }} />
          </label>
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'right' }}>
          <button className="btn" onClick={() => alert('Settings Saved!')}>Save Configuration</button>
        </div>
      </div>
    </div>
  );
}
export default Settings;
