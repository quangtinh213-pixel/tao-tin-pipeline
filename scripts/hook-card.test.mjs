import {describe, expect, it} from 'vitest';
import {hookCardArm, validateHookCard} from './hook-card.mjs';

const source = 'Đến nay, cơ quan điều tra đã bắt giam 94 người. Đường dây chiếm đoạt khoảng 50 tỉ đồng của hàng nghìn người.';
const card = {value: '50 tỉ', label: 'đồng bị chiếm đoạt', sourceQuote: 'chiếm đoạt khoảng 50 tỉ đồng'};

describe('hookCardArm', () => {
  it('is stable per slug and splits slugs roughly in half', () => {
    const slugs = Array.from({length: 400}, (_, i) => `2026-11-${String(i % 30).padStart(2, '0')}-vnexpress-tin-${i}`);
    expect(hookCardArm(slugs[0])).toBe(hookCardArm(slugs[0]));
    const cards = slugs.filter((slug) => hookCardArm(slug) === 'card').length;
    expect(cards).toBeGreaterThan(160);
    expect(cards).toBeLessThan(240);
  });
});

describe('validateHookCard', () => {
  it('accepts a figure quoted verbatim from the article', () => {
    expect(validateHookCard(card, source)).toEqual([]);
  });

  it('rejects a quote that is not in the article', () => {
    expect(validateHookCard({...card, sourceQuote: 'chiếm đoạt 80 tỉ đồng'}, source).join(' ')).toMatch(/nguyên văn/u);
  });

  it('rejects a number that the quote does not contain', () => {
    expect(validateHookCard({...card, value: '94 tỉ'}, source).join(' ')).toMatch(/Số 94/u);
  });

  it('rejects an outcome reveal and over-long text', () => {
    const errors = validateHookCard({...card, value: '50 tỉ đồng bị lấy', label: 'may mắn đã thu hồi toàn bộ số tiền cho nạn nhân ở nhiều nước'}, source).join(' ');
    expect(errors).toMatch(/value dài/u);
    expect(errors).toMatch(/label dài/u);
    expect(errors).toMatch(/lộ kết cục/u);
  });
});
