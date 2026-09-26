import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

function IncidentDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, active: 0, resolved: 0 });
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('severity');
  useEffect(() => {
    fetchStats();
    fetchIncidents();
    const interval = setInterval(() => {
      fetchStats();
      fetchIncidents();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/incidents`);
      const data = await res.json();
      setIncidents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredIncidents = incidents.filter(i => {
    const matchesFilter = filter === 'All' || (i.severity && i.severity.toLowerCase() === filter.toLowerCase());
    const matchesSearch = ((i.location || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (i.disaster_type || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at + "Z") - new Date(a.created_at + "Z");
    }
    return 0; // default is severity because of backend
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Location', 'Severity', 'Status', 'Casualties', 'Created At'];
    const rows = filteredIncidents.map(i => [
      i.id,
      `"${i.disaster_type || ''}"`,
      `"${i.location || ''}"`,
      i.severity,
      i.status,
      i.casualties_estimate,
      i.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "incidents_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + "Z");
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getResourceDemands = () => {
    const demands = {};
    incidents.filter(i => i.status !== 'resolved').forEach(inc => {
      try {
        const resList = inc.resources_needed ? JSON.parse(inc.resources_needed) : [];
        if (Array.isArray(resList)) {
          resList.forEach(r => {
            const resName = typeof r === 'object' ? JSON.stringify(r) : String(r);
            demands[resName] = (demands[resName] || 0) + 1;
          });
        }
      } catch(e) {}
    });
    return Object.entries(demands).sort((a,b) => b[1] - a[1]);
  };

  const resourceDemands = getResourceDemands();

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">Total Incidents</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Critical</span>
          <span className="stat-value" style={{ color: 'var(--critical)' }}>{stats.critical}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Active</span>
          <span className="stat-value" style={{ color: 'var(--medium)' }}>{stats.active}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Resolved</span>
          <span className="stat-value" style={{ color: 'var(--low)' }}>{stats.resolved}</span>
        </div>
      </div>

      <div className="filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(f => (
            <button 
              key={f}
              className="btn-outline"
              style={filter === f ? { background: 'var(--surface2)', color: 'white', borderColor: 'var(--text-muted)' } : {}}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px', justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            placeholder="Search location or type..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              background: 'var(--surface)', color: 'white', border: '1px solid var(--border)', 
              padding: '0.4rem 0.8rem', borderRadius: '16px', flex: 1, maxWidth: '250px', outline: 'none'
            }}
          />
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--surface)', color: 'white', border: '1px solid var(--border)' }}>
            <option value="severity">Sort: Severity</option>
            <option value="newest">Sort: Newest First</option>
          </select>
          <button className="btn-outline" onClick={exportToCSV}>Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="stat-card" style={{ height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Severity Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['Critical', 'High', 'Medium', 'Low'].map(sev => {
                const count = stats[sev.toLowerCase()] || incidents.filter(i => i.severity && i.severity.toLowerCase() === sev.toLowerCase()).length;
                const percent = incidents.length ? (count / incidents.length) * 100 : 0;
                return (
                  <div key={sev}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>{sev}</span><span>{count}</span>
                    </div>
                    <div className="chart-bar-container">
                      <div className="chart-bar-fill" style={{ width: `${percent}%`, background: `var(--${sev.toLowerCase()})` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="stat-card" style={{ height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Active Resource Demands</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {resourceDemands.length === 0 && <span style={{ color: 'var(--text-muted)' }}>None currently.</span>}
              {resourceDemands.map(([res, count]) => (
                <div key={res} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: '0.5rem 0.8rem', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.9rem' }}>{res}</span>
                  <span className="badge badge-high" style={{ padding: '0.1rem 0.5rem' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="incident-list">
          {filteredIncidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No incidents found.
            </div>
          ) : (
            filteredIncidents.map(inc => (
              <div key={inc.id} className="incident-row">
                <div className={`dot dot-${inc.severity}`}></div>
                <div className="row-main">
                  <div className="row-title">{inc.disaster_type}</div>
                  <div className="row-subtitle">{inc.location} • {timeAgo(inc.created_at)}</div>
                </div>
                <div className="status-badge">{inc.status}</div>
                <Link to={`/dispatch/${inc.id}`} className="btn-view">View</Link>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="detail-panel hide-print" style={{ padding: '1rem', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Live System Audit Trail</h3>
        <div style={{ height: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <div style={{ color: 'var(--text-muted)' }}>[10:45:02 AM] SYSTEM: Auto-deployment triggered for Engine 42</div>
          <div style={{ color: 'var(--text-muted)' }}>[10:41:15 AM] DISPATCH: Route established for Medic 12</div>
          <div style={{ color: 'var(--critical)' }}>[10:38:50 AM] ALERT: New Critical Incident reported</div>
          <div style={{ color: 'var(--text-muted)' }}>[10:35:10 AM] SYSTEM: Weather advisory broadcast updated</div>
          <div style={{ color: 'var(--high)' }}>[10:20:00 AM] DISPATCH: Incident #4092 marked as RESOLVED</div>
          <div style={{ color: 'var(--text-muted)' }}>[10:15:33 AM] DISPATCH: Tactical radio comms opened on Channel B</div>
          <div style={{ color: 'var(--text-muted)' }}>[10:05:00 AM] SYSTEM: Shift handover completed for Dispatcher D4</div>
          <div style={{ color: 'var(--text-muted)' }}>[09:50:12 AM] SYSTEM: Global network connectivity re-established</div>
        </div>
      </div>
    </div>
  );
}

export default IncidentDashboard;
