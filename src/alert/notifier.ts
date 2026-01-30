import { Env, ALERT_CONFIG } from '../config';
import { fetchAqi, AqiData } from '../aqi/fetcher';
import { getLevelByAqi, AqiLevel } from '../aqi/levels';

// PM2.5 浓度转形象描述
// 参考: Berkeley Earth 研究 - 每 22 μg/m³ ≈ 1 根烟/天
function getPm25Description(pm25: number | null): string {
  if (pm25 === null) return '';
  
  // 每天呼吸约 15000 升空气，换算成立方米约 15m³
  // pm25 单位是 μg/m³，一天吸入 = pm25 * 15 微克
  const dailyIntake = Math.round(pm25 * 15 / 1000 * 10) / 10; // 毫克
  
  // 香烟比喻 (22 μg/m³ ≈ 1根烟)
  const cigarettes = Math.round(pm25 / 22 * 10) / 10;
  
  if (cigarettes < 1) {
    return `PM2.5 ${pm25} μg/m³`;
  } else if (cigarettes < 3) {
    return `一天下来相当于吸 ${cigarettes} 根烟 🚬`;
  } else if (cigarettes < 10) {
    return `一天相当于吸 ${Math.round(cigarettes)} 根烟 🚬🚬`;
  } else {
    return `一天相当于吸 ${Math.round(cigarettes)} 根烟！🚬🚬🚬`;
  }
}

interface AlertState {
  lastAlertLevel: AqiLevel | null;
  lastAlertTime: number;
  lastAqi: number;
}

const ALERT_STATE_KEY = 'alert:state';

// 获取行动建议（根据等级）
function getActionAdvice(level: AqiLevel): string[] {
  const advice: Record<AqiLevel, string[]> = {
    good: [],
    moderate: [],
    unhealthy_sensitive: [
      '😷 敏感人群外出戴口罩',
      '💨 可以开空气净化器',
    ],
    unhealthy: [
      '😷 外出记得戴口罩',
      '🪟 关好门窗',
      '💨 开空气净化器',
    ],
    very_unhealthy: [
      '🚫 尽量别出门',
      '😷 必须出门戴好口罩',
      '🪟 门窗关紧',
      '💨 空气净化器开起来',
    ],
    hazardous: [
      '⚠️ 严重污染！别出门',
      '😷 必须外出戴专业口罩',
      '🪟 门窗紧闭',
      '💨 净化器开最大档',
    ],
  };
  return advice[level] || [];
}

// 获取等级对应的标题
function getLevelTitle(level: AqiLevel): string {
  const titles: Record<AqiLevel, string> = {
    good: '空气不错 ✨',
    moderate: '空气还行',
    unhealthy_sensitive: '空气一般，注意防护 🌫️',
    unhealthy: '空气不好，注意防护 🌫️',
    very_unhealthy: '重度污染，少出门 ⚠️',
    hazardous: '严重污染！待在家里 🚨',
  };
  return titles[level];
}

// 发送 ServerChan 微信通知
async function sendWeChatNotification(
  sendKey: string,
  title: string,
  content: string
): Promise<boolean> {
  try {
    const apiUrl = `https://sctapi.ftqq.com/${sendKey}.send`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        title,
        desp: content,
      }),
    });

    const text = await response.text();
    console.log('ServerChan response:', text);
    
    const result = JSON.parse(text) as { code: number; message: string };
    if (result.code !== 0) {
      console.error('ServerChan error:', result.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send WeChat notification:', error);
    return false;
  }
}

// 检查是否需要发送告警
async function shouldSendAlert(
  env: Env,
  currentLevel: AqiLevel,
  currentAqi: number
): Promise<boolean> {
  // 空气好的时候不推送
  if (currentLevel === 'good' || currentLevel === 'moderate') {
    return false;
  }

  // AQI 未达到阈值
  if (currentAqi < ALERT_CONFIG.threshold) {
    return false;
  }

  // 获取上次告警状态
  const stateRaw = await env.CACHE.get(ALERT_STATE_KEY);
  if (!stateRaw) {
    return true; // 从未告警过
  }

  const state: AlertState = JSON.parse(stateRaw);
  const now = Date.now();
  const hoursSinceLastAlert = (now - state.lastAlertTime) / (1000 * 60 * 60);

  // 等级恶化时立即告警
  const levelOrder: AqiLevel[] = ['good', 'moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'];
  const currentLevelIndex = levelOrder.indexOf(currentLevel);
  const lastLevelIndex = state.lastAlertLevel ? levelOrder.indexOf(state.lastAlertLevel) : -1;

  if (currentLevelIndex > lastLevelIndex) {
    return true; // 污染加重
  }

  // 冷却时间内不重复推送同一等级
  if (hoursSinceLastAlert < ALERT_CONFIG.cooldownHours) {
    return false;
  }

  return true;
}

// 更新告警状态
async function updateAlertState(
  env: Env,
  level: AqiLevel,
  aqi: number
): Promise<void> {
  const state: AlertState = {
    lastAlertLevel: level,
    lastAlertTime: Date.now(),
    lastAqi: aqi,
  };
  await env.CACHE.put(ALERT_STATE_KEY, JSON.stringify(state), {
    expirationTtl: 86400 * 7, // 保留 7 天
  });
}

// 主检查函数
export async function checkAndAlert(env: Env): Promise<string> {
  try {
    // 获取 AQI 数据
    const data = await fetchAqi(ALERT_CONFIG.city, env.AQICN_TOKEN);
    const levelInfo = getLevelByAqi(data.aqi);

    console.log(`AQI Check: ${data.aqi} (${levelInfo.label})`);

    // 判断是否需要告警
    if (!await shouldSendAlert(env, levelInfo.level, data.aqi)) {
      return `OK: AQI ${data.aqi} (${levelInfo.label}) - no alert needed`;
    }

    // 构建消息
    const title = getLevelTitle(levelInfo.level);
    const advice = getActionAdvice(levelInfo.level);
    const pm25Desc = getPm25Description(data.pm25);
    
    let content = advice.join('\n\n');
    if (pm25Desc) {
      content += `\n\n---\n\n${pm25Desc}`;
    }

    // 发送通知
    const sent = await sendWeChatNotification(env.SERVERCHAN_SENDKEY, title, content);

    if (sent) {
      await updateAlertState(env, levelInfo.level, data.aqi);
      return `ALERT SENT: AQI ${data.aqi} (${levelInfo.label})`;
    } else {
      return `ALERT FAILED: AQI ${data.aqi} (${levelInfo.label})`;
    }
  } catch (error) {
    console.error('Alert check failed:', error);
    return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
