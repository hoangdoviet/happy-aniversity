# 🎄 Cây Giáng Sinh

Một trải nghiệm cây thông Noel 3D sống động, độ trung thực cao với điều khiển bằng cử chỉ tay, lắp ráp động từ hỗn loạn sang trật tự, và phong cách thẩm mỹ sang trọng với màu xanh lục bảo và vàng kim.

## 📝 Prompt

Gemini 3 trong Google AI Studio và Claude 4.5 Sonnet trong Cursor:

```
Vai trò: Bạn là chuyên gia phát triển sáng tạo 3D thành thạo React 19, TypeScript và Three.js (R3F).
Mục tiêu: Xây dựng một ứng dụng web 3D độ trung thực cao có tên "Cây Giáng Sinh Tương Tác Sang Trọng". Phong cách hình ảnh cần thể hiện sự sang trọng "kiểu Trump", với tông màu chính là xanh lục bảo đậm và vàng kim nổi bật, kèm theo hiệu ứng tỏa sáng đẳng cấp điện ảnh.
Ngăn xếp công nghệ: React 19, TypeScript, React Three Fiber, Drei, Postprocessing, Tailwind CSS.

Logic và kiến trúc lõi:
Máy trạng thái: Bao gồm hai trạng thái CHAOS (hỗn loạn, rải rác) và FORMED (hợp thành cây), với sự biến hình động giữa hai trạng thái.
Hệ thống tọa độ kép (Dual-Position System): Tất cả các phần tử (lá kim, đồ trang trí) khi khởi tạo cần được phân bổ hai tọa độ:
  ChaosPosition: Tọa độ ngẫu nhiên trong không gian hình cầu.
  TargetPosition: Tọa độ mục tiêu tạo thành hình nón của cây.
TargetPosition: Tọa độ mục tiêu tạo thành hình nón của cây.
Trong useFrame, thực hiện phép nội suy (Lerp) giữa hai tọa độ dựa trên tiến trình.
Chi tiết triển khai:
Hệ thống lá kim (Foliage): Sử dụng THREE.Points và ShaderMaterial tùy chỉnh để render một lượng lớn hạt.
Đồ trang trí (Ornaments): Sử dụng InstancedMesh để tối ưu hóa render. Chia thành các hộp quà nhiều màu (nặng), các quả cầu nhiều màu (nhẹ), các đèn điểm xuyết (cực nhẹ), gán trọng số lực vật lý khác nhau. Sử dụng Lerp để tạo hiệu ứng hoạt hình trở về vị trí mượt mà.
Xử lý hậu kỳ: Kích hoạt hiệu ứng Bloom (ngưỡng 0.8, cường độ 1.2), tạo "quầng sáng vàng kim".

Cấu hình cảnh:
Vị trí camera [0, 4, 20], sử dụng ánh sáng môi trường Lobby HDRI.
Thêm nhiều đồ trang trí là ảnh kiểu máy ảnh lấy liền (polaroid).
Sử dụng phát hiện cử chỉ tay từ hình ảnh camera, bàn tay mở đại diện cho unleash (giải phóng hỗn loạn), nắm lại thì trở về cây thông. Di chuyển tay có thể điều chỉnh góc nhìn.
```

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd grand-luxury-interactive-christmas-tree
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```



## 🎯 Usage

### Photo Upload & Sharing

1. **Upload Photos:**
   - Click "上传照片" button to select up to 22 images
   - Photos will appear as polaroids on the Christmas tree

2. **Generate Share Link:**
   - After uploading photos, click "生成分享链接"
   - Wait 2-3 seconds for the upload to complete
   - Copy the generated link and share with friends

3. **View Shared Photos:**
   - Friends can open the share link in any browser
   - Photos will automatically load on the Christmas tree
   - No login or app installation required
   - Links expire after 30 days

### Gesture Controls

1. **Position your hand** in front of the webcam (visible in top-right preview)
2. **Move your hand** to control the camera angle:
   - Left/Right: Horizontal rotation
   - Up/Down: Vertical tilt
3. **Open your hand** (spread all fingers): Unleash chaos mode
4. **Close your fist**: Restore tree to formed mode

### Mouse Controls

When no hand is detected, you can:
- **Click and drag** to rotate the view
- **Scroll** to zoom in/out
- **Right-click and drag** to pan (disabled by default)

## 🏗️ Tech Stack

### Frontend
- React 19 with TypeScript
- React Three Fiber (R3F) for 3D rendering
- Three.js for WebGL graphics
- @react-three/drei for helpers
- @react-three/postprocessing for visual effects
- MediaPipe for hand gesture detection
- Tailwind CSS for styling

### Backend (Photo Sharing)
- Vercel Serverless Functions
- Cloudflare R2 (S3-compatible object storage)
- Cloudflare KV (key-value storage)
- AWS SDK S3 Client for R2 integration

### Features
- Hand gesture control via webcam
- Dynamic state transitions (CHAOS ↔ FORMED)
- Photo upload and cloud sharing
- Temporary share links (30-day expiration)
- Instanced rendering for performance
- Bloom and post-processing effects

## 🎅 Happy Holidays!

May your code be merry and bright! 🎄✨