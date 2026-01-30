export type AqiLevel = 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface LevelInfo {
  level: AqiLevel;
  label: string;
  labelEn: string;
  emoji: string;
  minAqi: number;
  maxAqi: number;
  healthImpact: string;
  advice: string[];
}

export const AQI_LEVELS: LevelInfo[] = [
  {
    level: 'good',
    label: '优',
    labelEn: 'Good',
    emoji: '🟢',
    minAqi: 0,
    maxAqi: 50,
    healthImpact: '空气质量令人满意，基本无空气污染',
    advice: ['适合户外活动'],
  },
  {
    level: 'moderate',
    label: '良',
    labelEn: 'Moderate',
    emoji: '🟡',
    minAqi: 51,
    maxAqi: 100,
    healthImpact: '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响',
    advice: ['极少数敏感人群应减少户外活动'],
  },
  {
    level: 'unhealthy_sensitive',
    label: '轻度污染',
    labelEn: 'Unhealthy for Sensitive Groups',
    emoji: '🟠',
    minAqi: 101,
    maxAqi: 150,
    healthImpact: '易感人群症状有轻度加剧，健康人群出现刺激症状',
    advice: [
      '儿童、老年人及心脏病、呼吸系统疾病患者应减少长时间、高强度的户外锻炼',
      '一般人群适量减少户外运动',
    ],
  },
  {
    level: 'unhealthy',
    label: '中度污染',
    labelEn: 'Unhealthy',
    emoji: '🔴',
    minAqi: 151,
    maxAqi: 200,
    healthImpact: '可能引起呼吸道不适、咳嗽，免疫力较弱者容易感冒',
    advice: [
      '外出请佩戴 N95/KN95 口罩',
      '室内开启空气净化器',
      '减少户外运动时间',
      '老人、儿童、呼吸道疾病患者尽量留在室内',
    ],
  },
  {
    level: 'very_unhealthy',
    label: '重度污染',
    labelEn: 'Very Unhealthy',
    emoji: '🟣',
    minAqi: 201,
    maxAqi: 300,
    healthImpact: '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状',
    advice: [
      '避免户外活动',
      '必须外出请佩戴专业防霾口罩',
      '保持室内门窗紧闭',
      '持续开启空气净化器',
      '多饮水，清淡饮食',
    ],
  },
  {
    level: 'hazardous',
    label: '严重污染',
    labelEn: 'Hazardous',
    emoji: '⚫',
    minAqi: 301,
    maxAqi: 999,
    healthImpact: '健康人群运动耐受力降低，有明显强烈症状，提前出现某些疾病',
    advice: [
      '停止一切户外活动',
      '尽量留在室内',
      '如有不适及时就医',
      '持续开启空气净化器至最高档',
      '如必须外出，佩戴专业防霾口罩并缩短在外时间',
    ],
  },
];

export function getLevelByAqi(aqi: number): LevelInfo {
  for (const level of AQI_LEVELS) {
    if (aqi >= level.minAqi && aqi <= level.maxAqi) {
      return level;
    }
  }
  // Default to hazardous for extreme values
  return AQI_LEVELS[AQI_LEVELS.length - 1];
}

export function shouldAlert(aqi: number, threshold: number): boolean {
  return aqi >= threshold;
}
