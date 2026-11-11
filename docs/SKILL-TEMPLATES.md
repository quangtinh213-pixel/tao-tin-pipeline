# /templates — Danh sách video templates

## Trigger

Chạy khi người dùng nhập:

```text
/templates
```

## Nguồn dữ liệu

Đọc `TEMPLATE_REGISTRY` trong `src/templates/registry.ts` tại thời điểm chạy.
Đây là nguồn duy nhất xác định template nào đang khả dụng. Không dùng danh sách
ghi nhớ hoặc các placeholder đang được comment.

## Cách hiển thị

Gom các template theo `category` và giữ thứ tự category xuất hiện lần đầu trong
registry. Với mỗi category:

1. Hiển thị một heading cấp 3 bằng tên category viết dễ đọc, ví dụ:
   `creative` → `Creative`, `news` → `News`.
2. Bên dưới heading, trả về một bảng Markdown có đúng hai cột:

| command | description |
|---|---|
| `/gen-video --template <template-id> <nội dung>` | Mô tả ngắn bằng tiếng Việt |

Với mỗi entry trong `TEMPLATE_REGISTRY`:

1. Đưa entry vào nhóm tương ứng với `category`.
2. Giữ nguyên thứ tự xuất hiện trong registry bên trong mỗi nhóm.
3. Tạo `command` bằng đúng `id`:
   `/gen-video --template <id> <nội dung>`.
4. Viết `description` ngắn gọn bằng tiếng Việt dựa trên `name`,
   `description`, `behavior` và các biến thể thể hiện trong ID.
5. Phân biệt rõ các biến thể dark/light, có SFX/silent, fixed/hybrid/creative.
6. Với template demo-scroll, nhắc ngắn gọn rằng nội dung cần có URL demo công khai.
7. Với template article-video-demo, nói rõ nội dung bắt buộc có URL bài viết
   chứa video; pipeline dừng nếu bài không có video dùng được.
8. Với template source-led, nói rõ nội dung bắt buộc có URL công khai; template
   lấy ảnh/video làm dẫn chứng, ghi nguồn, và fallback free-style theo từng cảnh
   nếu không có media phù hợp.

Không chạy pipeline `/gen-video`, không sửa file và không đọc toàn bộ tài liệu
template chỉ để tạo danh sách.

## Xử lý lỗi

- Nếu không đọc được registry: báo đường dẫn file và dừng.
- Nếu registry không có entry: báo chưa có template khả dụng.
- Nếu một entry thiếu `id`: bỏ qua entry đó và cảnh báo ngắn sau bảng.
