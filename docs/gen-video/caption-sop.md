# Caption SOP: Tin tức → caption TikTok

Phase Caption chạy sau khi `spec.json` đã được kiểm tra và trước Step 7:
Coder. Mục tiêu là tạo một caption tiếng Việt có thể sao chép để đăng lên mạng
xã hội; workflow không tự đăng bài và không cần gọi API hay tra cứu trend trực
tiếp.

## Quy trình 4 bước

### Bước 1: Bóc tách “hạt nhân thông tin”

Chỉ giữ ba yếu tố đã có trong dữ liệu đầu vào:

1. Đối tượng hoặc sự việc chính.
2. Biến động hoặc số liệu gây chú ý.
3. Kết quả hoặc hậu quả.

Bỏ đoạn chuyển cảnh, lời thoại phụ và thủ tục hành chính không cần thiết.
Không tự thêm địa điểm, con số, tội danh hoặc kết luận không xuất hiện trong
`context.txt`, `plan.json`, `script/script.json` hay `spec.json`.

### Bước 2: Bình dân hóa ngôn ngữ

Viết ngắn, tự nhiên, dễ đọc với giới trẻ Việt Nam. Có thể dùng các cụm đang
quen thuộc trên mạng như “đáng chú ý”, “bất ngờ”, “điều cần biết”, “cập nhật
mới”, “đang được làm rõ”, nhưng không giật tít vượt quá dữ kiện.

- “Khởi tố, bắt tạm giam đối tượng A về hành vi vi phạm...” có thể viết thành
  “Đối tượng A bị bắt tạm giam vì...” khi nguồn đã xác nhận đúng như vậy.
- “Nghị định sửa đổi bổ sung...” có thể viết thành “Quy định mới...” khi nội
  dung nguồn nêu rõ thay đổi.
- Không dùng ngôn ngữ kết tội khi cơ quan chức năng chưa có kết luận.

### Bước 3: Dựng Hook – Content – CTA

- **Hook, dòng đầu:** đặt từ khóa SEO cùng con số, địa điểm hoặc diễn biến
  đáng chú ý trong năm từ đầu tiên; dùng `🔴` cho tin nóng/cảnh báo và `📌`
  cho chính sách, kinh tế, đời sống.
- **Content, 2–3 đoạn ngắn:** kể theo nguyên nhân → diễn biến → kết quả;
  ngắt dòng sau mỗi 1–2 câu. Với tin nóng hoặc pháp luật, luôn có câu dẫn
  nguồn như “Theo [nguồn]” hoặc trạng thái “cơ quan chức năng đang làm rõ”.
- **CTA, dòng hỏi mở:** kéo người xem chia sẻ góc nhìn hoặc cảm xúc, ví dụ
  “Mọi người nhìn nhận thế nào về cách xử lý tiếp theo?”. Không dùng câu hỏi
  đóng kiểu “Bạn có thấy đúng không?” hoặc “Bạn có đồng ý không?”.

Caption phải có từ **100–180 từ**, không mở đầu bằng “Xin chào”, “Chào mọi
người” hoặc “Hello”, và không viết thành một khối chữ dài.

### Bước 4: Hashtag và format

Mỗi caption bắt buộc có **10–15 hashtag SEO** trên một dòng riêng. Bộ hashtag
gồm `#VnNews213`, hashtag khám phá như `#tintuc`, `#tinmoi`,
`#capnhat`, hashtag nhóm tin như `#phapluat`, `#canhbao`,
`#xahoi`, `#thoisu`, `#chinhsach`, `#kinhte`, `#doisong`, cùng
4–8 hashtag cụ thể rút ra từ địa điểm, sự việc và đối tượng trong tiêu đề.
Không lặp hashtag hoặc thêm `#fyp`/`#viral` khi không liên quan. Icon
`🔴`, `⚠️`, `📌` dùng làm điểm nghỉ mắt, không thay thế dữ kiện.

## Ma trận format

### Tin nóng / pháp luật / cảnh báo

```text
🔴 NÓNG: [Sự việc + địa điểm hoặc số liệu đáng chú ý]!

Theo [nguồn], [diễn biến chính theo nguyên nhân → kết quả].
[Chi tiết hậu quả hoặc trạng thái xử lý đã được xác nhận].

⚠️ [Lời khuyên kiểm chứng hoặc trạng thái cơ quan chức năng đang làm rõ].

Mọi người nhìn nhận thế nào về diễn biến này và cách xử lý tiếp theo?
#VnNews213 #tintuc #tinmoi #capnhat #tintuc24h #canhbao #xahoi #[DiaDiem] #[SuViec] #[TuKhoaSEO]
```

### Chính sách / kinh tế / đời sống

```text
📌 ĐÁNG CHÚ Ý: [Thay đổi, mức phạt hoặc con số mới]!

Theo [nguồn], [đối tượng bị ảnh hưởng] sẽ [thay đổi đã được nêu trong nguồn].
[Hậu quả, mốc thời gian hoặc việc cần làm nếu có dữ kiện].

📌 [Nhắc người xem đối chiếu thông báo chính thức].

Anh chị em nghĩ thay đổi này sẽ tác động thế nào đến đời sống hằng ngày?
#VnNews213 #thoisu #capnhat #tintuc24h #thongtin #chinhsach #doisong #[DiaDiem] #[TuKhoaSEO]
```

## Hợp đồng artifact

Tạo file `videos/<slug>/caption.txt` bằng lệnh:

```bash
node scripts/generate-caption.mjs "<slug>"
```

Kiểm tra lại bằng:

```bash
node scripts/validate-caption.mjs \
  "videos/<slug>/caption.txt" \
  "videos/<slug>/spec.json" \
  "videos/<slug>/script/script.json"
```

Chỉ chuyển sang Coder khi file tồn tại, nằm trong khoảng 100–180 từ, có
10–15 hashtag SEO gồm `#VnNews213` và hashtag nhóm tin phù hợp, có dẫn nguồn
khi cần, và CTA là câu hỏi mở.
