# 💕 Kỉ Niệm 1 Năm

Trải nghiệm 3D tương tác kỷ niệm 1 năm yêu nhau — 12 tháng hiển thị bằng hạt 3D rực rỡ, ảnh/video bay quanh, điều khiển bằng cử chỉ tay.

---

## Tính năng nổi bật

| Tính năng | Mô tả |
|---|---|
| **12 tháng to trai tim** | Chu so 3D tao tu 10,000 hat, chuyen sang trai tim 3D luc ket thuc |
| **Anh / video bay quanh** | Polaroid bay quy dao quanh so thang, chon de xem toan man hinh |
| **Nhan dien cu chi tay** | Ban tay mo = hon loan, nam dau = hoi tu, tro = chon anh |
| **Nhac nen** | Moi thang co the co nhac rieng |
| **Admin panel** | Giao dien quan ly tai `/admin` - tai anh/video/nhac, cau hinh tung thang |

---

## Cai dat & Chay

### Yeu cau

- Node.js 18+
- npm / pnpm

### Cac buoc

```bash
# 1. Cai dependencies
npm install

# 2. Tai model MediaPipe cho nhan dien ban tay
npm run download-model

# 3. Chay dev server
npm run dev
# Mo http://localhost:3010
```

> **Luu y:** Upload anh/video chi hoat dong khi chay `npm run dev` (Vite dev server middleware).

---

## Admin Panel

Truy cap: **http://localhost:3010/admin**
Dang nhap: `admin` / `nhiphoi00`

### Tai anh

- Keo tha file anh vao vung dashed hoac nhan "Tai len"
- Anh hien thi ngay dang thumbnail grid
- Click vao thumbnail de chon/bo chon
- Hover thumbnail xuat hien nut x de xoa

### Tai video

- Tuong tu anh, hover de preview video tu play

### Tai nhac

- Nhan "Tai nhac moi" de upload mp3/m4a/wav
- Nhan play (tam giac) de nghe thu
- Click ten track de chon lam nhac nen

### Luu cau hinh

Nhan **Luu cau hinh** de luu vao localStorage.

---

## Giao dien chinh

### Dieu huong thang

| Hanh dong | Ket qua |
|---|---|
| Nhan nut "Thang X" | Chuyen sang thang tiep theo |
| Du 12 thang | Hien thi man hinh trai tim |
| Nhan "Xem lai tu dau" | Quay lai Thang 1 |

### Cu chi tay (yeu cau camera)

| Cu chi | Hanh dong |
|---|---|
| Mo ban tay | Che do HON LOAN - hat/anh bay tan loan |
| Nam dau | Hoi tu lai - hat tao thanh so, anh quay ve quy dao |
| Gio ngon cai (giu 1.5s) | Chuyen thang tiep theo |
| Cu chi trai tim (giu 1.5s) | Chuyen sang man hinh ket |
| Tro ngon tro | Di chuyen con tro - chon anh polaroid |

### Navigation modal bang tay

- Tro + bam vung trai 25% man hinh → anh truoc
- Tro + bam vung phai 25% man hinh → anh sau
- Tro + bam vung giua → dong modal

---

## Cau truc thu muc

```
HappyAniversity/
├── public/
│   ├── photos/          # anh tai len qua admin
│   ├── videos/          # video tai len qua admin
│   ├── music/           # nhac tai len qua admin
│   └── models/          # model MediaPipe
├── components/
│   ├── AnniversaryScene.tsx
│   ├── NumberParticles.tsx
│   ├── HeartParticles.tsx
│   ├── MediaOrbit.tsx
│   ├── MediaModal.tsx
│   ├── MonthOverlay.tsx
│   ├── GestureController.tsx
│   └── AdminPanel.tsx
├── utils/
│   ├── anniversaryConfig.ts
│   └── numberPositions.ts
├── vite-plugin-upload.ts
├── App.tsx
└── types.ts
```

---

## Stack ky thuat

| Thu vien | Phien ban | Muc dich |
|---|---|---|
| React | 19 | UI framework |
| Vite | 6 | Build tool |
| Three.js + R3F | 0.181 + 9 | Rendering 3D |
| @mediapipe/tasks-vision | 0.10.3 | Nhan dien ban tay |
| Tailwind CSS | CDN | Styling |
| Google Fonts: Be Vietnam Pro | CDN | Font ho tro tieng Viet |

---

## Ghi chu ky thuat

- Config luu o `localStorage` key `anniversary_v1_config`
- Manifest cho tung loai media: `public/{photos|videos|music}/manifest.json`
- GLSL shaders: hat dung vertex shader voi easing cubicInOut, blending additive
- Gesture cursor: vi tri ngon tro inject dang PointerEvent vao canvas Three.js
- Chi chay dung tren Vite dev server - upload khong hoat dong tren hosting tinh

---

*Duoc tao bang tinh yeu*
