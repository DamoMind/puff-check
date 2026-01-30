# 🌫️ PuffCheck

Real-time air quality monitoring with WeChat push alerts. Deployed on Cloudflare Workers.

**The highlight:** Instead of showing abstract AQI numbers, it tells you "breathing this air for a day equals smoking X cigarettes" - much easier to understand!

## ✨ Features

- 📊 **Real-time AQI** - Query air quality for cities worldwide
- 🎨 **AI Visualization** - Generate scene images based on pollution levels
- 📱 **WeChat Push** - Send alerts via ServerChan
- 🚬 **Intuitive Expression** - PM2.5 converted to cigarette equivalents
- ⏰ **Scheduled Checks** - Cron-triggered automatic monitoring

## 🚀 Deployment

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare Account](https://dash.cloudflare.com/)
- [AQICN API Token](https://aqicn.org/data-platform/token/)
- [ServerChan SendKey](https://sct.ftqq.com/) (optional, for WeChat push)

### Steps

1. **Clone the project**
   ```bash
   git clone https://github.com/DamoMind/puff-check.git
   cd puff-check
   npm install
   ```

2. **Create KV namespace**
   ```bash
   npx wrangler kv:namespace create CACHE
   ```
   Update the returned ID in `wrangler.toml`

3. **Configure Secrets**
   ```bash
   npx wrangler secret put AQICN_TOKEN
   npx wrangler secret put SERVERCHAN_SENDKEY  # optional
   ```

4. **Modify Configuration** (optional)
   
   Edit `src/config.ts` to change the monitored city and alert threshold:
   ```typescript
   export const ALERT_CONFIG = {
     city: 'beijing',      // city to monitor
     threshold: 100,       // AQI alert threshold
     cooldownHours: 0,     // cooldown between alerts
   };
   ```

5. **Deploy**
   ```bash
   npx wrangler deploy
   ```

## 📡 API

### Query AQI
```
GET /api/aqi?city=beijing
```

Response:
```json
{
  "city": "Beijing (北京)",
  "aqi": 85,
  "pm25": 85,
  "pm10": 42,
  "level": "moderate",
  "levelLabel": "良",
  "advice": ["Sensitive groups should reduce outdoor activities"]
}
```

### Generate Visualization
```
POST /api/generate-image
Content-Type: application/json

{"level": "unhealthy", "aqi": 160, "city": "Beijing"}
```

## ⏰ Scheduled Tasks

By default, checks run twice daily (8:00 AM and 6:00 PM Beijing time).

Customize the cron expression in `wrangler.toml`:
```toml
[triggers]
crons = ["0 0 * * *", "0 10 * * *"]  # UTC time
```

## 📱 WeChat Notification Format

```
Air quality alert 🌫️

😷 Wear a mask when going out
🪟 Keep windows closed
💨 Turn on air purifier

---
Breathing today = smoking 7 cigarettes 🚬🚬
```

## 🔬 The Science

The cigarette equivalent is based on [Berkeley Earth research](http://berkeleyearth.org/air-pollution-and-cigarette-equivalence/):
- Every 22 μg/m³ of PM2.5 ≈ smoking 1 cigarette per day
- PM2.5 160 μg/m³ → 160 ÷ 22 ≈ 7 cigarettes

## 🔧 Local Development

```bash
npm run dev
```

Visit http://localhost:8787

## 📱 iMessage Alerts (macOS)

For direct iMessage notifications without ServerChan, use the standalone script:

```bash
# Copy and configure
cp scripts/.env.example scripts/.env
# Edit scripts/.env with your settings

# Run manually
node scripts/puff-check.js

# Or add to crontab (8am and 6pm daily)
0 8,18 * * * cd /path/to/puff-check && node scripts/puff-check.js
```

**Environment variables:**
| Variable | Description |
|----------|-------------|
| `AQICN_TOKEN` | API token from aqicn.org |
| `AQI_CITY` | City to monitor (default: beijing) |
| `AQI_THRESHOLD` | Alert threshold (default: 100) |
| `IMESSAGE_CHAT_ID` | Group chat ID |
| `IMESSAGE_RECIPIENT` | Individual email/phone |

**Get chat ID:**
```bash
osascript -e 'tell application "Messages" to get id of every chat'
```

## 📄 License

Apache License 2.0
