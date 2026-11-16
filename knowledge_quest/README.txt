KNOWLEDGE QUEST — AUDIO EDITION 2

CÁCH CHẠY
1. Giải nén file ZIP.
2. Mở thư mục knowledge_quest bằng IntelliJ IDEA (File > Open).
3. Mở index.html.
4. Nhấn chuột phải > Open in Browser > Chrome, hoặc mở trực tiếp index.html bằng Chrome.

Không cần cài Java, Node.js hay thư viện. Game chạy trực tiếp trên trình duyệt.

NỘI DUNG GAME
Knowledge Quest hiện có 3 thế giới, mỗi thế giới gồm 3 màn chơi (tổng cộng 9 màn):

WORLD 01 — VƯƠNG QUỐC HTML
- Level 1: Thẻ HTML — nhận diện html, head, body, h1, p.
- Level 2: Xây trang web — div, a, img, ul, li, form; bắt đầu có Bug bay, gai và bệ di chuyển.
- Level 3: Trang web hoàn chỉnh — thẻ cấu trúc nâng cao, nhiều quái và bẫy hơn.

WORLD 02 — KHU RỪNG JAVASCRIPT
- Level 1: Biến và dữ liệu — let, const, var, string, number.
- Level 2: Hàm và mảng — function, return, array, push, map, filter.
- Level 3: Vòng lặp và DOM — for, while, DOM, querySelector, addEventListener, click, render.
- Phong cách nền rừng xanh, vật phẩm xanh sáng, Bug Undefined màu tím.

WORLD 03 — THÀNH TRÌ JAVA
- Level 1: Class và Object — class, new, object, field, method.
- Level 2: Kế thừa và Interface — extends, implements, super, override, abstract, interface.
- Level 3: Chinh phục Java — public, static, main, try/catch, List, JVM.
- Phong cách thành trì xanh lam, quái Exception và các chướng ngại tăng dần.

CƠ CHẾ GAME
- Mỗi màn yêu cầu thu thập đủ mảnh kiến thức rồi chạm cột mốc Mentor ở cuối đường.
- Mỗi màn có 3 mạng; chạm Bug hoặc gai sẽ mất một mạng và được bảo vệ tạm thời sau khi va chạm.
- Quái mặt đất chỉ tuần tra trong đoạn nền được gán, không đi qua hố.
- Gai chỉ được tạo nếu có mặt đất nâng đỡ toàn bộ bề rộng.
- Bệ di chuyển ngang/dọc xuất hiện ở các màn từ trung bình trở lên.
- Hoàn thành cả 3 màn trong một thế giới sẽ mở thư tri ân riêng của thế giới đó.
- Từ màn kết thúc có thể chơi lại map, sang map kế tiếp hoặc trở về bản đồ.

ĐIỀU KHIỂN
- Mũi tên trái/phải hoặc A/D: di chuyển.
- Space, mũi tên lên hoặc W: nhảy.
- Nút Tạm dừng: dừng và tiếp tục màn chơi.
- Nút Âm thanh: bật/tắt toàn bộ nhạc nền và hiệu ứng.
- Thanh VOL: điều chỉnh âm lượng từ 0% đến 100%.
- Các nút Bắt đầu, Vào Map, chọn màn, Tạm dừng, Tiếp tục, Quay lại, Thoát và các nút kết thúc đều có hiệu ứng bấm riêng.
- Âm thanh được mở khóa ngay từ thao tác bấm đầu tiên; khi tắt tiếng, cả nhạc nền lẫn hiệu ứng đều được tắt.
- Nhạc nền chiptune vui nhộn được tạo trực tiếp bằng Web Audio API, có giai điệu riêng cho HTML, JavaScript và Java.
- Hiệu ứng âm thanh: nhấn nút, nhảy, nhặt mảnh kiến thức, va chạm, bắt đầu/tiếp tục màn, tạm dừng, chiến thắng và Game Over.
- Âm thanh chỉ bắt đầu sau thao tác của người chơi để tuân thủ chính sách autoplay của trình duyệt; không cần tải file âm thanh bên ngoài.

CẤU TRÚC SOURCE
- index.html: màn hình trang chủ, bản đồ, chọn level, game và thư tri ân.
- style.css: giao diện, font chữ, bố cục và responsive.
- script.js: dữ liệu 3 thế giới, 9 level, vật phẩm, quái, bẫy, va chạm, camera, tiến trình game và hệ thống âm thanh Web Audio API.

LƯU Ý
- Giao diện tiếng Việt ưu tiên Be Vietnam Pro / Segoe UI / Arial.
- Game dùng Canvas 2D và chạy offline; nếu không có Internet, font Be Vietnam Pro có thể chuyển sang font hệ thống nhưng vẫn hiển thị dấu tiếng Việt.
