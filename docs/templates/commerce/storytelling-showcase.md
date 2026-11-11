# commerce/storytelling-showcase

Template video ngắn (9:16) chuyên dụng cho **quảng cáo sản phẩm một cách tinh tế (Soft-selling Storytelling)** từ link TikTok Shop hoặc thông tin sản phẩm có sẵn. 

Video được thiết kế để giữ chân người xem qua 3 giây đầu tiên bằng Hook đánh trúng tâm lý, dẫn dắt bằng câu chuyện trải nghiệm chân thật và kêu gọi mua hàng khéo léo thông qua giỏ hàng TikTok Shop.

---

## 1. Input Contract

Hỗ trợ 2 hình thức cung cấp nguồn đầu vào:
1. **Link TikTok Shop**:
   - Link rút gọn chia sẻ từ app: `https://vt.tiktok.com/ZS.../`
   - Link trang sản phẩm: `https://www.tiktok.com/view/product/...` hoặc `https://shop.tiktok.com/...`
   - Link video có gắn giỏ hàng: `https://www.tiktok.com/@.../video/...`
2. **Nội dung văn bản mô tả sản phẩm**:
   - Người dùng tự nhập tên sản phẩm, công dụng, giá bán, ưu đãi và link ảnh.

---

## 2. Preflight / Data Acquisition Hook

Khi phát hiện ngữ cảnh đầu vào chứa link TikTok Shop:
1. Trước khi chạy bước Planner/Teller, pipeline thực thi:
   ```bash
   node scripts/tiktok-product.mjs "<tiktok-url>" "<slug>"
   ```
2. Script sẽ tự động:
   - Sử dụng Playwright giả lập thiết bị di động (Mobile User-Agent) để resolve redirect và bypass trang chặn desktop.
   - Bóc tách tên sản phẩm, bộ ảnh thực tế HD (tải về `public/<slug>/evidence/image-*.{jpg,png,webp}`).
   - Bóc tách giá bán, giá ưu đãi, rating sao và số lượng đã bán.
   - Lưu dữ liệu vào `public/<slug>/product-data.json` và `videos/<slug>/source-context.txt`.
3. Nếu số lượng ảnh từ web chưa đủ hoặc kịch bản cần ảnh minh họa cho các tình huống éo le / hài hước / meme / drama, sử dụng script sinh hoặc chỉnh sửa ảnh bằng **ChatGPT Images 2.5** (mô hình thế hệ mới của OpenAI phát hành 09/2026, kế nhiệm GPT Image 2.0 và thay thế hoàn toàn DALL-E):
   ```bash
   # Tạo ảnh minh họa mới từ kịch bản:
   node scripts/generate-product-image.mjs "<slug>" "<prompt mô tả tình huống>" [filename.png]

   # Hoặc tạo/chỉnh sửa ảnh biến tấu trực tiếp từ ảnh thật của sản phẩm:
   node scripts/generate-product-image.mjs "<slug>" "<prompt đặt sản phẩm vào bối cảnh>" [filename.png] "public/<slug>/evidence/image-01.jpg"
   ```
4. Bắt buộc tối đa hóa số lượng media được sử dụng: truyền mảng `mediaList` vào các cảnh để hệ thống tự động luân chuyển ảnh mỗi 2 - 2.5 giây.

---

## 3. Storytelling & Creative Formula (Kịch bản Hài hước & Phá cách Tâm lý)

> [!IMPORTANT]
> **QUY TẮC THỜI LƯỢNG BẮT BUỘC (MANDATORY DURATION CONTRACT)**:
> - Thời lượng video của template này **BẮT BUỘC CHỈ TỪ 25 – 35 GIÂY** (750 – 1050 frames @ 30fps). Tuyệt đối không làm dài trên 35s.
> - Kịch bản văn bản lý tưởng: **80 – 110 từ** (khi đọc ở tốc độ `speed: 1.15` sẽ đạt chuẩn 26 – 32 giây).
> - **CHỈ 1 CÂU HOOK DUY NHẤT (3 – 4 giây đầu)**: Tuyệt đối không lặp hook, không dùng 2 câu mở đầu liên tiếp (như vừa nói "Nghe đồn..." lại nói tiếp "Nếu bạn từng...").

Teller Agent chọn 1 trong 2 phong cách kịch bản có tính giải trí và giữ chân cực mạnh:

### Phong cách A: "Hài hước / Tự dìm / Bẻ lái bất ngờ" (Humor & Unexpected Twist)
- **Scene 1 (Hook 0-4s / ~120 frames)**: 1 câu mở đầu "tự hủy" hoặc châm biếm thói quen mua sắm mù quáng (*"Đừng dại dột mua cái này... trừ khi muốn..."*).
- **Scene 2 (Pain 4-9s / ~150 frames)**: Diễn tả nỗi khổ trước khi có sản phẩm một cách dí dỏm, cường điệu hóa.
- **Scene 3 (Reveal 9-16s / ~210 frames)**: Bẻ lái bất ngờ: sản phẩm xuất hiện giải quyết ngon ơ khiến bản thân "quê độ".
- **Scene 4 (Features 16-25s / ~270 frames)**: Vừa khen vừa bóc 2 tính năng ăn tiền nhất (RGB, nhỏ gọn bỏ túi, pin trâu).
- **Scene 5 (CTA 25-31s / ~180 frames)**: Kêu gọi rủ rê bạn bè xem deal hời ở giỏ hàng góc trái.

### Phong cách B: "Phá cách tâm lý / Bóc phốt ngược" (Psychological Reverse Exposure)
- **Scene 1 (Hook 0-4s / ~120 frames)**: Đánh thẳng vào nỗi sợ hoặc hoài nghi (*"Đừng mua chiếc đèn mini này, nếu bạn muốn video TikTok cứ mãi tối và nhạt nhòa!"*).
- **Scene 2 (Pain 4-9s / ~150 frames)**: Chỉ ra nỗi đau cụ thể (bật đèn trần bóng dầu, nền phẳng lì, sai ánh sáng tụt view).
- **Scene 3 (Reveal 9-16s / ~210 frames)**: Bẻ lái thực tế: sản phẩm nhỏ bằng lòng bàn tay, đế nam châm hít 360 độ cực tiện.
- **Scene 4 (Features 16-25s / ~270 frames)**: Trình diễn các điểm mạnh đắt giá nhất bằng visual thực tế.
- **Scene 5 (CTA 25-31s / ~180 frames)**: Khẳng định sự nâng tầm góc quay, thúc đẩy bấm giỏ hàng góc trái săn deal.

---

## 4. Voiceover & Audio Contract

- **Giọng đọc (Fast Energetic Pacing)**:
  - Tốc độ đọc nhanh, nhịp điệu dứt khoát, sôi nổi bắt trend video ngắn TikTok (`speed: 1.15`).
  - ElevenLabs ID: `EXAVITQu4vr4xnSDxMaL` (Bella) hoặc `onwK4e9ZLuTAKqWW03F9` (Daniel).
  - Gemini TTS fallback: `Aoede` (giọng nữ nhẹ nhàng, truyền cảm) hoặc `Puck` (giọng nam trẻ trung).
- **Nhạc nền (Background Music)**:
  - Mặc định: `assets/news/music/miromaxmusic-music-promotion.mp3` (giai điệu nhẹ nhàng, hiện đại, thanh lịch) hoặc `assets/news/music/nastelbom-soft-music.mp3`.
  - Âm lượng nền giữ ở mức 0.08 để tôn giọng đọc thoại rõ nét.

---

## 5. Visual System & Safe Zones

- **Kích thước**: 1080 x 1920 (9:16), 30fps.
- **TikTok Safe Zone**:
  - Top Zone (170px): Tránh Search bar và tabs TikTok.
  - Bottom Zone (340px): Tránh phần Caption TikTok và nút giỏ hàng vàng của nền tảng.
  - Right Zone (128px): Tránh cột icon tương tác (Thả tim, Bình luận, Lưu, Chia sẻ).
- **Subtitles**: Canh giữa trong vùng an toàn, hiệu ứng highlight từng từ (Active Word Highlight) màu vàng cam nổi bật.
- **Loại bỏ nhãn kỹ thuật (No Technical Labels)**: Template chung tuyệt đối không hiển thị các nhãn kỹ thuật tiếp thị cứng nhắc (như "Bóc phốt ngược", "USP đỉnh cao", "Nỗi đau quen thuộc", "Bẻ lái bất ngờ"). Toàn bộ không gian được ưu tiên tối đa cho Headline, ảnh sản phẩm chất lượng cao và CTA mua hàng.

---

## 6. Spec Schema (`videos/<slug>/spec.json`)

```ts
interface ProductStorySpec {
  templateId: "commerce/storytelling-showcase";
  slug: string;
  totalFrames: number;
  video: {
    productName: string;
    targetAudience?: string;
    productUrl?: string;
    shopName?: string;
    bgMusic?: string | null;
  };
  scenes: Array<{
    type: "hook" | "pain" | "reveal" | "features" | "socialProofCta";
    startFrame: number;
    durationFrames: number;
    categoryBadge?: string;
    headline: string;
    subheadline?: string;
    media?: {
      src: string;
      storage?: "local" | "remote";
    };
    priceText?: string;
    ratingText?: string;
    soldText?: string;
    features?: Array<{
      title: string;
      description?: string;
    }>;
    ctaText?: string;
  }>;
}
```

---

## 7. Mandatory Media Contract (Bắt buộc về Media sản phẩm)

- **TUYỆT ĐỐI KHÔNG ĐƯỢC RENDER VIDEO KHÔNG CÓ ẢNH SẢN PHẨM**.
- Trong `spec.json`, các cảnh `hook`, `reveal` và `features` **BẮT BUỘC** phải có thuộc tính `media` hoặc `mediaList` trỏ đến các file ảnh trong `public/<slug>/evidence/` (ví dụ `"<slug>/evidence/image-01.jpg"`, `"<slug>/evidence/image-02.jpg"`...).
- Script `scripts/tiktok-product.mjs` luôn tự động tải ảnh từ web và tự động kích hoạt **ChatGPT Images 2.5** để bổ sung nếu thiếu.
- Coder / Spec agent không được phép bỏ trống trường `media` hay ghi chú không gắn ảnh. Video bán hàng sản phẩm bắt buộc phải có visual sản phẩm xuất hiện rõ ràng trên màn hình!
