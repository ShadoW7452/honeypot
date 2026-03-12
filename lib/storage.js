// lib/storage.js - In-memory log storage (replace with Vercel KV for production)

// Global in-memory store (persists between requests in same serverless instance)
const globalStore = globalThis.__nexcore_store || {
  logs: [],
  stats: {
    total_visits: 0,
    total_attacks: 0,
    unique_ips: new Set(),
    attack_types: {},
    countries: {},
    hourly: {},
  },
};

globalThis.__nexcore_store = globalStore;

export function addLog(entry) {
  const log = {
    id: `HC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Keep last 500 logs in memory
  globalStore.logs.unshift(log);
  if (globalStore.logs.length > 500) {
    globalStore.logs = globalStore.logs.slice(0, 500);
  }

  // Update stats
  globalStore.stats.total_visits++;
  if (entry.ip) globalStore.stats.unique_ips.add(entry.ip);
  if (entry.is_attack) globalStore.stats.total_attacks++;
  if (entry.attack_type) {
    globalStore.stats.attack_types[entry.attack_type] =
      (globalStore.stats.attack_types[entry.attack_type] || 0) + 1;
  }
  if (entry.country) {
    globalStore.stats.countries[entry.country] =
      (globalStore.stats.countries[entry.country] || 0) + 1;
  }

  const hour = new Date().toISOString().substring(0, 13);
  globalStore.stats.hourly[hour] = (globalStore.stats.hourly[hour] || 0) + 1;

  return log;
}

export function getLogs(limit = 100, filter = {}) {
  let logs = [...globalStore.logs];

  if (filter.attack_only) {
    logs = logs.filter((l) => l.is_attack);
  }
  if (filter.ip) {
    logs = logs.filter((l) => l.ip === filter.ip);
  }
  if (filter.threat_level) {
    logs = logs.filter((l) => l.threat_level === filter.threat_level);
  }

  return logs.slice(0, limit);
}

export function getStats() {
  const stats = globalStore.stats;
  const topAttack = Object.entries(stats.attack_types).sort((a, b) => b[1] - a[1])[0];
  const topCountry = Object.entries(stats.countries).sort((a, b) => b[1] - a[1])[0];

  return {
    total_visits: stats.total_visits,
    total_attacks: stats.total_attacks,
    unique_ips: stats.unique_ips.size,
    attack_types: stats.attack_types,
    countries: stats.countries,
    top_attack: topAttack ? topAttack[0] : 'None',
    top_country: topCountry ? topCountry[0] : 'None',
    hourly: stats.hourly,
  };
}
