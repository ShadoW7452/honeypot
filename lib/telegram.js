// lib/telegram.js - Telegram Bot Alert System

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramAlert(data) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('[Telegram] Bot not configured, skipping alert');
    return;
  }

  const threatEmoji = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢',
    INFO: '🔵',
  };

  const emoji = threatEmoji[data.threat_level] || '⚠️';
  const timestamp = new Date().toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });

  const message = `
${emoji} *NEXCORE HONEYPOT ALERT* ${emoji}
━━━━━━━━━━━━━━━━━━━━━━━━

🎯 *THREAT LEVEL:* \`${data.threat_level || 'UNKNOWN'}\`
⚡ *ATTACK TYPE:* \`${data.attack_type || 'INTRUSION ATTEMPT'}\`
🕐 *TIME:* \`${timestamp}\`
📍 *PAGE:* \`${data.page || '/'}\`

👤 *ATTACKER PROFILE*
━━━━━━━━━━━━━━━━━━━━
🌐 *IP Address:* \`${data.ip || 'Unknown'}\`
📍 *Location:* \`${data.location || 'Unknown'}\`
🏢 *ISP/Org:* \`${data.isp || 'Unknown'}\`
🗺️ *Country:* \`${data.country || 'Unknown'}\`
🏙️ *City:* \`${data.city || 'Unknown'}\`

💻 *DEVICE INFO*
━━━━━━━━━━━━━━━━
📱 *Device:* \`${data.device || 'Unknown'}\`
🖥️ *OS:* \`${data.os || 'Unknown'}\`
🌐 *Browser:* \`${data.browser || 'Unknown'}\`
📐 *Screen:* \`${data.screen || 'Unknown'}\`
🕐 *Timezone:* \`${data.timezone || 'Unknown'}\`

🔍 *ATTACK DETAILS*
━━━━━━━━━━━━━━━━━━
📝 *Payload:* \`${(data.payload || 'N/A').substring(0, 200)}\`
🔗 *Referrer:* \`${data.referrer || 'Direct'}\`
📌 *Session ID:* \`${data.session_id || 'N/A'}\`

${data.attempts > 1 ? `⚠️ *ATTEMPTS:* \`${data.attempts} tries detected\`` : ''}

📸 *Screenshot: CAPTURED*
📹 *Session Recording: ACTIVE*
🔒 *Identity: LOGGED*

*Case ID:* \`#HC-${Date.now()}\`
━━━━━━━━━━━━━━━━━━━━━━━━
_NexCore Honeypot Security System_
`;

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('[Telegram] Failed to send:', result);
    } else {
      console.log('[Telegram] Alert sent successfully');
    }
    return result;
  } catch (err) {
    console.error('[Telegram] Error:', err.message);
  }
}

export async function sendTelegramPhoto(photoUrl, caption) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  try {
    await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        photo: photoUrl,
        caption: caption || '📸 Attacker Screenshot Captured',
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('[Telegram] Photo error:', err.message);
  }
}

export async function sendTelegramSummary(stats) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  const message = `
📊 *NEXCORE DAILY SUMMARY*
━━━━━━━━━━━━━━━━━━━━━━━━
📈 *Total Visits:* \`${stats.total_visits}\`
🚨 *Attacks Detected:* \`${stats.attacks}\`
🌍 *Unique IPs:* \`${stats.unique_ips}\`
🔝 *Top Attack Type:* \`${stats.top_attack}\`
🌐 *Top Country:* \`${stats.top_country}\`
━━━━━━━━━━━━━━━━━━━━━━━━
_Generated: ${new Date().toISOString()}_
`;

  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('[Telegram] Summary error:', err.message);
  }
}
