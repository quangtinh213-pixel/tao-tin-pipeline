# Hướng Dẫn Cài Đặt và Sử Dụng - Công Cụ Tạo Video Bằng AI

> <span style="color:red">⚠️ **Bản quyền thuộc về Trạm AI. Bạn sẽ chịu mọi trách nhiệm trước pháp luật nếu chia sẻ project này cho bất cứ ai, hoặc hoạt động trao đổi mua bán thương mại hoá.**</span>

---

## Mục lục

1. [Project này làm gì?](#1-project-này-làm-gì)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Cài đặt ứng dụng AI](#3-cài-đặt-ứng-dụng-ai)
4. [Cài đặt project](#4-cài-đặt-project)
5. [Lấy API Key](#5-lấy-api-key)
6. [Tạo video đầu tiên](#6-tạo-video-đầu-tiên)
7. [Xem kết quả](#7-xem-kết-quả)
8. [Các lệnh tiện dụng cơ bản](#8-các-lệnh-tiện-dụng-cơ-bản)
9. [Mẹo và lưu ý](#9-mẹo-và-lưu-ý)
10. [Hỗ trợ thêm](#10-hỗ-trợ-thêm)

---

## 1. Project này làm gì?

Project này cho phép bạn **gõ 1 đoạn văn bản hoặc dán 1 đường link**, AI sẽ tự động lên kịch bản tạo ra **video ngắn hoàn chỉnh**. Độ dài video lý tưởng là **dưới 3 phút**.

**Ví dụ gõ nội dung:**

```text
/gen-video 5 lý do tại sao bạn nên uống đủ nước mỗi ngày
```

**Ví dụ dán link bài viết:**

```text
/gen-video https://vnexpress.net/ten-bai-viet-1234567.html
```

---

## 2. Yêu cầu hệ thống

| Thứ cần có        | Phiên bản tối thiểu                     | Ghi chú                             |
| ----------------- | --------------------------------------- | ----------------------------------- |
| Hệ điều hành      | Windows 10, macOS 11, hoặc Ubuntu 20.04 |                                     |
| RAM               | 8 GB                                    | 16 GB nếu muốn render nhanh hơn     |
| Dung lượng ổ cứng | 5 GB trống                              | Cho Node.js, ffmpeg và video output |
| Kết nối internet  | Bắt buộc                                | Để gọi API TTS/STT và tải font      |

---

## 3. Cài đặt 1 ứng dụng để chạy công cụ

Khuyên dùng **Codex** hoặc **Claude Code** để có kết quả tốt nhất.

Sau khi cài xong, mở thư mục project trong ứng dụng AI đó, rồi gõ `/setup` vào cửa sổ chat AI để bắt đầu.

| Ứng dụng                          | Phù hợp với                      | Link tải                                                                                  |
| --------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| **Codex** (OpenAI / ChatGPT)      | Người dùng ChatGPT sẵn           | [openai.com/codex](https://openai.com/codex/)                                             |
| **Claude Code** (Anthropic)       | Người quen dùng terminal         | [docs.anthropic.com/claude-code](https://docs.anthropic.com/en/docs/claude-code/overview) |
| **Cursor**                        | Người mới, không cần biết code   | [cursor.com](https://www.cursor.com)                                                      |
| **Kiro** (Amazon)                 | Người dùng AWS, thích IDE đầy đủ | [kiro.dev](https://kiro.dev)                                                              |
| **Gemini + Antigravity** (Google) | Người dùng hệ sinh thái Google   | [Antigravity](https://antigravity.google/)                                                |

> Với các agent không có trong danh sách chính thức, hãy chỉ cho agent đọc file `AGENTS.md` để nó hiểu cách hoạt động.

---

## 4. Cài đặt project và Sử dụng

Video hướng dẫn cài đặt và sử dụng: [https://youtu.be/6IhL0jnhYlg](https://youtu.be/6IhL0jnhYlg)

Video hướng dẫn dùng các lệnh cơ bản: [https://youtu.be/Cj623RGXXW0](https://youtu.be/Cj623RGXXW0)

Video hướng dẫn sử dụng templates: [https://youtu.be/JwZWSe7Z760](https://youtu.be/JwZWSe7Z760)

Video hướng dẫn cài đặt voice cho template: [https://youtu.be/2MutcfY1Jds](https://youtu.be/2MutcfY1Jds)

### Bước 1: Giải nén project

Giải nén file zip vào một thư mục dễ tìm, ví dụ:

- Windows: `C:\Users\TênBạn\Documents\video-ai`
- macOS: `/Users/TênBạn/Documents/video-ai`

### Bước 2: Mở project trong ứng dụng AI

Mở thư mục vừa giải nén trong ứng dụng AI bạn đã chọn.

### Bước 3: Chạy lệnh setup

Trong cửa sổ chat của ứng dụng AI, gõ:

```text
/setup @AGENTS.md
```

AI sẽ tự động cài đặt, chỉ vậy là được.

> ⏱ Quá trình này mất khoảng **3–10 phút** tùy tốc độ internet.

Khi thấy thông báo thành công, bạn đã sẵn sàng chuyển bước tiếp theo.

---

## 5. Lấy API Key

Project này cần **ít nhất 2 API key** để hoạt động:

| API                            | Dùng để làm gì                              | Bắt buộc?                 |
| ------------------------------ | ------------------------------------------- | ------------------------- |
| **Gemini** hoặc **ElevenLabs** | Tổng hợp giọng nói (TTS)                    | Bắt buộc (chọn ít nhất 1) |
| **Groq** hoặc **stt.ai**       | Nhận dạng giọng nói để lấy timestamps (STT) | Bắt buộc (chọn ít nhất 1) |

---

### 5.1 Gemini API Key (TTS — giọng nói, miễn phí ⭐ Khuyên dùng trước)

Gemini TTS là lựa chọn được khuyên dùng để bắt đầu vì **hoàn toàn miễn phí**, không cần thẻ tín dụng, chất lượng giọng tiếng Việt tốt với voice `Achird`.

**Bước 1:** Truy cập [https://aistudio.google.com/app/api-keys](https://aistudio.google.com/app/api-keys) và đăng nhập bằng tài khoản Google.

**Bước 2:** Nhấn **Create API Key**, chọn project (hoặc tạo mới), rồi copy key vừa tạo.

**Bước 3:** Chạy lệnh sau trong chat AI:

```text
/update-config --key GEMINI_API_KEY --value <api-key-cua-ban>
```

> 💡 Voice mặc định là `Achird`, phù hợp tiếng Việt.

---

### 5.2 ElevenLabs API Key (TTS — giọng nói chất lượng cao nhất, ~$6/tháng)

ElevenLabs tạo ra giọng nói tự nhiên nhất, phù hợp khi bạn muốn chất lượng audio chuyên nghiệp. Chi phí khoảng **$6/tháng** cho gói Starter.

> Nếu cả ElevenLabs và Gemini đều được điền, **ElevenLabs sẽ được ưu tiên cao nhất** tự động.

**Bước 1:** Truy cập [elevenlabs.io](https://elevenlabs.io) và tạo tài khoản.

**Bước 2:** Sau khi đăng nhập, vào **Settings → API Keys**:

- Đường dẫn trực tiếp: [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)

**Bước 3:** Nhấn **Create API Key**, đặt tên (ví dụ: `video-ai`), rồi copy key vừa tạo.

**Bước 4:** Lấy Voice ID:

- Vào [elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library)
- Tìm giọng tiếng Việt phù hợp (ví dụ: tìm `Vietnamese`)
- Nhấn vào giọng muốn dùng → copy **Voice ID** từ URL hoặc phần thông tin giọng

**Bước 5:** Chạy các lệnh sau trong chat AI:

```text
/update-config --key ELEVENLABS_API_KEY --value <api-key-cua-ban>
```

```text
/update-config --key ELEVENLABS_VOICE_ID --value <voice-id-cua-ban>
```

> 💡 Voice ID mặc định trong project là `K7ewtjKRNtwwt3lKQ6M0` — bạn có thể dùng luôn nếu chưa muốn chọn giọng khác.

---

### 5.3 Groq API Key (STT — nhận dạng giọng nói, khuyên dùng)

Groq dùng Whisper để phân tích file audio và tạo timestamps cho từng từ. Project ưu tiên Groq vì nhanh, có free tier đủ rộng cho video ngắn, và fallback sang stt.ai nếu cần.

**Bước 1:** Truy cập [console.groq.com](https://console.groq.com) và tạo tài khoản.

**Bước 2:** Vào phần **API Keys** và tạo key mới.

**Bước 3:** Chạy lệnh sau trong chat AI:

```text
/update-config --key GROQ_API_KEY --value <api-key-cua-ban>
```

---

### 5.4 stt.ai API Key (STT — fallback)

stt.ai dùng để phân tích file audio và tạo ra timestamps cho từng từ — giúp subtitle tô sáng từng từ đồng bộ chính xác với giọng nói.

**Bước 1:** Truy cập [stt.ai](https://stt.ai) và tạo tài khoản.

**Bước 2:** Sau khi đăng nhập, vào phần **API Keys** hoặc **Dashboard**.

**Bước 3:** Tạo API key mới và copy Bearer token.

**Bước 4:** Chạy lệnh sau trong chat AI:

```text
/update-config --key STT_API_KEY --value <bearer-token-cua-ban>
```

> ⚠️ Key này là fallback. Pipeline vẫn chạy nếu có `GROQ_API_KEY`.

---

## 6. Tạo video đầu tiên

Trong cửa sổ chat của ứng dụng AI, gõ lệnh theo cú pháp:

```text
/gen-video <nội dung bạn muốn làm video>
```

Khi không truyền `--template`, pipeline mặc định dùng `creative/free-style`: AI tự thiết kế scene theo nội dung nhưng vẫn tuân theo watermark, subtitle, timing và bước kiểm tra chất lượng chung.

**Ví dụ bằng text:**

```text
/gen-video 5 thói quen buổi sáng giúp tăng năng suất làm việc
```

**Ví dụ dán link:**

```text
/gen-video https://vnexpress.net/ten-bai-viet-1234567.html
```

### Chọn chế độ âm thanh (audio mode)

Để chọn template và chế độ âm thanh khi tạo video, dùng cú pháp:

```text
/gen-video --template <template-id> [--audio=<mode>] <nội dung>
```

Phần thuyết minh (voiceover) **luôn được tạo và phát**. Tùy chọn `--audio` chỉ điều khiển nhạc nền và hiệu ứng âm thanh chuyển cảnh (SFX):

| Chế độ                 | Nhạc nền      | SFX chuyển cảnh | Mô tả                                                            |
| ---------------------- | ------------- | --------------- | ---------------------------------------------------------------- |
| `--audio=full`         | Có            | Có              | Video đầy đủ voiceover, nhạc nền và hiệu ứng chuyển cảnh.        |
| `--audio=music`        | Có            | Không           | Chỉ dùng voiceover và nhạc nền, không phát hiệu ứng chuyển cảnh. |
| `--audio=sfx`          | Không         | Có              | Chỉ dùng voiceover và hiệu ứng chuyển cảnh, không phát nhạc nền. |
| `--audio=voice-only`   | Không         | Không           | Chỉ phát voiceover, không có nhạc nền hoặc hiệu ứng chuyển cảnh. |
| Không truyền `--audio` | Theo template | Theo template   | Giữ nguyên cấu hình âm thanh mặc định của template đã chọn.      |

**Ví dụ:**

```text
/gen-video --template <template-id> --audio=full <nội dung>
/gen-video --template <template-id> --audio=music <nội dung>
/gen-video --template <template-id> --audio=sfx <nội dung>
/gen-video --template <template-id> --audio=voice-only <nội dung>
```

> ⏱ Toàn bộ quá trình mất khoảng **5–15 phút** tùy độ dài video và cấu hình máy.

---

## 7. Xem kết quả

Sau khi AI báo hoàn thành, video của bạn nằm tại:

```text
videos/
└── <tên-video>/
    └── output/
        └── video.mp4
```

Ví dụ: `videos/2026-05-12-5-thoi-quen/output/video.mp4`

---

## 8. Các lệnh tiện dụng cơ bản

Bạn có thể gõ các lệnh dưới đây trực tiếp vào cửa sổ chat của ứng dụng AI đang mở project.

| Lệnh                                                                      | Tác dụng                                                                          |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/setup @AGENTS.md`                                                       | Cài đặt dependencies, kiểm tra môi trường và chuẩn bị project để sử dụng lần đầu. |
| `/gen-video <nội dung>`                                                   | Tạo một video hoàn chỉnh từ nội dung text hoặc link bài viết.                     |
| `/gen-video --template <template-id> <nội dung>`                          | Tạo video bằng một template cụ thể đã có sẵn trong project.                       |
| `/templates`                                                              | Xem danh sách template có sẵn kèm câu lệnh mẫu để dùng nhanh.                     |
| `/sync-templates`                                                         | Đồng bộ các template mới từ thư mục `load-templates/` vào project.                |
| `/sync-templates --package <package-folder>`                              | Đồng bộ một package template cụ thể trong thư mục `load-templates/`.              |
| `/update-config --key <ENV_KEY> --value <value>`                          | Cập nhật API key hoặc cấu hình trong file `.env` mà không cần sửa file thủ công.  |
| `/update-template-voice --template <template-id> --gemini <voice-name>`   | Đổi giọng Gemini mặc định cho một template.                                       |
| `/update-template-voice --template <template-id> --elevenlabs <voice-id>` | Đổi giọng ElevenLabs mặc định cho một template.                                   |
| `/update-bg-music --template <template-id> --music <music-file>`          | Đổi nhạc nền mặc định cho một template.                                           |
| `/add-music --category <name> --file <filename.mp3>`                      | Thêm file nhạc `.mp3` vào thư viện nhạc của project.                              |
| `/update-logo --file <filename.png>`                                      | Thay logo/watermark chung hiển thị trên video.                                    |
| `/ai-help`                                                                | Xem lại toàn bộ lệnh được hỗ trợ và mô tả ngắn của từng lệnh.                     |

### Templates miễn phí

Các template miễn phí sẽ được cập nhật tại thư mục Google Drive sau:

[Xem và tải templates miễn phí trên Google Drive](https://drive.google.com/drive/folders/1C7_lXQ2lZNdWigDTqH6rScpHMJQWCvVn?usp=drive_link)

---

## 9. Mẹo và lưu ý

### Dùng ChatGPT hoặc Gemini để viết context chất lượng cao

Context càng chi tiết và cuốn hút, video càng hay. Thay vì tự nghĩ nội dung, hãy nhờ ChatGPT hoặc Gemini viết sẵn một bài blog ngắn về chủ đề bạn muốn, rồi copy toàn bộ vào làm context.

**Prompt gợi ý để dùng với ChatGPT ([chatgpt.com](https://chatgpt.com)) hoặc Gemini ([gemini.google.com](https://gemini.google.com)):**

```text
Viết một bài blog ngắn khoảng 300 từ bằng tiếng Việt về chủ đề: [CHỦ ĐỀ CỦA BẠN].
Yêu cầu:
- Giọng văn cuốn hút, dễ hiểu, phù hợp với mạng xã hội
- Có mở đầu gây chú ý, thân bài chia thành 4–6 ý chính rõ ràng, kết bài kêu gọi hành động
- Mỗi ý có tiêu đề ngắn và 1–2 câu giải thích
```

Sau khi có bài blog, copy toàn bộ nội dung và dán vào lệnh:

```text
/gen-video [DÁN TOÀN BỘ NỘI DUNG BÀI BLOG VÀO ĐÂY]
```

> Cách này cho kết quả tốt hơn nhiều so với chỉ gõ một câu ngắn, vì AI có đủ thông tin để lên kịch bản chi tiết và chọn đúng góc nhìn cho từng cảnh.

### Viết context tốt hơn để có video hay hơn

- **Cụ thể hơn** → Video hay hơn. Thay vì `sức khỏe`, hãy viết `5 thực phẩm giúp tăng cường miễn dịch mùa đông`
- **Thêm góc nhìn** → `Giải thích như cho trẻ 10 tuổi` hoặc `Theo góc nhìn khoa học`
- **Chỉ định đối tượng** → `Dành cho người mới bắt đầu đầu tư chứng khoán`

### Mỗi lần chạy `/gen-video` tạo ra một thư mục mới

Các video cũ không bị xóa. Tất cả nằm trong thư mục `videos/` với tên khác nhau theo ngày tạo.

---

## 10. Hỗ trợ thêm

Nếu gặp lỗi trong quá trình cài đặt hoặc tạo video, hãy gửi lại thông báo lỗi đầy đủ cho AI coding agent bạn đang dùng và yêu cầu nó đọc `AGENTS.md` trước khi sửa.
