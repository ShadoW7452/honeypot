# 🍯 NexCore Honeypot — Enterprise Security Intelligence Platform

> **Advanced honeypot system disguised as a premium enterprise banking portal. Attracts, fingerprints, and logs attackers with real-time Telegram alerts.**

![Threat Level](https://img.shields.io/badge/Security-Enterprise%20Grade-red)
![Platform](https://img.shields.io/badge/Platform-Vercel-black)
![Stack](https://img.shields.io/badge/Stack-Next.js%2014-blue)

---

## 🎯 Features

### 🕵️ Honeypot Capabilities
- **Fake Enterprise Banking Portal** — Convincing NexCore Global financial system that attracts hackers
- **Hidden Honeytokens** — Fake API keys, credentials in HTML source comments
- **Honeypot Paths** — /wp-admin, /.env, /phpmyadmin redirect to traps
- **Robots.txt Lure** — Disallowed paths listed to attract scanners
- **MFA Simulation** — Fake two-factor auth to frustrate and study attackers

### 🔍 Fingerprinting & Intelligence
- **IP Geolocation** — Country, city, ISP, ASN, coordinates via IPInfo
- **Browser Fingerprint** — Canvas hash, WebGL renderer/vendor
- **Device Profiling** — OS, browser, screen resolution, CPU cores, RAM, GPU
- **Network Info** — Connection type, speed
- **Battery Status** — Device battery level
- **Behavioral Tracking** — Mouse movements, keystrokes, scroll depth, form interactions

### 🚨 Attack Detection Engine
Detects patterns for:
- `SQL Injection` — 20+ signature patterns
- `XSS` — Cross-site scripting attempts
- `Path Traversal` — Directory traversal attacks
- `Command Injection` — OS command injection
- `Scanner Detection` — SQLMap, Nikto, Nmap, Burp Suite, etc.
- `Brute Force` — Multiple login attempts
- `Honeypot Access` — Access to trap paths

### 📱 Real-Time Alerts
- **Telegram Bot** — Instant alerts with full attacker profile
- **Google Analytics** — Event tracking for all suspicious activities
- **Alert Overlay** — Dramatic in-browser alert showing attacker's data

### 📊 Monitor Dashboard (`/monitor`)
- Real-time log table with filtering
- Attack type breakdown charts
- Detailed log inspection panel
- Statistics: total visits, attacks, unique IPs
- Auto-refresh every 10 seconds

---

## 🚀 Quick Setup

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/nexcore-honeypot.git
cd nexcore-honeypot
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
MONITOR_PASSWORD=YourSecurePassword123!
IPINFO_TOKEN=your_ipinfo_token
LOG_SECRET_KEY=your_random_secret_key
```

### 3. Set Up Telegram Bot

1. Open Telegram, message `@BotFather`
2. Send `/newbot` and follow prompts
3. Copy the **bot token** → `TELEGRAM_BOT_TOKEN`
4. Start your bot, then get your chat ID:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
5. Copy `chat.id` → `TELEGRAM_CHAT_ID`

### 4. Set Up Google Analytics

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create new GA4 property
3. Copy **Measurement ID** (G-XXXXXXXXXX) → `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 5. Get IPInfo Token (Optional but recommended)

1. Sign up at [ipinfo.io](https://ipinfo.io)
2. Free tier: 50,000 requests/month
3. Copy token → `IPINFO_TOKEN`

### 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID
vercel env add MONITOR_PASSWORD
vercel env add IPINFO_TOKEN
vercel env add LOG_SECRET_KEY
```

Or deploy via Vercel Dashboard → Import from GitHub.

---

## 📖 How It Works

### Attack Flow

```
Hacker visits site
        ↓
Browser fingerprint collected silently (IP, device, location, canvas, WebGL)
        ↓
Hacker attempts login
        ↓
Attack patterns detected (SQLi, XSS, brute force, etc.)
        ↓
Full profile sent to Telegram immediately
        ↓
Alert overlay displayed to attacker showing their own data
        ↓
All activity logged to /monitor dashboard
```

### Pages

| Page | Purpose |
|------|---------|
| `/` | Main honeypot — fake enterprise banking login |
| `/admin` | Fake admin panel trap |
| `/monitor` | **Secret** real monitoring dashboard (you) |
| `/api/fp` | Fingerprint collection endpoint |
| `/api/fake-login` | Fake login handler (logs + alerts) |
| `/api/logs` | Protected logs API for dashboard |

### Monitor Dashboard

Access at: `https://your-site.vercel.app/monitor`

Use the `LOG_SECRET_KEY` value as the monitor password.

---

## 🔧 Configuration

### Custom Honeytokens

Add fake credentials in `pages/index.js` HTML comments to attract manual hackers:

```html
<!-- 
  DB_HOST=prod-nexcore-db.internal
  DB_PASS=NexCore@Prod#2024!
  ADMIN: admin / N3xC0r3!2024
-->
```

### Custom Honeypot Paths

Add paths in `next.config.js` rewrites and `lib/detector.js`:

```js
{ source: '/config.php', destination: '/admin' },
{ source: '/.htaccess', destination: '/admin' },
```

---

## ⚠️ Legal & Ethical Notice

This honeypot is designed for:
- ✅ Security research on your own infrastructure
- ✅ Detecting unauthorized access attempts
- ✅ Gathering threat intelligence
- ✅ Training and awareness

**Ensure you comply with applicable laws in your jurisdiction regarding data collection and monitoring.**

---

## 📊 Sample Telegram Alert

```
🔴 NEXCORE HONEYPOT ALERT 🔴
━━━━━━━━━━━━━━━━━━━━━━━━

🎯 THREAT LEVEL: CRITICAL
⚡ ATTACK TYPE: SQL_INJECTION
🕐 TIME: 12/01/2024, 03:42:17

👤 ATTACKER PROFILE
━━━━━━━━━━━━━━━━━━━━
🌐 IP Address: 185.x.x.x
📍 Location: Amsterdam, Netherlands
🏢 ISP/Org: AS20473 Choopa LLC
🗺️ Country: NL
🏙️ City: Amsterdam

💻 DEVICE INFO
━━━━━━━━━━━━━━━━
📱 Device: Desktop
🖥️ OS: Linux x86_64
🌐 Browser: Chrome 120.0
📐 Screen: 1920x1080

🔍 ATTACK DETAILS
━━━━━━━━━━━━━━━━━━
📝 Payload: admin' OR 1=1--
Case ID: #HC-1704038537123
```

---

## 🛡️ Built With

- **Next.js 14** — React framework
- **Vercel** — Serverless deployment
- **IPInfo.io** — IP geolocation
- **Telegram Bot API** — Real-time alerts
- **Google Analytics 4** — Event tracking
- **Web APIs** — Canvas, WebGL, Battery, Network fingerprinting

---

*NexCore Honeypot — Know your enemies before they know you.* 🍯
# honeypot
