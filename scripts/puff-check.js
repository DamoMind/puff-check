#!/usr/bin/env node
// PuffCheck - AQI to iMessage alerts
// Runs on macOS with Messages app

const { execSync } = require('child_process');
const https = require('https');

// Load config from environment
const CONFIG = {
  chatId: process.env.IMESSAGE_CHAT_ID || '',
  recipient: process.env.IMESSAGE_RECIPIENT || '',
  city: process.env.AQI_CITY || 'beijing',
  token: process.env.AQICN_TOKEN || '',
  threshold: parseInt(process.env.AQI_THRESHOLD || '100')
};

function fetchAqi() {
  return new Promise((resolve, reject) => {
    const url = `https://api.waqi.info/feed/${CONFIG.city}/?token=${CONFIG.token}`;
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok') {
            resolve({ aqi: json.data.aqi, pm25: json.data.iaqi.pm25?.v || json.data.aqi });
          } else reject(new Error('API error'));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sendImessage(msg) {
  const escaped = msg.replace(/"/g, '\\"');
  if (CONFIG.chatId) {
    execSync(`osascript -e 'tell application "Messages" to send "${escaped}" to chat id "${CONFIG.chatId}"'`);
  } else if (CONFIG.recipient) {
    execSync(`osascript -e 'tell application "Messages" to send "${escaped}" to buddy "${CONFIG.recipient}"'`);
  } else throw new Error('No recipient configured');
}

function getAdvice(aqi) {
  const base = ['😷 外出戴口罩', '🪟 关好门窗', '💨 开空气净化器'];
  const health = ['💧 多喝水，保持呼吸道湿润', '🍊 多吃水果蔬菜（梨、白萝卜、百合）', '🍵 可以喝点清肺茶（罗汉果、菊花）'];
  const severe = ['🏠 尽量待在室内', '🎽 避免剧烈运动', '👴 老人小孩特别注意'];
  if (aqi >= 200) return [...base, ...severe, ...health];
  if (aqi >= 150) return [...base, ...health];
  return [...base, health[0]];
}

async function run() {
  try {
    if (!CONFIG.token) { console.error('Error: AQICN_TOKEN not set'); process.exit(1); }
    const { aqi, pm25 } = await fetchAqi();
    console.log(`AQI: ${aqi}, PM2.5: ${pm25}`);
    if (aqi < CONFIG.threshold) { console.log('Below threshold, skip'); return; }
    const cigs = (pm25 / 22).toFixed(1);
    const title = aqi >= 200 ? '⚠️ 重度污染，少出门' : aqi >= 150 ? '🌫️ 空气不好' : '🌫️ 空气一般';
    const msg = `${title}\n\n${getAdvice(aqi).join('\n')}\n\n🚬 今天≈吸 ${cigs} 根烟\n\n- PM2.5: ${pm25} μg/m³`;
    sendImessage(msg);
    console.log('Sent!');
  } catch (e) { console.error('Error:', e.message); }
}

run();
