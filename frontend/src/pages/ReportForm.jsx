import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

const EXAMPLES = {
  "Earthquake": "A massive 7.2 magnitude earthquake just hit downtown Seattle. Multiple buildings have collapsed on 4th Ave. Seeing at least 20-30 people trapped under rubble. Gas lines are ruptured and there are small fires starting. We need heavy rescue equipment and medical teams immediately.",
  "Flood": "The river has breached the levee in the Riverside neighborhood. Water levels are rising rapidly, currently at 4 feet in the streets. About 50 residents are stranded on their roofs. Need boat rescue teams and evacuation transport.",
  "Fire": "Large forest fire advancing rapidly towards the Oakridge subdivision. High winds are pushing the flames. Three houses are already engulfed. Evacuation is underway but traffic is gridlocked. Need aerial water drops and additional fire crews.",
  "Chemical Spill": "A tanker truck overturned on Highway 101 near the industrial park, leaking a greenish-yellow cloud. People in the area are reporting severe eye and throat irritation. About 15 people have collapsed. We need hazmat teams and ambulances with respiratory support.",
  "Building Collapse": "The old parking structure at 5th and Main just pancaked. It was full of cars. Unknown number of people inside, but I can hear screams. Structure looks extremely unstable. Need structural engineers and urban search and rescue."
};

function ReportForm() {
  const [report, setReport] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [casualties, setCasualties] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loading) return;
    
    const timeouts = [];
    
    timeouts.push(setTimeout(() => {
      setProgress(33);
      setStatusMsg("Extracting incident data...");
    }, 500));
    
    timeouts.push(setTimeout(() => {
      setProgress(66);
      setStatusMsg("Running triage assessment...");
    }, 3000));
    
    timeouts.push(setTimeout(() => {
      setProgress(90);
      setStatusMsg("Generating dispatch orders...");
    }, 6000));
    
    return () => timeouts.forEach(clearTimeout);
  }, [loading]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          setLocation(data.display_name || `${position.coords.latitude}, ${position.coords.longitude}`);
        } catch (e) {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        }
      },
      () => {
        alert("Unable to retrieve your location");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!report.trim()) return;
    
    setLoading(true);
    setResult(null);
    setProgress(0);
    
    // Abort controller with 90s hard timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(`${API_URL}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          raw_report: report, 
          manual_location: location || undefined,
          casualties_estimate: casualties ? parseInt(casualties) : undefined,
          lat: coords.lat || undefined,
          lng: coords.lng || undefined
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();

      setProgress(100);
      setTimeout(() => {
        setResult(data);
        setLoading(false);
        setReport('');
        setLocation('');
        setCasualties('');
        setCoords({ lat: null, lng: null });

        if (Notification.permission === 'granted') {
          new Notification(`New ${data.severity.toUpperCase()} Incident`, {
            body: `${data.disaster_type} at ${data.location}`
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }, 500);
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(error);
      if (error.name === 'AbortError') {
        alert("⏱️ Request timed out after 90 seconds.\n\nThe backend may be busy processing. Please check that:\n1. The backend server is running (uvicorn main:app)\n2. Ollama is running (if using AI mode)\n\nThe system will now use rule-based triage which works instantly.");
      } else {
        alert(`❌ Failed to connect to the backend.\n\nError: ${error.message}\n\nMake sure the backend server is running:\n  cd backend\n  uvicorn main:app --reload`);
      }
      setLoading(false);
      setProgress(0);
    }
  };

  let parsedResources = [];
  try {
    const parsed = result?.resources_needed ? JSON.parse(result.resources_needed) : [];
    parsedResources = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    parsedResources = [];
  }

  return (
    <div>
      <div className="textarea-container">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Location (Optional)" 
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={{ 
              flex: 1, background: 'var(--surface)', color: 'white', 
              border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', outline: 'none', fontFamily: 'inherit'
            }}
            disabled={loading}
          />
          <button className="btn-outline" type="button" onClick={handleGetLocation} disabled={loading} style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface2)' }}>
            📍 Use Current Location
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <input 
            type="number" 
            placeholder="Estimated Casualties" 
            value={casualties}
            onChange={e => setCasualties(e.target.value)}
            style={{ 
              flex: 1, background: 'var(--surface)', color: 'white', 
              border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', outline: 'none', fontFamily: 'inherit'
            }}
            disabled={loading}
          />
        </div>

        <textarea 
          placeholder="Describe the emergency situation in detail... include location, type of disaster, visible casualties, and immediate needs"
          value={report}
          onChange={(e) => setReport(e.target.value)}
          disabled={loading}
          style={{ marginTop: '0.5rem' }}
        />
        <div className="quick-fill-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(EXAMPLES).map(([key, text]) => (
            <button 
              key={key} 
              type="button" 
              className="btn-outline"
              onClick={() => setReport(text)}
              disabled={loading}
            >
              {key}
            </button>
          ))}
        </div>
        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={loading || !report.trim()}
          style={{ marginTop: '1rem' }}
        >
          {loading ? 'Processing...' : 'Analyze & Dispatch'}
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="status-message">{statusMsg}</div>
        </div>
      )}

      {result && !loading && (
        <div className="result-card">
          <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{typeof result.disaster_type === 'object' ? JSON.stringify(result.disaster_type) : result.disaster_type}</h2>
              <div style={{ color: 'var(--text-muted)' }}>📍 {typeof result.location === 'object' ? JSON.stringify(result.location) : result.location}</div>
            </div>
            <span className={`badge badge-${result.severity}`}>{typeof result.severity === 'object' ? JSON.stringify(result.severity) : result.severity} Priority</span>
          </div>
          <div className="result-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Estimated Casualties:</strong> {typeof result.casualties_estimate === 'object' ? JSON.stringify(result.casualties_estimate) : result.casualties_estimate}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Resources Needed:</strong>
              {parsedResources.map((res, i) => (
                <span key={i} className="tag">{typeof res === 'object' ? JSON.stringify(res) : String(res)}</span>
              ))}
            </div>
            
            <div>
              <strong style={{ display: 'block' }}>Dispatch Instructions:</strong>
              <div className="terminal">
                {typeof result.dispatch_instruction === 'object' ? JSON.stringify(result.dispatch_instruction) : result.dispatch_instruction}
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link to="/dashboard" className="btn-outline" style={{ display: 'inline-block' }}>
                View All Incidents
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportForm;
