// pages/admin.js - Honeypot Admin Panel (Trap for hackers looking for admin pages)
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function FakeAdmin() {
  const [logged, setLogged] = useState(false);
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    // Immediately fingerprint anyone who reaches this page
    const fingerprint = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillText('nexcore', 10, 10);
        const ch = canvas.toDataURL().substring(22, 50);

        const data = {
          page: window.location.pathname + window.location.search,
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          canvas_hash: ch,
          referrer: document.referrer,
          attack_detected: true,
          suspicious: true,
          payload: `HONEYTRAP_ACCESS: ${window.location.href}`,
          session_id: sessionStorage.getItem('_nexcore_sid') || 'unknown',
        };

        const res = await fetch('/api/fp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.attacker_data) {
          setLogged(true);
          setTimeout(() => setAlerted(true), 2000);
        }
      } catch (e) {}
    };
    fingerprint();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAlerted(true);
  };

  if (alerted) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
      }}>
        <div style={{
          maxWidth: 600, width: '90%',
          border: '2px solid #ff0040',
          padding: 40,
          boxShadow: '0 0 80px #ff004040',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🚨</div>
          <div style={{ fontSize: 28, color: '#ff0040', fontWeight: 900, marginBottom: 15, letterSpacing: 3 }}>
            ACCESS DENIED
          </div>
          <div style={{ color: '#ff6666', fontSize: 14, lineHeight: 1.8, marginBottom: 25 }}>
            This area is restricted and monitored. Your access attempt has been
            <strong style={{ color: '#ff0040' }}> logged and reported</strong>.
            Security teams have been automatically notified of this intrusion attempt.
          </div>
          <div style={{
            background: 'rgba(255,0,0,0.05)',
            border: '1px solid #ff000020',
            padding: '15px 20px',
            fontSize: 12, color: '#ff4444',
            fontFamily: 'monospace',
          }}>
            INCIDENT ID: #{Math.random().toString(36).substr(2, 12).toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel — NexCore Management</title>
        {/* Fake honey credentials in HTML source */}
        {/* Default credentials: admin / nexcore2024 (DEPRECATED - DO NOT USE) */}
        {/* Emergency access: superadmin / Nx#2024$Admin!Override */}
      </Head>
      <div style={{
        minHeight: '100vh', background: '#0d0d0d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
      }}>
        <div style={{
          maxWidth: 420, width: '90%',
          background: '#111', border: '1px solid #333',
          padding: '35px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ color: '#888', fontSize: 11, letterSpacing: 4, marginBottom: 8 }}>NEXCORE ADMIN</div>
            <div style={{ color: '#ccc', fontSize: 20, fontWeight: 700 }}>Management Console</div>
            {logged && (
              <div style={{ color: '#ff4444', fontSize: 11, marginTop: 10 }}>
                ⚠ Access attempt logged
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#666', fontSize: 11, letterSpacing: 2, display: 'block', marginBottom: 6 }}>
                USERNAME
              </label>
              <input
                type="text"
                defaultValue=""
                style={{
                  width: '100%', padding: '12px',
                  background: '#1a1a1a', border: '1px solid #333',
                  color: '#ccc', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#666', fontSize: 11, letterSpacing: 2, display: 'block', marginBottom: 6 }}>
                PASSWORD
              </label>
              <input
                type="password"
                style={{
                  width: '100%', padding: '12px',
                  background: '#1a1a1a', border: '1px solid #333',
                  color: '#ccc', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '13px',
                background: '#1a1a1a', border: '1px solid #444',
                color: '#999', fontSize: 13, cursor: 'pointer', letterSpacing: 2,
              }}
            >
              LOGIN
            </button>
          </form>

          <div style={{ marginTop: 20, fontSize: 10, color: '#333', textAlign: 'center' }}>
            NexCore Admin Panel v3.1.2 | Restricted Access
          </div>
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
    </>
  );
}
