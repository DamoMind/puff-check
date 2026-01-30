# 🌫️ AQI Monitor

实时空气质量监测 + 微信推送告警，部署在 Cloudflare Workers 上。

## ✨ 功能

- 📊 **实时 AQI 查询** - 支持全球城市
- 🎨 **AI 生成可视化** - 根据污染等级生成场景图片
- 📱 **微信推送** - 通过 Server酱 发送告警
- 🚬 **直观表达** - "相当于吸几根烟" 比 AQI 数字更易懂
- ⏰ **定时检查** - Cron 触发，自动监控

## 🚀 部署

### 前置条件

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare 账号](https://dash.cloudflare.com/)
- [AQICN API Token](https://aqicn.org/data-platform/token/)
- [Server酱 SendKey](https://sct.ftqq.com/)（可选，用于微信推送）

### 步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/YOUR_USERNAME/aqi-monitor.git
   cd aqi-monitor
   npm install
   ```

2. **创建 KV 命名空间**
   ```bash
   npx wrangler kv:namespace create CACHE
   ```
   将返回的 ID 更新到 `wrangler.toml`

3. **配置 Secrets**
   ```bash
   npx wrangler secret put AQICN_TOKEN
   npx wrangler secret put SERVERCHAN_SENDKEY  # 可选
   ```

4. **修改配置**（可选）
   
   编辑 `src/config.ts` 修改监控城市和告警阈值：
   ```typescript
   export const ALERT_CONFIG = {
     city: 'beijing',      // 监控城市
     threshold: 100,       // AQI 告警阈值
     cooldownHours: 0,     // 冷却时间
   };
   ```

5. **部署**
   ```bash
   npx wrangler deploy
   ```

## 📡 API

### 查询 AQI
```
GET /api/aqi?city=beijing
```

响应：
```json
{
  "city": "Beijing (北京)",
  "aqi": 85,
  "pm25": 85,
  "pm10": 42,
  "level": "moderate",
  "levelLabel": "良",
  "advice": ["极少数敏感人群应减少户外活动"]
}
```

### 生成可视化图片
```
POST /api/generate-image
Content-Type: application/json

{"level": "unhealthy", "aqi": 160, "city": "Handan"}
```

## ⏰ 定时任务

默认每天早晚各检查一次（北京时间 8:00 和 18:00）。

修改 `wrangler.toml` 中的 cron 表达式自定义：
```toml
[triggers]
crons = ["0 0 * * *", "0 10 * * *"]  # UTC 时间
```

## 📱 微信通知格式

```
空气不好，注意防护 🌫️

😷 外出记得戴口罩
🪟 关好门窗
💨 开空气净化器

---
一天相当于吸 7 根烟 🚬🚬
```

## 🔧 本地开发

```bash
npm run dev
```

访问 http://localhost:8787

## 📄 License

MIT
