// lib/detector.js - Attack Pattern Detection Engine

export const ATTACK_SIGNATURES = {
  SQL_INJECTION: {
    level: 'CRITICAL',
    patterns: [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i,
      /select.*from/i,
      /insert.*into/i,
      /delete.*from/i,
      /drop.*table/i,
      /update.*set/i,
      /exec(\s|\+)+(s|x)p\w+/i,
      /UNION(\s+ALL)?\s+SELECT/i,
      /OR\s+1\s*=\s*1/i,
      /AND\s+1\s*=\s*1/i,
      /benchmark\(/i,
      /sleep\(\d+\)/i,
      /waitfor\s+delay/i,
      /information_schema/i,
      /sys\.tables/i,
    ],
  },
  XSS: {
    level: 'HIGH',
    patterns: [
      /<script[^>]*>.*?<\/script>/is,
      /javascript\s*:/i,
      /on\w+\s*=\s*["']/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /document\.cookie/i,
      /document\.write/i,
      /window\.location/i,
      /eval\s*\(/i,
      /alert\s*\(/i,
      /confirm\s*\(/i,
      /prompt\s*\(/i,
      /<img[^>]+onerror/i,
      /vbscript\s*:/i,
      /expression\s*\(/i,
    ],
  },
  PATH_TRAVERSAL: {
    level: 'HIGH',
    patterns: [
      /\.\.\//g,
      /\.\.\\/g,
      /\/etc\/passwd/i,
      /\/etc\/shadow/i,
      /\/proc\/self/i,
      /\/windows\/system32/i,
      /\/boot\.ini/i,
      /\/var\/log/i,
      /%2e%2e%2f/i,
      /%252e%252e%252f/i,
      /\.\.%2f/i,
      /\.\.%5c/i,
    ],
  },
  COMMAND_INJECTION: {
    level: 'CRITICAL',
    patterns: [
      /[;&|`$]/,
      /\|\s*\w+/,
      /;\s*\w+/,
      /`[^`]+`/,
      /\$\([^)]+\)/,
      /\|\|/,
      /&&/,
      /nc\s+-[el]/i,
      /ncat\s/i,
      /bash\s+-i/i,
      /\/bin\/sh/i,
      /\/bin\/bash/i,
      /cmd\.exe/i,
      /powershell/i,
      /wget\s+http/i,
      /curl\s+http/i,
    ],
  },
  SCANNER: {
    level: 'MEDIUM',
    patterns: [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /openvas/i,
      /masscan/i,
      /nmap/i,
      /metasploit/i,
      /burpsuite/i,
      /acunetix/i,
      /appscan/i,
      /w3af/i,
      /arachni/i,
      /zaproxy/i,
      /owasp/i,
      /scanner/i,
      /python-requests/i,
      /go-http-client/i,
      /libwww-perl/i,
      /zgrab/i,
    ],
  },
  BRUTE_FORCE: {
    level: 'HIGH',
    patterns: [],
    custom: true,
  },
  HONEYPOT_ACCESS: {
    level: 'MEDIUM',
    patterns: [],
    paths: [
      '/wp-admin',
      '/wp-login.php',
      '/.env',
      '/backup',
      '/phpmyadmin',
      '/administrator',
      '/config',
      '/database',
      '/db',
      '/sql',
      '/shell',
      '/cmd',
      '/.git',
      '/admin.php',
      '/login.php',
      '/panel',
      '/cpanel',
    ],
  },
};

export function detectAttack(data) {
  const { input = '', path = '', userAgent = '', method = 'GET' } = data;
  const detections = [];

  // Check path against honeypot paths
  for (const honeypotPath of ATTACK_SIGNATURES.HONEYPOT_ACCESS.paths) {
    if (path.toLowerCase().includes(honeypotPath.toLowerCase())) {
      detections.push({
        type: 'HONEYPOT_ACCESS',
        level: 'MEDIUM',
        detail: `Accessed honeypot path: ${honeypotPath}`,
      });
    }
  }

  // Check input against attack signatures
  const checkInput = `${input} ${path} ${userAgent}`;

  for (const [attackType, config] of Object.entries(ATTACK_SIGNATURES)) {
    if (!config.patterns || config.patterns.length === 0) continue;
    for (const pattern of config.patterns) {
      if (pattern.test(checkInput)) {
        detections.push({
          type: attackType,
          level: config.level,
          detail: `Pattern matched: ${pattern.toString().substring(0, 50)}`,
        });
        break;
      }
    }
  }

  // Check user agent for scanners
  for (const pattern of ATTACK_SIGNATURES.SCANNER.patterns) {
    if (pattern.test(userAgent)) {
      detections.push({
        type: 'SCANNER',
        level: 'MEDIUM',
        detail: `Scanner detected in UA: ${userAgent.substring(0, 100)}`,
      });
      break;
    }
  }

  if (detections.length === 0) return null;

  // Return highest severity detection
  const levelOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
  detections.sort((a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0));

  return {
    detected: true,
    primary: detections[0],
    all: detections,
    score: detections.reduce((sum, d) => sum + (levelOrder[d.level] || 0), 0),
  };
}

export function getClientInfo(req) {
  const headers = req.headers;

  // Get real IP (handle proxies/Vercel)
  const ip =
    headers['x-real-ip'] ||
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    headers['cf-connecting-ip'] ||
    req.socket?.remoteAddress ||
    'Unknown';

  const userAgent = headers['user-agent'] || '';
  const referer = headers['referer'] || headers['referrer'] || '';
  const acceptLanguage = headers['accept-language'] || '';
  const acceptEncoding = headers['accept-encoding'] || '';

  return { ip, userAgent, referer, acceptLanguage, acceptEncoding, headers };
}

// In-memory session tracker for brute force detection
const sessionTracker = new Map();

export function trackSession(ip, action) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minute window

  if (!sessionTracker.has(ip)) {
    sessionTracker.set(ip, { actions: [], firstSeen: now, lastSeen: now });
  }

  const session = sessionTracker.get(ip);
  session.actions = session.actions.filter((t) => now - t < windowMs);
  session.actions.push(now);
  session.lastSeen = now;
  session[action] = (session[action] || 0) + 1;

  // Clean old sessions every 100 entries
  if (sessionTracker.size > 100) {
    for (const [key, val] of sessionTracker.entries()) {
      if (now - val.lastSeen > windowMs * 2) sessionTracker.delete(key);
    }
  }

  return session;
}
