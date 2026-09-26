import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

function DispatchView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState('');
  const [activeTime, setActiveTime] = useState('00:00:00');
  const [checkedSOPs, setCheckedSOPs] = useState({});
  const [chat, setChat] = useState([{ sender: 'System', text: 'Secure radio channel established.' }]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (!incident || incident.status === 'resolved') return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date() - new Date(incident.created_at + "Z")) / 1000);
      if (diff < 0) return;
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setActiveTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [incident]);

  const getSOP = (type) => {
    const defaultSOP = [ "Establish Incident Command", "Secure the perimeter", "Triage casualties", "Deploy primary resources", "Setup staging area" ];
    if (!type) return defaultSOP;
    const t = type.toLowerCase();
    if (t.includes('fire')) return ["Trigger 3-alarm response", "Evacuate adjacent buildings", "Shut off gas lines", "Establish water supply", "Deploy aerial units"];
    if (t.includes('earthquake')) return ["Stop all trains/transit", "Assess structural damage", "Deploy Search & Rescue", "Setup triage tents", "Check gas/water mains"];
    if (t.includes('flood')) return ["Deploy swift-water rescue", "Evacuate low-lying areas", "Setup emergency shelters", "Distribute sandbags", "Monitor dam integrity"];
    if (t.includes('chemical') || t.includes('hazmat')) return ["Establish hot zone", "Deploy hazmat suits", "Setup decontamination tent", "Notify poison control", "Evacuate downwind areas"];
    return defaultSOP;
  };

  const sops = incident ? getSOP(incident.disaster_type) : [];
  const toggleSOP = (idx) => setCheckedSOPs(prev => ({ ...prev, [idx]: !prev[idx] }));


  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/incidents/${id}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncident();
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Auto refresh logs
    return () => clearInterval(interval);
  }, [id]);

  const fetchIncident = async () => {
    try {
      const res = await fetch(`${API_URL}/incidents/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setIncident(data);
      setStatus(data.status);
    } catch (e) {
      console.error(e);
      navigate('/dashboard');
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLog.trim()) return;
    try {
      await fetch(`${API_URL}/incidents/${id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newLog })
      });
      setNewLog('');
      fetchLogs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    try {
      await fetch(`${API_URL}/incidents/${id}`, {
        method: 'DELETE'
      });
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChat(prev => [...prev, { sender: 'Dispatcher', text: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChat(prev => [...prev, { sender: 'Field Unit 1', text: 'Copy that, Dispatch. We are on it.' }]);
    }, 2000);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    try {
      await fetch(`${API_URL}/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!incident) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;

  let resources = [];
  try {
    const parsed = incident.resources_needed ? JSON.parse(incident.resources_needed) : [];
    resources = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    resources = [];
  }
  return (
    <div>
      <div className="hide-print" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" className="btn-outline">← Back to Dashboard</Link>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ padding: '0.4rem 1rem', background: 'var(--surface2)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '1.2rem', color: incident.status === 'resolved' ? 'var(--text-muted)' : 'var(--critical)' }}>
            ⏱️ {incident.status === 'resolved' ? 'RESOLVED' : activeTime}
          </div>
          <button className="btn-outline" onClick={handleDelete} style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }}>Delete</button>
        </div>
      </div>
      
      <div className="dispatch-layout">
        <div className="detail-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Incident Details</h2>
            <span className={`badge badge-${incident.severity}`}>{incident.severity}</span>
          </div>
          
          <div className="detail-group">
            <div className="detail-label">Type</div>
            <div className="detail-value">{incident.disaster_type}</div>
          </div>
          
          <div className="detail-group">
            <div className="detail-label">Location</div>
            <div className="detail-value">{incident.location}</div>
          </div>
          
          <div className="detail-group">
            <div className="detail-label">Casualties Estimate</div>
            <div className="detail-value">{incident.casualties_estimate}</div>
          </div>
          
          <div className="detail-group">
            <div className="detail-label">Resources Needed</div>
            <div style={{ marginTop: '0.5rem' }}>
              {resources.map((res, i) => (
                <span key={i} className="tag">{typeof res === 'object' ? JSON.stringify(res) : String(res)}</span>
              ))}
              {resources.length === 0 && <span style={{ color: 'var(--text-muted)' }}>None specified</span>}
            </div>
          </div>


          <div className="detail-group hide-print" style={{ marginTop: '2rem' }}>
            <div className="detail-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Standard Operating Procedures</span>
              <span>{Object.values(checkedSOPs).filter(Boolean).length} / {sops.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {sops.map((task, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--surface)', borderRadius: '4px', cursor: 'pointer', opacity: checkedSOPs[idx] ? 0.6 : 1 }}>
                  <input type="checkbox" checked={!!checkedSOPs[idx]} onChange={() => toggleSOP(idx)} />
                  <span style={{ textDecoration: checkedSOPs[idx] ? 'line-through' : 'none' }}>{task}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="detail-group hide-print" style={{ marginTop: '2rem' }}>
            <div className="detail-label">Tactical Radio Comms</div>
            <div style={{ background: 'var(--surface2)', borderRadius: '4px', padding: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '200px', overflowY: 'auto' }}>
              {chat.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', opacity: c.sender === 'System' ? 0.6 : 1 }}>
                  <strong style={{ color: c.sender === 'Dispatcher' ? 'var(--primary)' : c.sender === 'System' ? 'inherit' : 'var(--high)' }}>[{c.sender}]</strong>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send message to field units..." style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', background: 'var(--surface)', color: 'white', border: '1px solid var(--border)', outline: 'none' }} />
              <button type="submit" className="btn-outline">Send</button>
            </form>
          </div>
          
          <div className="detail-group hide-print" style={{ marginTop: '2rem' }}>
            <div className="detail-label">Status Update</div>
            <select value={status} onChange={handleStatusChange}>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        
        <div className="detail-panel" style={{ background: 'transparent', border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ margin: '0 0 1rem 0' }}>Dispatch Protocol</h2>
            <div className="terminal" style={{ margin: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {incident.dispatch_instruction}
            </div>
          </div>
          
          <div className="detail-panel">
            <h2 style={{ margin: '0 0 1rem 0' }}>Event Logs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem' }}>
              {logs.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No logs recorded yet.</div>}
              {logs.map(log => (
                <div key={log.id} style={{ background: 'var(--surface2)', padding: '0.8rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    {new Date(log.created_at + "Z").toLocaleString()}
                  </div>
                  <div>{log.message}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddLog} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={newLog}
                onChange={e => setNewLog(e.target.value)}
                placeholder="Add a new update or log..."
                style={{ 
                  flex: 1, background: 'var(--surface)', color: 'white', 
                  border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px', outline: 'none'
                }}
              />
              <button type="submit" className="btn-outline" style={{ background: 'var(--surface2)' }}>Add Log</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DispatchView;
