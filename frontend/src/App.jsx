import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ReportForm from './pages/ReportForm';
import IncidentDashboard from './pages/IncidentDashboard';
import DispatchView from './pages/DispatchView';
import Map from './pages/Map';
import Responders from './pages/Responders';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function Header() {
  const location = useLocation();
  const [lightMode, setLightMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sirenActive, setSirenActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); }
  }, []);

  useEffect(() => {
    if (lightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [lightMode]);
  
  return (
    <>
      {!isOnline && <div style={{ background: 'var(--critical)', color: 'white', padding: '0.4rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>⚠️ OFFLINE MODE: Network Connection Lost - Operating Locally</div>}
      {sirenActive && <div style={{ background: 'red', color: 'white', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '3px', animation: 'pulse 0.5s infinite' }}>🚨 CITY-WIDE EMERGENCY SIREN ACTIVATED 🚨</div>}
      <header className="header hide-print">
        <div className="brand-container">
        <h1 className="brand-name">DisasterResponder</h1>
        <p className="brand-subtitle">Emergency Coordination System</p>
      </div>
      <nav className="nav-links" style={{ alignItems: 'center' }}>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Report</Link>
        <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
        <Link to="/map" className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}>Map</Link>
        <Link to="/responders" className={`nav-link ${location.pathname === '/responders' ? 'active' : ''}`}>Teams</Link>
        <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>Analytics</Link>
        <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>⚙️ Settings</Link>
        <button onClick={() => setSirenActive(!sirenActive)} style={{ marginLeft: '1rem', background: sirenActive ? 'white' : 'var(--critical)', color: sirenActive ? 'var(--critical)' : 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', animation: sirenActive ? 'pulse 0.5s infinite' : 'none' }}>
          {sirenActive ? 'STOP SIREN' : '🚨 SIREN'}
        </button>
        <button className="btn-outline" onClick={() => setIsLocked(true)} style={{ padding: '0.2rem 0.5rem', marginLeft: '0.5rem', borderColor: 'var(--high)', color: 'var(--high)' }}>
          🔒 Lock
        </button>
        <button className="btn-outline" onClick={() => setLightMode(!lightMode)} style={{ padding: '0.2rem 0.5rem', marginLeft: '0.5rem' }}>
          {lightMode ? '🌙 Dark' : '☀️ Light'}
        </button>
      </nav>
    </header>
    {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}
    </>
  );
}

function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    if (pin === '1234') {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="hide-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.98)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(15px)' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
      <h2 style={{ color: 'white', marginBottom: '0.5rem', letterSpacing: '2px' }}>TERMINAL LOCKED</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Enter Security PIN to resume session (Hint: 1234)</p>
      
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: pin.length > i ? 'var(--primary)' : 'transparent', border: '2px solid var(--primary)' }}></div>
        ))}
      </div>
      
      <div style={{ height: '30px', color: 'var(--critical)', marginBottom: '1rem', fontWeight: 'bold', animation: error ? 'pulse 0.5s infinite' : 'none' }}>
        {error && 'SECURITY ALERT: INVALID PIN'}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => setPin(prev => (prev.length < 4 ? prev + n : prev))} style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'var(--surface)', color: 'white', border: '1px solid var(--border)', fontSize: '1.5rem', cursor: 'pointer' }}>{n}</button>
        ))}
        <button onClick={() => setPin('')} style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'transparent', color: 'var(--text-muted)', border: 'none', fontSize: '1rem', cursor: 'pointer' }}>CLEAR</button>
        <button onClick={() => setPin(prev => (prev.length < 4 ? prev + '0' : prev))} style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'var(--surface)', color: 'white', border: '1px solid var(--border)', fontSize: '1.5rem', cursor: 'pointer' }}>0</button>
        <button onClick={handleUnlock} style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>GO</button>
      </div>
    </div>
  );
}

function EmergencyTicker() {
  return (
    <div className="hide-print" style={{ background: 'var(--high)', color: 'white', padding: '0.3rem', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', fontSize: '0.85rem', fontWeight: 'bold' }}>
      <div style={{ display: 'inline-block', paddingRight: '2rem', animation: 'ticker 20s linear infinite' }}>
        ⚠️ SEVERE WEATHER WARNING: Flash flooding expected in Riverside ⚠️ AMBER ALERT: License plate XYZ-1234 ⚠️ CITY ADVISORY: Power grid instability detected in Sector 4 ⚠️
      </div>
    </div>
  );
}


function App() {
  return (
    <Router>
      <Header />
      <EmergencyTicker />
      <div className="container">
        <Routes>
          <Route path="/" element={<ReportForm />} />
          <Route path="/dashboard" element={<IncidentDashboard />} />
          <Route path="/dispatch/:id" element={<DispatchView />} />
          <Route path="/map" element={<Map />} />
          <Route path="/responders" element={<Responders />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
