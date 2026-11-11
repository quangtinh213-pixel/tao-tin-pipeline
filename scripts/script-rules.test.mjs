import {describe, expect, it} from 'vitest';
import {countHookWords, validateHook, validateScript} from './script-rules.mjs';

describe('validateHook', () => {
  it('accepts a short hook with a surprising detail', () => {
    const result = validateHook('Trộm chiếc Rolex 1,4 tỉ của bạn, thanh niên này vẫn cùng nạn nhân đi xem camera.');
    expect(result).toEqual({valid: true, wordCount: 17, errors: []});
  });

  it('rejects hooks longer than 22 words', () => {
    const hook = Array.from({length: 23}, () => 'chữ').join(' ');
    expect(validateHook(hook).errors[0]).toMatch(/23 từ/u);
    expect(validateHook(hook, {maxWords: 30}).valid).toBe(true);
  });

  it.each([
    'Hai vụ cháy cách nhau gần 3 giờ, may mắn không có thương vong.',
    'Nam sinh bệnh tim được CSGT mở đường tới viện kịp thời.',
    'Cháy nhà trọ lúc rạng sáng, không ai bị thương vong.',
    'Bé trai 3 tuổi đã được cứu sống sau 14 giờ.',
  ])('rejects outcome reveal: %s', (hook) => {
    expect(validateHook(hook).errors.join(' ')).toMatch(/lộ kết cục/u);
  });

  it('does not treat "an toàn giao thông" as an outcome reveal', () => {
    expect(validateHook('Biển tốc độ tối thiểu vừa bị tháo vì lo an toàn giao thông.').valid).toBe(true);
  });

  it('rejects hype labels but not clock times', () => {
    expect(validateHook('Cảnh báo y tế khẩn: ca tay chân miệng tăng 65%.').errors.join(' ')).toMatch(/nhãn/u);
    expect(validateHook('Lúc 5:30 sáng, ngọn lửa bao trùm dãy trọ.').valid).toBe(true);
  });

  it.each([
    'Công an Đồng Nai vừa bắt 11 người dựng phim giang hồ.',
    'Mới đây, một tàu cá bốc cháy giữa biển.',
    'Vào ngày 5/10, một vụ tấn công xảy ra.',
    'Theo VnExpress, giá vàng giảm sâu.',
  ])('rejects weak opener: %s', (hook) => {
    expect(validateHook(hook).errors.join(' ')).toMatch(/mở bằng/u);
  });

  it('allows place openers, which retained well', () => {
    expect(validateHook('Tại Cà Mau, một cháu bé sáu tuổi tử vong sau vụ tấn công.').valid).toBe(true);
  });

  it('rejects an empty hook', () => {
    expect(validateHook('  ').valid).toBe(false);
    expect(countHookWords('')).toBe(0);
  });
});

describe('validateScript', () => {
  const words = (count) => Array.from({length: count}, () => 'chữ').join(' ');

  it('checks the hook and the 140-word total', () => {
    const ok = validateScript([{text: words(20)}, {text: words(120)}]);
    expect(ok).toMatchObject({valid: true, hookWords: 20, totalWords: 140});
    const long = validateScript([{text: words(20)}, {text: words(121)}]);
    expect(long.errors.join(' ')).toMatch(/141 từ/u);
  });

  it('reports hook errors and handles a missing script', () => {
    expect(validateScript([{text: 'Mới đây, một vụ cháy xảy ra.'}]).valid).toBe(false);
    expect(validateScript(undefined).errors).toContain('Hook trống.');
  });
});
