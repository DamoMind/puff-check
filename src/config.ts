export interface Env {
  // KV namespace for caching
  CACHE: KVNamespace;

  // AQICN API token
  AQICN_TOKEN: string;

  // ServerChan SendKey for WeChat notifications
  SERVERCHAN_SENDKEY: string;

  // Cloudflare AI binding
  AI: Ai;

  // Static assets
  __STATIC_CONTENT: KVNamespace;
}

// Alert configuration
export const ALERT_CONFIG = {
  // 监控城市
  city: 'handan',
  // 告警阈值 (AQI >= 100 开始提醒)
  threshold: 100,
  // 冷却时间 (小时) - 每天2次推送，设为0让每次cron都发
  cooldownHours: 0,
};
