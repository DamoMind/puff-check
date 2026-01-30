# AQI Monitor 部署指南

## 项目简介

空气质量监测网站，支持：
- 实时 AQI 数据展示
- 6 级污染等级可视化
- AI 生成污染场景图片
- 健康防护建议

## 架构

```
┌─────────────────────────────────────────┐
│         Cloudflare Workers              │
│  ┌─────────────────────────────────┐   │
│  │     Static Site (HTML/CSS/JS)   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  /api/aqi   │  │ /api/generate-  │  │
│  │             │  │    image        │  │
│  └──────┬──────┘  └────────┬────────┘  │
│         │                  │           │
│         ▼                  ▼           │
│   ┌──────────┐      ┌────────────┐    │
│   │ AQICN    │      │ Cloudflare │    │
│   │ API      │      │ Workers AI │    │
│   └──────────┘      └────────────┘    │
└─────────────────────────────────────────┘
```

## 部署步骤

### 1. 安装依赖

```bash
cd /home/damo/projects/aqi-monitor
npm install
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

### 3. 创建 KV Namespace

```bash
npx wrangler kv:namespace create CACHE
```

复制输出的 `id`，更新 `wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "CACHE", id = "your-actual-kv-id" }
]
```

### 4. 配置环境变量

```bash
npx wrangler secret put AQICN_TOKEN
# 输入你的 AQICN API Token
```

### 5. 部署

```bash
npx wrangler deploy
```

### 6. 访问

部署完成后，访问：
```
https://aqi-monitor.YOUR_SUBDOMAIN.workers.dev
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/aqi?city=beijing` | GET | 获取指定城市 AQI 数据 |
| `/api/generate-image` | POST | AI 生成污染场景图片 |

## 支持的城市

- beijing (北京)
- shanghai (上海)
- guangzhou (广州)
- shenzhen (深圳)
- chengdu (成都)
- hangzhou (杭州)
- nanjing (南京)
- xian (西安)

更多城市请参考: https://aqicn.org/city/all/

## 费用

### Cloudflare Workers (免费套餐)
- 10 万次请求/天
- 足够个人使用

### Cloudflare Workers AI
- 免费额度: 每天 10,000 neurons
- Stable Diffusion 图片生成约消耗 10,000 neurons/张
- 超出后约 $0.01/张

## 本地开发

```bash
npm run dev
# 访问 http://localhost:8787
```

## 常见问题

### Q: AI 图片生成失败？

可能原因：
1. Workers AI 免费额度用尽
2. 模型响应超时

解决：使用预生成的 SVG 占位图

### Q: AQI 数据获取失败？

检查：
1. AQICN_TOKEN 是否正确配置
2. 城市名称是否正确
