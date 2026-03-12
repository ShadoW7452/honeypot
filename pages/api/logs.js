// pages/api/logs.js - Protected Logs API

import { getLogs, getStats } from '../../lib/storage';

export default function handler(req, res) {
  const secret = req.headers['x-monitor-key'] || req.query.key;

  if (secret !== process.env.LOG_SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { limit = 100, attack_only, ip, threat_level } = req.query;

  if (req.query.stats === 'true') {
    return res.status(200).json({ stats: getStats() });
  }

  const logs = getLogs(parseInt(limit), {
    attack_only: attack_only === 'true',
    ip,
    threat_level,
  });

  return res.status(200).json({ logs, count: logs.length });
}
