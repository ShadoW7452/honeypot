// pages/api/fp.js - Client Fingerprinting & Geolocation API

import { addLog } from '../../lib/storage';
import { detectAttack, getClientInfo, trackSession } from '../../lib/detector';
import { sendTelegramAlert } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientInfo = getClientInfo(req);
  const body = req.body || {};

  // Get geolocation from IP
  let geoData = {};
  try {
    if (clientInfo.ip && clientInfo.ip !== '127.0.0.1' && clientInfo.ip !== '::1') {
      const token = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : '';
      const geoRes = await fetch(`https://ipinfo.io/${clientInfo.ip}/json${token}`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        geoData = {
          country: geo.country || 'Unknown',
          city: geo.city || 'Unknown',
          region: geo.region || 'Unknown',
          isp: geo.org || 'Unknown',
          location: `${geo.city || ''}, ${geo.country || ''}`.trim(),
          coordinates: geo.loc || '',
          timezone: geo.timezone || '',
          postal: geo.postal || '',
          hostname: geo.hostname || '',
        };
      }
    } else {
      geoData = { country: 'Local', city: 'Localhost', isp: 'Local Network', location: 'Localhost' };
    }
  } catch (e) {
    geoData = { country: 'Unknown', city: 'Unknown', isp: 'Unknown', location: 'Unknown' };
  }

  // Parse User Agent
  let browserInfo = {};
  try {
    const ua = clientInfo.userAgent;
    // Simple UA parsing without library on serverless
    const isBot = /bot|crawler|spider|scraper|curl|wget|python|go-http|libwww/i.test(ua);
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident|OPR)[\s/]([^\s;)]+)/i);
    const os = ua.match(/(Windows NT \d+\.\d+|Mac OS X [^ );]+|Linux|Android \d+|iOS \d+|iPhone|iPad)/i);
    const mobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);

    browserInfo = {
      browser: browser ? `${browser[1]} ${browser[2]}` : 'Unknown',
      os: os ? os[1] : 'Unknown',
      device: mobile ? 'Mobile' : 'Desktop',
      is_bot: isBot,
      raw_ua: ua.substring(0, 300),
    };
  } catch (e) {
    browserInfo = { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  }

  // Track session
  const session = trackSession(clientInfo.ip, 'visit');

  // Detect attacks from the fingerprint payload
  const attackCheck = detectAttack({
    input: JSON.stringify(body),
    path: body.page || '/',
    userAgent: clientInfo.userAgent,
    method: req.method,
  });

  const isSuspicious =
    browserInfo.is_bot ||
    session.visit > 20 ||
    attackCheck?.detected ||
    body.attack_detected ||
    body.suspicious;

  const threatLevel = attackCheck?.primary?.level || (isSuspicious ? 'MEDIUM' : 'INFO');

  const logEntry = {
    ip: clientInfo.ip,
    ...geoData,
    ...browserInfo,
    screen: body.screen || 'Unknown',
    color_depth: body.color_depth,
    timezone_client: body.timezone,
    language: body.language,
    do_not_track: body.do_not_track,
    cookies_enabled: body.cookies_enabled,
    canvas_hash: body.canvas_hash,
    webgl_renderer: body.webgl_renderer,
    webgl_vendor: body.webgl_vendor,
    fonts: body.fonts,
    battery: body.battery,
    connection: body.connection,
    platform: body.platform,
    plugins_count: body.plugins_count,
    touch_points: body.touch_points,
    hardware_concurrency: body.hardware_concurrency,
    device_memory: body.device_memory,
    page: body.page || '/',
    referrer: body.referrer || clientInfo.referer,
    session_id: body.session_id,
    is_attack: attackCheck?.detected || false,
    attack_type: attackCheck?.primary?.type || null,
    attack_details: attackCheck?.all || [],
    threat_level: threatLevel,
    is_suspicious: isSuspicious,
    attempts: session.visit,
    mouse_movements: body.mouse_movements || 0,
    keystrokes: body.keystrokes || 0,
    time_on_page: body.time_on_page || 0,
    scroll_depth: body.scroll_depth || 0,
    form_interactions: body.form_interactions || [],
    payload: body.payload || null,
  };

  const savedLog = addLog(logEntry);

  // Send Telegram alert for suspicious/attack activity
  if (isSuspicious || attackCheck?.detected) {
    sendTelegramAlert({
      ...logEntry,
      threat_level: threatLevel,
      attack_type: attackCheck?.primary?.type || 'SUSPICIOUS_ACTIVITY',
      payload: body.payload || JSON.stringify(body).substring(0, 200),
    }).catch(console.error);
  }

  // Return attacker data to show in the alert overlay
  return res.status(200).json({
    logged: true,
    case_id: savedLog.id,
    attacker_data: {
      ip: clientInfo.ip,
      location: geoData.location,
      city: geoData.city,
      country: geoData.country,
      isp: geoData.isp,
      coordinates: geoData.coordinates,
      timezone: geoData.timezone || body.timezone || 'Unknown',
      browser: browserInfo.browser,
      os: browserInfo.os,
      device: browserInfo.device,
      screen: body.screen,
      language: body.language,
      platform: body.platform,
      hardware_concurrency: body.hardware_concurrency,
      device_memory: body.device_memory,
      canvas_hash: body.canvas_hash,
      webgl_renderer: body.webgl_renderer,
      is_bot: browserInfo.is_bot,
      threat_level: threatLevel,
      attempts: session.visit,
    },
  });
}
