import { describe, it, expect } from 'vitest';
import { getLevelByAqi, shouldAlert, AQI_LEVELS } from './levels';

describe('getLevelByAqi', () => {
  it('returns "good" for AQI 0-50', () => {
    expect(getLevelByAqi(0).level).toBe('good');
    expect(getLevelByAqi(25).level).toBe('good');
    expect(getLevelByAqi(50).level).toBe('good');
  });

  it('returns "moderate" for AQI 51-100', () => {
    expect(getLevelByAqi(51).level).toBe('moderate');
    expect(getLevelByAqi(75).level).toBe('moderate');
    expect(getLevelByAqi(100).level).toBe('moderate');
  });

  it('returns "unhealthy_sensitive" for AQI 101-150', () => {
    expect(getLevelByAqi(101).level).toBe('unhealthy_sensitive');
    expect(getLevelByAqi(125).level).toBe('unhealthy_sensitive');
    expect(getLevelByAqi(150).level).toBe('unhealthy_sensitive');
  });

  it('returns "unhealthy" for AQI 151-200', () => {
    expect(getLevelByAqi(151).level).toBe('unhealthy');
    expect(getLevelByAqi(175).level).toBe('unhealthy');
    expect(getLevelByAqi(200).level).toBe('unhealthy');
  });

  it('returns "very_unhealthy" for AQI 201-300', () => {
    expect(getLevelByAqi(201).level).toBe('very_unhealthy');
    expect(getLevelByAqi(250).level).toBe('very_unhealthy');
    expect(getLevelByAqi(300).level).toBe('very_unhealthy');
  });

  it('returns "hazardous" for AQI > 300', () => {
    expect(getLevelByAqi(301).level).toBe('hazardous');
    expect(getLevelByAqi(500).level).toBe('hazardous');
    expect(getLevelByAqi(999).level).toBe('hazardous');
  });

  it('includes correct Chinese labels', () => {
    expect(getLevelByAqi(30).label).toBe('优');
    expect(getLevelByAqi(80).label).toBe('良');
    expect(getLevelByAqi(120).label).toBe('轻度污染');
    expect(getLevelByAqi(180).label).toBe('中度污染');
    expect(getLevelByAqi(250).label).toBe('重度污染');
    expect(getLevelByAqi(350).label).toBe('严重污染');
  });

  it('includes health advice for each level', () => {
    for (const level of AQI_LEVELS) {
      expect(level.advice.length).toBeGreaterThan(0);
      expect(level.healthImpact.length).toBeGreaterThan(0);
    }
  });
});

describe('shouldAlert', () => {
  it('returns true when AQI >= threshold', () => {
    expect(shouldAlert(150, 150)).toBe(true);
    expect(shouldAlert(200, 150)).toBe(true);
    expect(shouldAlert(300, 150)).toBe(true);
  });

  it('returns false when AQI < threshold', () => {
    expect(shouldAlert(149, 150)).toBe(false);
    expect(shouldAlert(100, 150)).toBe(false);
    expect(shouldAlert(50, 150)).toBe(false);
  });

  it('works with different thresholds', () => {
    expect(shouldAlert(100, 100)).toBe(true);
    expect(shouldAlert(99, 100)).toBe(false);
    expect(shouldAlert(200, 200)).toBe(true);
    expect(shouldAlert(199, 200)).toBe(false);
  });
});
