// pages/monitor.js - Secret Real-Time Monitoring Dashboard
import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';

const THREAT_COLORS = {
  CRITICAL: '#ff0040',
  HIGH: '#ff6600',
  MEDIUM: '#ffcc00',
  LOW: '#00ff88',
  INFO: '#00aaff',
};

export default function MonitorDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authenticated) return;
    const key = sessionStorage.getItem('monitor_key');
    if (!key) return;

    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/logs?key=${key}&limit=200&${filter === 'attacks' ? 'attack_only=true' : ''}`),
        fetch(`/api/logs?key=${key}&stats=true`),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {}
  }, [authenticated, filter]);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData, autoRefresh]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Client-side password check (for demo - in production use server-side)
    // Send password to verify
    try {
      const res = await fetch(`/api/logs?key=${password}&limit=1`);
      if (res.ok) {
        sessionStorage.setItem('monitor_key', password);
        setAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError('Invalid monitor key');
      }
    } catch (e) {
      setAuthError('Authentication failed');
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh', background: '#05050a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
      }}>
        <Head>
          <title>NexCore Monitor</title>
          <meta name="robots" content="noindex,nofollow" />
          <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700&display=swap" rel="stylesheet" />
        </Head>
        <div style={{
          maxWidth: 380, width: '90%',
          background: '#0a0a12',
          border: '1px solid #1a1a3a',
          borderTop: '2px solid #4444ff',
          padding: 35,
          boxShadow: '0 0 60px rgba(68,68,255,0.1)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ color: '#4444ff', fontSize: 24, fontFamily: "'Orbitron', monospace", fontWeight: 700, letterSpacing: 3 }}>
              MONITOR
            </div>
            <div style={{ color: '#333', fontSize: 10, letterSpacing: 4, marginTop: 5 }}>
              NEXCORE SECURITY INTELLIGENCE
            </div>
          </div>
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#444', fontSize: 10, letterSpacing: 3, display: 'block', marginBottom: 8 }}>
                MONITOR KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter monitor key"
                style={{
                  width: '100%', padding: '12px',
                  background: '#05050f', border: '1px solid #1a1a3a',
                  color: '#8888ff', fontSize: 13, outline: 'none',
                  fontFamily: "'Share Tech Mono', monospace",
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {authError && (
              <div style={{ color: '#ff4444', fontSize: 12, marginBottom: 15 }}>⚠ {authError}</div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: 'rgba(68,68,255,0.1)',
              border: '1px solid #4444ff',
              color: '#8888ff', fontSize: 12, letterSpacing: 3,
              cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace",
            }}>
              {loading ? 'VERIFYING...' : 'ACCESS MONITOR'}
            </button>
          </form>
        </div>
        <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
      </div>
    );
  }

  const filteredLogs = filter === 'attacks' ? logs.filter((l) => l.is_attack) : logs;

  return (
    <>
      <Head>
        <title>NexCore Security Monitor</title>
        <meta name="robots" content="noindex,nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#05050a', color: '#ccc', fontFamily: "'Share Tech Mono', monospace" }}>
        {/* Top Nav */}
        <div style={{
          background: '#0a0a12', borderBottom: '1px solid #1a1a3a',
          padding: '12px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ color: '#4444ff', fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: 14, letterSpacing: 3 }}>
              ◉ NEXCORE MONITOR
            </span>
            <span style={{ color: '#1a1a3a' }}>|</span>
            <span style={{ color: '#333', fontSize: 11 }}>SECURITY INTELLIGENCE DASHBOARD</span>
          </div>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
            <span style={{ color: '#333', fontSize: 11 }}>LAST UPDATE: {lastUpdate || 'Loading...'}</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                background: 'none', border: `1px solid ${autoRefresh ? '#00ff8830' : '#333'}`,
                color: autoRefresh ? '#00ff88' : '#555',
                padding: '5px 12px', fontSize: 10, cursor: 'pointer', letterSpacing: 2,
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              {autoRefresh ? '⟳ AUTO' : '⏸ PAUSED'}
            </button>
            <button
              onClick={fetchData}
              style={{
                background: 'none', border: '1px solid #4444ff30',
                color: '#4444ff', padding: '5px 12px', fontSize: 10,
                cursor: 'pointer', letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              REFRESH
            </button>
          </div>
        </div>

        <div style={{ padding: '25px' }}>
          {/* Stats Grid */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 15, marginBottom: 25 }}>
              <StatCard label="TOTAL VISITS" value={stats.total_visits} color="#4444ff" icon="👁" />
              <StatCard label="ATTACKS DETECTED" value={stats.total_attacks} color="#ff0040" icon="🚨" />
              <StatCard label="UNIQUE IPs" value={stats.unique_ips} color="#ff6600" icon="🌐" />
              <StatCard label="TOP ATTACK" value={stats.top_attack} color="#ffcc00" icon="⚡" small />
              <StatCard label="TOP COUNTRY" value={stats.top_country} color="#00ff88" icon="🌍" small />
              <StatCard label="ATTACK RATE" value={stats.total_visits > 0 ? `${Math.round(stats.total_attacks / stats.total_visits * 100)}%` : '0%'} color="#ff4444" icon="📊" />
            </div>
          )}

          {/* Attack Types */}
          {stats?.attack_types && Object.keys(stats.attack_types).length > 0 && (
            <div style={{
              background: '#0a0a12', border: '1px solid #1a1a3a',
              padding: 20, marginBottom: 25, borderRadius: 4,
            }}>
              <div style={{ color: '#4444ff', fontSize: 11, letterSpacing: 4, marginBottom: 15 }}>ATTACK TYPE BREAKDOWN</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {Object.entries(stats.attack_types).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} style={{
                    background: '#05050f', border: `1px solid ${THREAT_COLORS[type] || '#333'}30`,
                    padding: '8px 14px', borderRadius: 3,
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}>
                    <span style={{ color: THREAT_COLORS[type] || '#888', fontSize: 11 }}>{type}</span>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
            {['all', 'attacks'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? 'rgba(68,68,255,0.1)' : 'none',
                border: `1px solid ${filter === f ? '#4444ff' : '#1a1a3a'}`,
                color: filter === f ? '#8888ff' : '#444',
                padding: '7px 16px', fontSize: 10, cursor: 'pointer',
                letterSpacing: 3, fontFamily: "'Share Tech Mono', monospace",
              }}>
                {f.toUpperCase()} ({f === 'all' ? logs.length : logs.filter((l) => l.is_attack).length})
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ color: '#333', fontSize: 11, alignSelf: 'center' }}>
              {filteredLogs.length} RECORDS
            </span>
          </div>

          {/* Logs Table */}
          <div style={{ background: '#0a0a12', border: '1px solid #1a1a3a', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '140px 120px 80px 1fr 120px 120px',
              padding: '10px 15px',
              background: '#080810',
              borderBottom: '1px solid #1a1a3a',
              fontSize: 9, color: '#444', letterSpacing: 3,
            }}>
              <span>TIMESTAMP</span>
              <span>IP ADDRESS</span>
              <span>THREAT</span>
              <span>ATTACK TYPE / PAGE</span>
              <span>LOCATION</span>
              <span>BROWSER</span>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {filteredLogs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#333', fontSize: 13 }}>
                  No logs yet. Waiting for activity...
                </div>
              ) : (
                filteredLogs.map((log, i) => (
                  <LogRow key={log.id || i} log={log} onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)} selected={selectedLog?.id === log.id} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Log Detail Panel */}
        {selectedLog && (
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 420,
            background: '#080810', borderLeft: '1px solid #1a1a3a',
            zIndex: 200, overflowY: 'auto', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ color: '#4444ff', fontSize: 11, letterSpacing: 3 }}>LOG DETAIL</span>
              <button onClick={() => setSelectedLog(null)} style={{
                background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18,
              }}>×</button>
            </div>

            <div style={{ fontSize: 10, color: '#4444ff', letterSpacing: 3, marginBottom: 5 }}>CASE ID</div>
            <div style={{ color: '#00d4ff', fontSize: 12, marginBottom: 20, fontFamily: 'monospace' }}>{selectedLog.id}</div>

            <DetailSection title="ATTACKER INFO">
              <DetailRow label="IP" value={selectedLog.ip} />
              <DetailRow label="Location" value={selectedLog.location} />
              <DetailRow label="Country" value={selectedLog.country} />
              <DetailRow label="City" value={selectedLog.city} />
              <DetailRow label="ISP" value={selectedLog.isp} />
              <DetailRow label="Timezone" value={selectedLog.timezone || selectedLog.timezone_client} />
              <DetailRow label="Coordinates" value={selectedLog.coordinates} />
            </DetailSection>

            <DetailSection title="DEVICE">
              <DetailRow label="Browser" value={selectedLog.browser} />
              <DetailRow label="OS" value={selectedLog.os} />
              <DetailRow label="Device" value={selectedLog.device} />
              <DetailRow label="Screen" value={selectedLog.screen} />
              <DetailRow label="Platform" value={selectedLog.platform} />
              <DetailRow label="CPU Cores" value={selectedLog.hardware_concurrency} />
              <DetailRow label="RAM" value={selectedLog.device_memory ? `${selectedLog.device_memory}GB` : null} />
              <DetailRow label="GPU" value={selectedLog.webgl_renderer} />
              <DetailRow label="Canvas Hash" value={selectedLog.canvas_hash} />
              <DetailRow label="Language" value={selectedLog.language} />
              <DetailRow label="Battery" value={selectedLog.battery} />
              <DetailRow label="Connection" value={selectedLog.connection} />
            </DetailSection>

            <DetailSection title="ATTACK">
              <DetailRow label="Type" value={selectedLog.attack_type} highlight color={THREAT_COLORS[selectedLog.threat_level]} />
              <DetailRow label="Level" value={selectedLog.threat_level} highlight color={THREAT_COLORS[selectedLog.threat_level]} />
              <DetailRow label="Page" value={selectedLog.page} />
              <DetailRow label="Referrer" value={selectedLog.referrer} />
              <DetailRow label="Attempts" value={selectedLog.attempts} />
              <DetailRow label="Time on Page" value={selectedLog.time_on_page ? `${Math.round(selectedLog.time_on_page / 1000)}s` : null} />
              <DetailRow label="Mouse Moves" value={selectedLog.mouse_movements} />
              <DetailRow label="Keystrokes" value={selectedLog.keystrokes} />
              <DetailRow label="Is Bot" value={selectedLog.is_bot ? 'YES ⚠️' : 'No'} highlight={selectedLog.is_bot} color="#ff4444" />
            </DetailSection>

            {selectedLog.payload && (
              <DetailSection title="PAYLOAD">
                <div style={{
                  background: '#05050a', border: '1px solid #ff000020',
                  padding: 12, fontSize: 11, color: '#ff8888',
                  wordBreak: 'break-all', lineHeight: 1.6,
                  fontFamily: 'monospace',
                }}>
                  {selectedLog.payload}
                </div>
              </DetailSection>
            )}

            {selectedLog.attack_details?.length > 0 && (
              <DetailSection title="DETECTIONS">
                {selectedLog.attack_details.map((d, i) => (
                  <div key={i} style={{
                    background: '#05050a', border: `1px solid ${THREAT_COLORS[d.level] || '#333'}20`,
                    padding: '8px 12px', marginBottom: 6,
                    borderLeft: `3px solid ${THREAT_COLORS[d.level] || '#333'}`,
                  }}>
                    <div style={{ color: THREAT_COLORS[d.level], fontSize: 11 }}>{d.type} [{d.level}]</div>
                    <div style={{ color: '#555', fontSize: 10, marginTop: 4 }}>{d.detail}</div>
                  </div>
                ))}
              </DetailSection>
            )}

            <div style={{ fontSize: 10, color: '#333', marginTop: 15 }}>
              {new Date(selectedLog.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #05050a; }
        ::-webkit-scrollbar-thumb { background: #1a1a3a; }
      `}</style>
    </>
  );
}

function StatCard({ label, value, color, icon, small }) {
  return (
    <div style={{
      background: '#0a0a12', border: '1px solid #1a1a3a',
      borderTop: `2px solid ${color}`,
      padding: '18px 20px', borderRadius: 4,
    }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: small ? 14 : 28, color, fontWeight: 700, fontFamily: "'Orbitron', monospace", marginBottom: 5 }}>
        {value ?? '-'}
      </div>
      <div style={{ fontSize: 9, color: '#444', letterSpacing: 3 }}>{label}</div>
    </div>
  );
}

function LogRow({ log, onClick, selected }) {
  const color = THREAT_COLORS[log.threat_level] || '#555';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 120px 80px 1fr 120px 120px',
        padding: '10px 15px',
        borderBottom: '1px solid #0d0d18',
        cursor: 'pointer',
        background: selected ? '#0d0d20' : log.is_attack ? 'rgba(255,0,64,0.02)' : 'transparent',
        transition: 'background 0.2s',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = '#0a0a15'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = log.is_attack ? 'rgba(255,0,64,0.02)' : 'transparent'; }}
    >
      <span style={{ color: '#444', fontSize: 10 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
      <span style={{ color: '#8888ff', fontSize: 11, fontFamily: 'monospace' }}>{log.ip || 'Unknown'}</span>
      <span style={{
        color, fontSize: 9, letterSpacing: 1,
        background: `${color}15`, padding: '2px 6px', borderRadius: 2,
        border: `1px solid ${color}30`,
      }}>
        {log.threat_level || 'INFO'}
      </span>
      <span style={{ color: log.is_attack ? '#ff8888' : '#555', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {log.attack_type || log.page || '/'}
      </span>
      <span style={{ color: '#666', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {log.location || 'Unknown'}
      </span>
      <span style={{ color: '#555', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {(log.browser || '').substring(0, 20)}
      </span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: '#4444ff', fontSize: 9, letterSpacing: 4, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #1a1a3a' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value, highlight, color }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
      <span style={{ color: '#444', fontSize: 10, flexShrink: 0 }}>{label}</span>
      <span style={{
        color: highlight ? (color || '#ff8888') : '#aaa',
        fontSize: 11, textAlign: 'right', wordBreak: 'break-all',
        fontFamily: 'monospace',
      }}>
        {String(value)}
      </span>
    </div>
  );
}
