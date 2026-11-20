import {describe, it, expect} from 'vitest';
import {
  DAILY_SHIFTS,
  isAgyQuotaOrUnavailableError,
  shouldProduceLongToday,
  runShift,
} from './daily-orchestrator.mjs';
import {
  DEFAULT_PUBLISH_SLOTS,
  DEFAULT_PUBLISH_GAP_MINUTES,
  DEFAULT_LONG_PUBLISH_SLOTS,
} from './youtube-upload.mjs';

describe('Task 1: daily-orchestrator schedule & fallback', () => {
  it('sets 2 Shorts per shift (8/day) matching 8 slots with 90m gap and 12:00,15:30 long slots', () => {
    expect(DAILY_SHIFTS['1'].shorts).toBe(2);
    expect(DAILY_SHIFTS['2'].shorts).toBe(2);
    expect(DAILY_SHIFTS['3'].shorts).toBe(2);
    expect(DAILY_SHIFTS['4'].shorts).toBe(2);
    expect(DEFAULT_PUBLISH_GAP_MINUTES).toBe(90);
    expect(DEFAULT_PUBLISH_SLOTS.split(',')).toHaveLength(8);
    expect(DEFAULT_LONG_PUBLISH_SLOTS).toBe('12:00,15:30');
  });

  it('detects agy quota/unavailable errors accurately', () => {
    expect(isAgyQuotaOrUnavailableError(new Error('RESOURCE_EXHAUSTED (code 429)'))).toBe(true);
    expect(isAgyQuotaOrUnavailableError(new Error('Individual quota reached'))).toBe(true);
    expect(isAgyQuotaOrUnavailableError('agy thoát với mã 3: error')).toBe(true);
    expect(isAgyQuotaOrUnavailableError(new Error('SyntaxError: Unexpected token'))).toBe(false);
  });

  it('gates long video production to max 1/day, even days >=45, odd days >=55', () => {
    const evenDay = new Date('2026-11-16T10:00:00+07:00');
    const oddDay = new Date('2026-11-17T10:00:00+07:00');
    expect(shouldProduceLongToday({now: evenDay, topScore: 46, alreadyProducedToday: false})).toBe(true);
    expect(shouldProduceLongToday({now: evenDay, topScore: 46, alreadyProducedToday: true})).toBe(false);
    expect(shouldProduceLongToday({now: oddDay, topScore: 50, alreadyProducedToday: false})).toBe(false);
    expect(shouldProduceLongToday({now: oddDay, topScore: 56, alreadyProducedToday: false})).toBe(true);
  });

  it('falls back to Direct API runner when agy throws quota 429', async () => {
    let fallbackCalled = 0;
    const res = await runShift('1', {
      lockFile: null,
      stateFile: null,
      onLog: () => {},
      agyRunner: async () => {
        throw new Error('RESOURCE_EXHAUSTED (code 429): Individual quota reached');
      },
      shortFallbackRunner: async ({count}) => {
        fallbackCalled = count;
        return {processed: [{slug: 'a'}, {slug: 'b'}]};
      },
    });
    expect(fallbackCalled).toBe(2);
    expect(res.shorts.status).toBe('fallback-completed');
    expect(res.shorts.count).toBe(2);
  });
});
