// pages/api/fake-login.js - Honeypot Login Handler

import { addLog } from '../../lib/storage';
import { detectAttack, getClientInfo, trackSession } from '../../lib/detector';
import { sendTelegramAlert } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientInfo = getClientInfo(req);
  const { username, password, mfa_token, session_id, fp_data } = req.body || {};

  // Track session for brute force detection
  const session = trackSession(clientInfo.ip, 'login');
  session.login = (session.login || 0) + 1;

  const isBruteForce = session.login > 3;

  // Detect attack patterns in credentials
  const attackCheck = detectAttack({
    input: `${username || ''} ${password || ''} ${mfa_token || ''}`,
    path: '/api/fake-login',
    userAgent: clientInfo.userAgent,
    method: req.method,
  });

  // Get geo data
  let geoData = {};
  try {
    const token = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : '';
    const geoRes = await fetch(`https://ipinfo.io/${clientInfo.ip}/json${token}`);
    if (geoRes.ok) {
      const geo = await geoRes.json();
      geoData = {
        country: geo.country || 'Unknown',
        city: geo.city || 'Unknown',
        isp: geo.org || 'Unknown',
        location: `${geo.city || ''}, ${geo.country || ''}`.trim(),
        timezone: geo.timezone || 'Unknown',
        coordinates: geo.loc || '',
      };
    }
  } catch (e) {
    geoData = { country: 'Unknown', city: 'Unknown', isp: 'Unknown', location: 'Unknown' };
  }

  // Determine threat level
  let threatLevel = 'MEDIUM';
  let attackType = 'LOGIN_ATTEMPT';

  if (attackCheck?.detected) {
    threatLevel = attackCheck.primary.level;
    attackType = attackCheck.primary.type;
  } else if (isBruteForce) {
    threatLevel = 'HIGH';
    attackType = 'BRUTE_FORCE';
  }

  const logEntry = {
    ip: clientInfo.ip,
    ...geoData,
    browser: clientInfo.userAgent.substring(0, 200),
    page: '/login',
    is_attack: true,
    attack_type: attackType,
    threat_level: threatLevel,
    payload: `Username: ${username || 'N/A'} | Password: ${password ? '*'.repeat(password.length) : 'N/A'} | MFA: ${mfa_token || 'N/A'}`,
    attempts: session.login,
    session_id: session_id,
    is_brute_force: isBruteForce,
    attack_details: attackCheck?.all || [{ type: 'LOGIN_ATTEMPT', detail: 'Login attempt on honeypot' }],
  };

  addLog(logEntry);

  // Always send Telegram alert for login attempts
  sendTelegramAlert({
    ...logEntry,
    attack_type: attackType,
    payload: logEntry.payload,
  }).catch(console.error);

  // Simulate a delay to frustrate automated tools
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Return fake error to keep them trying
  const errorMessages = [
    'Invalid credentials. Account may be locked after 3 more attempts.',
    'Authentication failed. Security team has been notified.',
    'Invalid username or password. This incident has been logged.',
    'Access denied. Multi-factor authentication required.',
    'Session expired. Please try again. [Error: AUTH_FAIL_0x4E2]',
  ];

  const errorIdx = Math.min(session.login - 1, errorMessages.length - 1);

  return res.status(401).json({
    success: false,
    error: errorMessages[errorIdx],
    requires_mfa: session.login > 1,
    lockout_remaining: Math.max(0, 5 - session.login),
    trace_id: `TRC-${Date.now()}`,
  });
}
