import {describe, expect, it} from 'vitest';
import {
  buildCaption,
  classifyCaptionStory,
  countCaptionWords,
  hasRequiredCaptionHashtags,
  validateCaption,
} from './caption-rules.mjs';

const fixture = {
  title: 'Cây đổ trúng xe buýt ở TPHCM, một người tử vong',
  date: '18.09.2026',
  publisher: 'VietNamNet News',
  planHook:
    'Một cây xanh lớn bất ngờ đổ ập xuống xe buýt và xe máy giữa lúc trời mưa ở TPHCM, khiến một người đàn ông tử vong.',
  planEnding: 'Nguyên nhân cụ thể của vụ việc vẫn đang được cơ quan chức năng điều tra.',
  scriptSegments: [
    'Một cây xanh lớn bất ngờ đổ ập xuống xe buýt và xe máy giữa lúc trời mưa ở TPHCM, khiến một người đàn ông tử vong.',
    'Vụ việc xảy ra khoảng 18 giờ 25 phút ngày 18 tháng 9 trên đường An Dương Vương, phường Chợ Quán, TPHCM.',
    'Cây đổ trúng đầu xe buýt và một xe máy đang lưu thông gần đó.',
    'Hai người đi trên xe máy bị thương nặng và được lực lượng chức năng đưa đi cấp cứu.',
    'Một nạn nhân tử vong sau đó tại bệnh viện, người còn lại tiếp tục được điều trị.',
    'Theo thông tin ban đầu, nhánh cây có đường kính khoảng 20 centimet.',
    'Các đơn vị nghiệp vụ đang khám nghiệm hiện trường và điều tra nguyên nhân.',
  ],
};

describe('caption story rules', () => {
  it('classifies hot and policy stories with Vietnamese accents ignored', () => {
    expect(classifyCaptionStory({
      title: 'Cháy lớn tại chợ Kim Sơn',
      hook: 'Lửa bao trùm khu bán vải',
      scriptText: 'Cơ quan chức năng đang làm rõ nguyên nhân',
    })).toBe('hot');

    expect(classifyCaptionStory({
      title: 'Quy định mới về mức phạt giao thông',
      hook: 'Mức phạt mới được áp dụng',
      scriptText: 'Người dân cần cập nhật quy định',
    })).toBe('policy');

    expect(classifyCaptionStory({
      title: 'Hà Nội: Tìm thấy thi thể nam sinh bị nước cuốn xuống cống',
      hook: 'Nam sinh bị nước cuốn được tìm thấy',
      scriptText: 'Đội cứu hộ đã tìm kiếm xuyên đêm',
    })).toBe('hot');
  });

  it('counts caption tokens while ignoring standalone section icons', () => {
    expect(countCaptionWords('🔴 NÓNG: Hà Nội hôm nay! #VnNews213')).toBe(6);
  });

  it('recognizes the mandatory channel hashtag', () => {
    expect(hasRequiredCaptionHashtags('Tin mới #VnNews213 #tintuc')).toBe(true);
    expect(hasRequiredCaptionHashtags('Tin mới #tintuc')).toBe(false);
  });

  it('derives meaningful SEO hashtags from legal story phrases', () => {
    const caption = buildCaption({
      title: 'Tự lập đội hiệp sĩ để nhận tiền giải cứu: bị phạt 14 năm tù',
      publisher: 'Vietnam+',
      scriptSegments: [
        'Tòa tuyên án 14 năm tù với người tự lập đội hiệp sĩ để nhận tiền giải cứu.',
        'Cơ quan chức năng đã làm rõ hành vi trong vụ án.',
      ],
      planHook: 'Tự lập đội hiệp sĩ để nhận tiền giải cứu.',
      planEnding: 'Tòa đã tuyên án theo quy định.',
    });

    expect(caption).toContain('#doihiepsi');
    expect(caption).toContain('#giaicuu');
    expect(caption).toContain('#phapluat');
    expect(caption).toMatch(/^🔴/u);
  });

  it('generates a dense SEO hashtag set with discovery and topic layers', () => {
    const caption = buildCaption(fixture);
    const hashtags = caption.match(/#[\p{L}\p{N}_-]+/gu) || [];

    expect(hashtags.length).toBeGreaterThanOrEqual(10);
    expect(hashtags.length).toBeLessThanOrEqual(15);
    expect(hashtags).toEqual(expect.arrayContaining([
      '#VnNews213',
      '#tintuc',
      '#tinmoi',
      '#capnhat',
      '#tintuc24h',
      '#canhbao',
      '#tphcm',
    ]));
    expect(caption).not.toMatch(/#cho\b|#trung\b|#buyt\b/u);
    expect(caption).not.toContain('#ninhbinh');
  });

  it('rejects a hot caption that lacks its category SEO hashtag', () => {
    const metadata = {
      title: 'Tự lập đội hiệp sĩ để nhận tiền giải cứu: bị phạt 14 năm tù',
      hook: 'Tự lập đội hiệp sĩ để nhận tiền giải cứu.',
      scriptText: 'Tòa tuyên án 14 năm tù. Cơ quan chức năng đang làm rõ hành vi.',
      publisher: 'Vietnam+',
    };
    const caption = buildCaption(metadata).replace('#phapluat', '#xahoi');
    const result = validateCaption(caption, metadata);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Caption phải có hashtag nhóm tin phù hợp.');
  });

  it('derives legal topic hashtags from verified script context', () => {
    const caption = buildCaption({
      title: 'Hải Phòng: Nhóm mang hung khí tấn công nhầm người trên phố',
      publisher: 'Báo điện tử Tiền Phong',
      scriptSegments: [
        'Công an Hải Phòng cho biết đã bắt giữ 10 người liên quan và phục vụ điều tra.',
        'Vụ việc vẫn đang được làm rõ và chờ kết luận chính thức.',
      ],
      planHook: 'Một nhóm mang hung khí tấn công nhầm người trên phố.',
      planEnding: 'Vụ việc vẫn đang được làm rõ.',
    });

    expect(caption).toContain('#phapluat');
  });

  it('does not promote incidental title words into SEO hashtags', () => {
    const caption = buildCaption({
      title: 'Hải Phòng: Nhiều người bị ảnh hưởng sau vụ việc',
      publisher: 'Example News',
      scriptSegments: [
        'Cơ quan chức năng đang làm rõ vụ việc tại Hải Phòng.',
        'Thông tin tiếp theo sẽ được cập nhật từ nguồn chính thức.',
      ],
      planHook: 'Nhiều người bị ảnh hưởng sau vụ việc.',
      planEnding: 'Cơ quan chức năng đang làm rõ.',
    });

    expect(caption).not.toMatch(/#phong\b|#nhieu\b|#truoc\b/u);
  });

  it('does not promote secondary locations from script context', () => {
    const caption = buildCaption({
      title: 'Cây đổ trúng xe buýt ở TPHCM',
      publisher: 'Example News',
      scriptSegments: [
        'Cây đổ khiến giao thông ở TPHCM bị ảnh hưởng.',
        'Một đoạn thông tin tham khảo có nhắc đến Ninh Bình nhưng không phải địa điểm vụ việc.',
      ],
      planHook: 'Cây đổ trúng xe buýt ở TPHCM.',
      planEnding: 'Cơ quan chức năng đang làm rõ.',
    });

    expect(caption).toContain('#tphcm');
    expect(caption).not.toContain('#ninhbinh');
  });

  it('pads a short story with safe context before the final CTA', () => {
    const caption = buildCaption({
      title: 'Quy định mới về mức phạt giao thông',
      publisher: 'Example News',
      scriptSegments: ['Quy định mới về mức phạt giao thông được cập nhật.'],
      planHook: 'Mức phạt mới được áp dụng.',
      planEnding: 'Người dân cần cập nhật quy định.',
    });
    const result = validateCaption(caption, {
      title: 'Quy định mới về mức phạt giao thông',
      hook: 'Mức phạt mới được áp dụng.',
      scriptText: 'Quy định mới về mức phạt giao thông được cập nhật.',
      publisher: 'Example News',
    });

    expect(result.valid).toBe(true);
    expect(caption).toMatch(/\?\s*(?:#|$)/u);
  });

  it('trims long verified content without dropping the CTA or hashtags', () => {
    const longSegment = 'Theo nguồn chính thức, cơ quan chức năng đang cập nhật thêm thông tin cho người dân. '.repeat(10);
    const caption = buildCaption({
      title: 'Cháy lớn tại chợ Kim Sơn',
      publisher: 'Example News',
      scriptSegments: Array.from({length: 8}, () => longSegment),
      planHook: 'Cháy lớn tại chợ Kim Sơn.',
      planEnding: 'Cơ quan chức năng đang làm rõ nguyên nhân.',
    });
    const result = validateCaption(caption, {
      title: 'Cháy lớn tại chợ Kim Sơn',
      hook: 'Cháy lớn tại chợ Kim Sơn.',
      scriptText: longSegment,
      publisher: 'Example News',
    });

    expect(result.valid).toBe(true);
    expect(result.wordCount).toBeLessThanOrEqual(180);
    expect(caption).toContain('#VnNews213');
    expect(caption).toMatch(/\?\s*(?:#|$)/u);
  });

  it('builds a 100–180 word caption with attribution and an open CTA', () => {
    const caption = buildCaption(fixture);
    const result = validateCaption(caption, {
      title: fixture.title,
      hook: fixture.planHook,
      scriptText: fixture.scriptSegments.join(' '),
      publisher: fixture.publisher,
    });

    expect(result.valid).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(100);
    expect(result.wordCount).toBeLessThanOrEqual(180);
    expect(caption).toContain('#VnNews213');
    expect(caption).toContain('#tphcm');
    expect(caption).not.toMatch(/#trung\b|#buyt\b/u);
    expect(caption).toMatch(/^[🔴⚠️📌]/u);
    expect(caption).toMatch(/\?\s*(?:#|$)/u);
    expect(caption).toMatch(/Theo VietNamNet News|cơ quan chức năng|đang được.*làm rõ/iu);
  });

  it('reports every applicable violation instead of stopping at the first one', () => {
    const invalid = '🔴 Xin chào mọi người, tin nóng. Bạn có đồng ý không?';
    const result = validateCaption(invalid, {
      title: 'Tin nóng đang được điều tra',
      hook: 'Tin nóng mới nhất',
      scriptText: 'Cơ quan chức năng đang làm rõ',
      publisher: 'Example News',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'Caption phải có 100–180 từ.',
      'Caption phải có #VnNews213.',
      'Caption không được mở đầu bằng lời chào.',
      'CTA không được là câu hỏi đóng dạng Yes/No.',
      'Tin nóng/pháp luật cần có câu dẫn nguồn hoặc trạng thái xác minh.',
    ]));
  });
});
