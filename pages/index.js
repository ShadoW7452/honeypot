// pages/index.js - NexCore Enterprise Banking Honeypot
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';

// Google Analytics helper
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function gtag(...args) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

// Client-side fingerprinting
async function collectFingerprint(page) {
  const fp = {
    page,
    session_id: getOrCreateSessionId(),
    screen: `${screen.width}x${screen.height}`,
    color_depth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    languages: navigator.languages?.join(','),
    do_not_track: navigator.doNotTrack,
    cookies_enabled: navigator.cookieEnabled,
    platform: navigator.platform,
    hardware_concurrency: navigator.hardwareConcurrency,
    device_memory: navigator.deviceMemory,
    plugins_count: navigator.plugins?.length,
    touch_points: navigator.maxTouchPoints,
    referrer: document.referrer,
  };

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('NexCore🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('NexCore🔒', 4, 17);
    fp.canvas_hash = canvas.toDataURL().substring(0, 50);
  } catch (e) {}

  // WebGL fingerprint
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      fp.webgl_vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      fp.webgl_renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
  } catch (e) {}

  // Battery
  try {
    const battery = await navigator.getBattery?.();
    if (battery) fp.battery = `${Math.round(battery.level * 100)}%`;
  } catch (e) {}

  // Connection
  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) fp.connection = `${conn.effectiveType}/${conn.downlink}Mbps`;
  } catch (e) {}

  return fp;
}

function getOrCreateSessionId() {
  let sid = sessionStorage.getItem('_nexcore_sid');
  if (!sid) {
    sid = 'SID-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('_nexcore_sid', sid);
  }
  return sid;
}

// Attack Alert Overlay Component
function AlertOverlay({ data, caseId, onClose }) {
  const [countdown, setCountdown] = useState(30);
  const [phase, setPhase] = useState('scanning');
  const [showData, setShowData] = useState(false);

  useEffect(() => {
    const phases = ['scanning', 'identifying', 'capturing', 'complete'];
    let i = 1;
    const interval = setInterval(() => {
      if (i < phases.length) {
        setPhase(phases[i]);
        if (phases[i] === 'complete') setShowData(true);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);

    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  const threatColors = {
    CRITICAL: '#ff0040',
    HIGH: '#ff6600',
    MEDIUM: '#ffcc00',
    LOW: '#00ff88',
    INFO: '#00aaff',
    MEDIUM_BRUTE: '#ff6600',
  };
  const color = threatColors[data?.threat_level] || '#ff0040';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Share Tech Mono', 'Courier New', monospace",
      overflow: 'auto',
    }}>
      {/* Scanlines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.03) 2px, rgba(255,0,0,0.03) 4px)',
        zIndex: 10000,
      }} />

      <div style={{
        maxWidth: 700, width: '95%', margin: '20px auto',
        border: `2px solid ${color}`,
        boxShadow: `0 0 60px ${color}40, 0 0 120px ${color}20, inset 0 0 60px rgba(0,0,0,0.9)`,
        padding: '30px',
        position: 'relative',
        animation: 'alertPulse 2s infinite',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{
            fontSize: 14, color: color, letterSpacing: 8,
            marginBottom: 10, opacity: 0.8,
          }}>NEXCORE SECURITY SYSTEM</div>
          <div style={{
            fontSize: 42, fontWeight: 900, color: color,
            textShadow: `0 0 30px ${color}`,
            letterSpacing: 3,
            animation: 'glitch 2s infinite',
          }}>⚠ INTRUSION DETECTED</div>
          <div style={{
            fontSize: 14, color: '#888', marginTop: 10, letterSpacing: 4,
          }}>THREAT LEVEL: <span style={{ color, fontWeight: 900 }}>{data?.threat_level || 'HIGH'}</span></div>
        </div>

        {/* Phase indicator */}
        <div style={{ marginBottom: 25, padding: '15px', background: 'rgba(255,0,0,0.05)', border: '1px solid #ff004020', borderRadius: 4 }}>
          <PhaseBar phase={phase} color={color} />
        </div>

        {showData && data && (
          <>
            {/* Attacker Profile */}
            <Section title="ATTACKER PROFILE" color={color}>
              <DataRow label="IP ADDRESS" value={data.ip} highlight color={color} />
              <DataRow label="LOCATION" value={data.location} />
              <DataRow label="CITY/REGION" value={data.city} />
              <DataRow label="COUNTRY" value={data.country} />
              <DataRow label="ISP/ORGANIZATION" value={data.isp} />
              <DataRow label="COORDINATES" value={data.coordinates} />
              <DataRow label="TIMEZONE" value={data.timezone} />
            </Section>

            <Section title="DEVICE FINGERPRINT" color={color}>
              <DataRow label="BROWSER" value={data.browser} />
              <DataRow label="OPERATING SYSTEM" value={data.os} />
              <DataRow label="DEVICE TYPE" value={data.device} />
              <DataRow label="SCREEN RESOLUTION" value={data.screen} />
              <DataRow label="PLATFORM" value={data.platform} />
              <DataRow label="CPU CORES" value={data.hardware_concurrency} />
              <DataRow label="DEVICE MEMORY" value={data.device_memory ? `${data.device_memory}GB` : undefined} />
              <DataRow label="CANVAS HASH" value={data.canvas_hash} />
              <DataRow label="GPU RENDERER" value={data.webgl_renderer} />
              <DataRow label="LANGUAGE" value={data.language} />
            </Section>

            <Section title="THREAT INTELLIGENCE" color={color}>
              <DataRow label="BOT DETECTED" value={data.is_bot ? '⚠️ YES' : 'No'} highlight={data.is_bot} color="#ff0040" />
              <DataRow label="ACCESS ATTEMPTS" value={data.attempts} highlight={data.attempts > 1} color="#ff6600" />
              <DataRow label="THREAT SCORE" value={`${Math.min(100, (data.attempts || 1) * 15)}/100`} />
            </Section>

            {/* Status boxes */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12, margin: '25px 0',
            }}>
              <StatusBox icon="📸" label="SCREENSHOT" status="CAPTURED" color="#00ff88" />
              <StatusBox icon="📹" label="RECORDING" status="ACTIVE" color="#ff4400" />
              <StatusBox icon="🔒" label="IDENTITY" status="LOGGED" color={color} />
            </div>

            {/* Alert message */}
            <div style={{
              background: 'rgba(255,0,0,0.08)',
              border: `1px solid ${color}40`,
              borderLeft: `4px solid ${color}`,
              padding: '20px',
              marginBottom: 25,
              borderRadius: 4,
            }}>
              <div style={{ color, fontSize: 13, letterSpacing: 2, marginBottom: 10 }}>⚠ SYSTEM MESSAGE</div>
              <div style={{ color: '#ddd', fontSize: 14, lineHeight: 1.7 }}>
                Your intrusion attempt has been <strong style={{ color }}>DETECTED AND RECORDED</strong>.
                Your device fingerprint, IP address, and complete session activity have been captured
                and automatically forwarded to our <strong style={{ color: '#00d4ff' }}>Cybersecurity Response Team</strong>.
                This incident has been submitted to relevant authorities.
              </div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 12 }}>
                Case Reference: <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>{caseId || `#HC-${Date.now()}`}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#444', fontSize: 12, marginBottom: 15, letterSpacing: 2 }}>
                THIS WINDOW WILL REMAIN FOR DOCUMENTATION PURPOSES
              </div>
              <div style={{ color: '#333', fontSize: 11 }}>
                _nexcore_honeypot_v4.2.1 | Powered by NexCore Security Intelligence
              </div>
            </div>
          </>
        )}

        {!showData && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
            <div style={{ fontSize: 13, letterSpacing: 4, animation: 'blink 1s infinite' }}>
              ANALYZING INTRUSION...
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes alertPulse { 0%,100%{box-shadow:0 0 60px ${color}40;} 50%{box-shadow:0 0 100px ${color}70;} }
        @keyframes glitch {
          0%,90%,100%{transform:translate(0)} 
          91%{transform:translate(-3px,1px)} 
          93%{transform:translate(3px,-1px)}
          95%{transform:translate(-1px,2px)}
          97%{transform:translate(2px,-1px)}
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}

function PhaseBar({ phase, color }) {
  const phases = ['scanning', 'identifying', 'capturing', 'complete'];
  const labels = ['Scanning Device', 'Identifying Attacker', 'Capturing Evidence', 'Identity Confirmed'];
  const currentIdx = phases.indexOf(phase);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {phases.map((p, i) => (
          <div key={p} style={{
            flex: 1, height: 4,
            background: i <= currentIdx ? color : '#222',
            borderRadius: 2,
            transition: 'background 0.5s',
            boxShadow: i <= currentIdx ? `0 0 8px ${color}` : 'none',
          }} />
        ))}
      </div>
      <div style={{ color: color, fontSize: 12, letterSpacing: 3 }}>
        {labels[currentIdx] || 'COMPLETE'}...
      </div>
    </div>
  );
}

function Section({ title, children, color }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        color: color, fontSize: 11, letterSpacing: 5,
        marginBottom: 12, paddingBottom: 8,
        borderBottom: `1px solid ${color}30`,
      }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value, highlight, color }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 2 }}>{label}</div>
      <div style={{
        fontSize: 13, color: highlight ? (color || '#ff4400') : '#00ff88',
        fontFamily: 'monospace',
        textShadow: highlight ? `0 0 10px ${color || '#ff4400'}60` : 'none',
      }}>{String(value)}</div>
    </div>
  );
}

function StatusBox({ icon, label, status, color }) {
  return (
    <div style={{
      background: `${color}10`,
      border: `1px solid ${color}40`,
      borderRadius: 6, padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color, letterSpacing: 2, fontWeight: 900,
        animation: status === 'ACTIVE' ? 'blink 1s infinite' : 'none',
      }}>{status}</div>
    </div>
  );
}

// Matrix Rain background
function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*';
    const fontSize = 13;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#003300';
      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const brightness = Math.random() > 0.95 ? '#00ff41' : '#003300';
        ctx.fillStyle = brightness;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 45);
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    return () => { clearInterval(interval); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, opacity: 0.15, zIndex: 0 }} />;
}

// Main Honeypot Page
export default function HoneypotPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const [caseId, setCaseId] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [fpData, setFpData] = useState(null);
  const [mouseMovements, setMouseMovements] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [startTime] = useState(Date.now());
  const [formInteractions, setFormInteractions] = useState([]);
  const [status, setStatus] = useState('SECURE');

  // Collect fingerprint on load
  useEffect(() => {
    const init = async () => {
      try {
        const fp = await collectFingerprint('/');
        setFpData(fp);
        // Send initial fingerprint silently
        const res = await fetch('/api/fp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...fp, suspicious: false }),
        });
        const data = await res.json();
        if (data.case_id) setCaseId(data.case_id);
      } catch (e) {}
    };
    init();

    // Track mouse movements
    const mouseMoveHandler = () => setMouseMovements((m) => m + 1);
    const keyHandler = () => setKeystrokes((k) => k + 1);
    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const trackInteraction = (field, value) => {
    setFormInteractions((prev) => [
      ...prev,
      { field, value: field === 'password' ? '*'.repeat(value.length) : value, time: Date.now() },
    ]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAttempts((a) => a + 1);

    // Detect attack patterns
    const suspiciousPatterns = /('|"|\-\-|;|union|select|<script|javascript:|OR 1=1|AND 1=1)/i;
    const isAttack = suspiciousPatterns.test(username) || suspiciousPatterns.test(password);

    // GA event
    gtag('event', 'login_attempt', {
      event_category: 'honeypot',
      event_label: isAttack ? 'attack_detected' : 'normal_attempt',
      value: attempts + 1,
    });

    try {
      const fp = fpData || (await collectFingerprint('/'));

      // Send to fake login API
      const res = await fetch('/api/fake-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, password, mfa_token: mfa,
          session_id: getOrCreateSessionId(),
          fp_data: fp,
          mouse_movements: mouseMovements,
          keystrokes, time_on_page: Date.now() - startTime,
          form_interactions: formInteractions,
          payload: isAttack ? `${username} / ${password}` : undefined,
          attack_detected: isAttack,
          suspicious: isAttack || attempts >= 2,
        }),
      });
      const data = await res.json();
      setError(data.error || 'Authentication failed');

      if (data.requires_mfa && !showMfa) setShowMfa(true);

      // Show alert after 2+ attempts or attack detection
      if (attempts >= 1 || isAttack) {
        setStatus('BREACH DETECTED');
        const fpRes = await fetch('/api/fp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...fp, attack_detected: true, suspicious: true,
            payload: `${username} / ${password}`,
            page: '/login',
          }),
        });
        const fpData2 = await fpRes.json();
        if (fpData2.attacker_data) {
          setTimeout(() => {
            setAlert(fpData2.attacker_data);
            setCaseId(fpData2.case_id);
          }, 500);
        }
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>NexCore Global | Enterprise Banking Infrastructure</title>
        <meta name="description" content="NexCore Global Financial Infrastructure Management System v4.2" />
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`
            }} />
          </>
        )}
        {/* Fake honeytokens in comments - hackers look for these */}
        {/* 
          API_KEY=sk-nexcore-prod-7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c
          DB_PASSWORD=NexCore@DB#2024!Prod
          ADMIN_SECRET=admin:N3xC0r3@dmin!2024
          S3_BUCKET=nexcore-prod-backup-2024
          SSH_KEY: /var/nexcore/.ssh/prod_rsa
        -->*/}
      </Head>

      <div style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <MatrixRain />

        {/* Status bar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.9)',
          borderBottom: `1px solid ${status === 'SECURE' ? '#003300' : '#ff000040'}`,
          padding: '8px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ color: '#00ff41', fontSize: 11 }}>◉ NEXCORE GLOBAL</span>
            <span style={{ color: '#333', fontSize: 11 }}>|</span>
            <span style={{ color: '#555', fontSize: 11 }}>ISO 27001 CERTIFIED</span>
            <span style={{ color: '#555', fontSize: 11 }}>|</span>
            <span style={{ color: '#555', fontSize: 11 }}>PCI DSS COMPLIANT</span>
          </div>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
            <StatusPill label="SSL/TLS" value="AES-256" color="#00ff41" />
            <StatusPill label="FIREWALL" value="ACTIVE" color="#00ff41" />
            <StatusPill label={status === 'SECURE' ? 'IDS/IPS' : '⚠ STATUS'} value={status} color={status === 'SECURE' ? '#00ff41' : '#ff4400'} />
            <span style={{ color: '#333', fontSize: 11 }}>v4.2.1</span>
          </div>
        </div>

        {/* Grid background */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1,
          backgroundImage: 'linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        {/* Main content */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
          padding: '80px 20px 40px',
        }}>
          <div style={{ width: '100%', maxWidth: 480 }}>

            {/* Logo & Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ marginBottom: 15 }}>
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <polygon points="30,2 55,15 55,45 30,58 5,45 5,15" stroke="#00ff41" strokeWidth="1.5" fill="none" opacity="0.8" />
                  <polygon points="30,10 47,20 47,40 30,50 13,40 13,20" stroke="#00ff41" strokeWidth="0.5" fill="none" opacity="0.4" />
                  <text x="30" y="35" textAnchor="middle" fill="#00ff41" fontSize="16" fontFamily="'Orbitron', monospace" fontWeight="900">N</text>
                </svg>
              </div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 26, fontWeight: 900,
                color: '#00ff41',
                letterSpacing: 4,
                textShadow: '0 0 30px #00ff4180',
              }}>NEXCORE</div>
              <div style={{ color: '#558855', fontSize: 11, letterSpacing: 6, marginTop: 5, fontFamily: "'Share Tech Mono', monospace" }}>
                GLOBAL FINANCIAL INFRASTRUCTURE
              </div>
              <div style={{ color: '#333', fontSize: 10, letterSpacing: 3, marginTop: 8, fontFamily: "'Share Tech Mono', monospace" }}>
                ENTERPRISE BANKING MANAGEMENT SYSTEM
              </div>
            </div>

            {/* Login Card */}
            <div style={{
              background: 'rgba(0,5,0,0.95)',
              border: '1px solid #003300',
              borderTop: '2px solid #00ff41',
              boxShadow: '0 0 80px rgba(0,255,65,0.05), 0 40px 80px rgba(0,0,0,0.8)',
              padding: '40px 35px',
              position: 'relative',
            }}>
              {/* Corner decorations */}
              <CornerDeco pos="top-left" />
              <CornerDeco pos="top-right" />
              <CornerDeco pos="bottom-left" />
              <CornerDeco pos="bottom-right" />

              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11, color: '#558855',
                letterSpacing: 4, marginBottom: 25,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>SECURE ACCESS PORTAL</span>
                <span style={{ color: '#224422' }}>REQ-AUTH-L3</span>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,50,50,0.07)',
                  border: '1px solid #ff000030',
                  borderLeft: '3px solid #ff4444',
                  padding: '12px 15px', marginBottom: 20,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 12, color: '#ff8888',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ color: '#ff4444' }}>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block', fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 10, color: '#558855', letterSpacing: 3, marginBottom: 8,
                  }}>OPERATOR ID</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); trackInteraction('username', e.target.value); }}
                    placeholder="Enter operator identification"
                    autoComplete="off"
                    style={{
                      width: '100%', padding: '14px 16px',
                      background: 'rgba(0,20,0,0.8)',
                      border: '1px solid #003300',
                      borderBottom: '2px solid #004400',
                      color: '#00ff41', fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00ff41'}
                    onBlur={(e) => e.target.style.borderColor = '#003300'}
                  />
                </div>

                <div style={{ marginBottom: showMfa ? 20 : 25 }}>
                  <label style={{
                    display: 'block', fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 10, color: '#558855', letterSpacing: 3, marginBottom: 8,
                  }}>SECURITY PASSPHRASE</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); trackInteraction('password', e.target.value); }}
                    placeholder="Enter encrypted passphrase"
                    autoComplete="new-password"
                    style={{
                      width: '100%', padding: '14px 16px',
                      background: 'rgba(0,20,0,0.8)',
                      border: '1px solid #003300',
                      borderBottom: '2px solid #004400',
                      color: '#00ff41', fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00ff41'}
                    onBlur={(e) => e.target.style.borderColor = '#003300'}
                  />
                </div>

                {showMfa && (
                  <div style={{ marginBottom: 25 }}>
                    <label style={{
                      display: 'block', fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 10, color: '#ff8800', letterSpacing: 3, marginBottom: 8,
                    }}>MFA TOKEN (REQUIRED)</label>
                    <input
                      type="text"
                      value={mfa}
                      onChange={(e) => { setMfa(e.target.value); trackInteraction('mfa', e.target.value); }}
                      placeholder="000000"
                      maxLength={6}
                      style={{
                        width: '100%', padding: '14px 16px',
                        background: 'rgba(20,10,0,0.8)',
                        border: '1px solid #442200',
                        borderBottom: '2px solid #664400',
                        color: '#ff8800', fontFamily: "'Orbitron', monospace",
                        fontSize: 20, outline: 'none', letterSpacing: 8,
                        textAlign: 'center', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '16px',
                    background: loading ? 'rgba(0,40,0,0.5)' : 'rgba(0,255,65,0.08)',
                    border: `1px solid ${loading ? '#002200' : '#00ff41'}`,
                    color: loading ? '#558855' : '#00ff41',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 13, fontWeight: 700, letterSpacing: 4,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    marginBottom: 20,
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { if (!loading) { e.target.style.background = 'rgba(0,255,65,0.15)'; e.target.style.boxShadow = '0 0 30px rgba(0,255,65,0.15)'; } }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(0,255,65,0.08)'; e.target.style.boxShadow = 'none'; }}
                >
                  {loading ? '⟳ AUTHENTICATING...' : '▶ AUTHENTICATE'}
                </button>
              </form>

              {/* Footer info */}
              <div style={{
                borderTop: '1px solid #001100', paddingTop: 20,
                fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#223322',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>SESSION ENCRYPTED</span>
                  <span>TLS 1.3 / AES-256-GCM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SERVER: NEXCORE-PROD-SGP-02</span>
                  <span>BUILD: 20241201</span>
                </div>
              </div>
            </div>

            {/* Compliance badges */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 20, marginTop: 25,
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
            }}>
              {['ISO 27001', 'PCI DSS', 'SOC 2', 'GDPR', 'SWIFT CSP'].map((badge) => (
                <span key={badge} style={{
                  color: '#223322', border: '1px solid #001a00',
                  padding: '4px 8px', letterSpacing: 1,
                }}>{badge}</span>
              ))}
            </div>

            <div style={{
              textAlign: 'center', marginTop: 15,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10, color: '#1a2a1a',
            }}>
              © 2024 NexCore Global Financial Holdings Ltd. All rights reserved.
              <br />Unauthorized access is strictly prohibited and subject to prosecution.
            </div>
          </div>
        </div>

        {/* Alert Overlay */}
        {alert && <AlertOverlay data={alert} caseId={caseId} onClose={() => setAlert(null)} />}
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #000; }
        input::placeholder { color: #223322 !important; }
        input { color: #00ff41 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #003300; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}

function StatusPill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <span style={{ color: '#333', fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}>{label}:</span>
      <span style={{ color, fontSize: 10, fontFamily: "'Share Tech Mono', monospace",
        textShadow: `0 0 8px ${color}60`,
      }}>{value}</span>
    </div>
  );
}

function CornerDeco({ pos }) {
  const styles = {
    'top-left': { top: 8, left: 8, borderTop: '1px solid #00ff41', borderLeft: '1px solid #00ff41' },
    'top-right': { top: 8, right: 8, borderTop: '1px solid #00ff41', borderRight: '1px solid #00ff41' },
    'bottom-left': { bottom: 8, left: 8, borderBottom: '1px solid #00ff41', borderLeft: '1px solid #00ff41' },
    'bottom-right': { bottom: 8, right: 8, borderBottom: '1px solid #00ff41', borderRight: '1px solid #00ff41' },
  };
  return <div style={{
    position: 'absolute', width: 15, height: 15, opacity: 0.5, ...styles[pos],
  }} />;
}
