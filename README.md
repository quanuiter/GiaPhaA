[![UIT Logo](https://i.imgur.com/WmMnSRt.png)](https://www.uit.edu.vn/ "Trường Đại học Công nghệ Thông tin")

# **Nhập môn Công nghệ Phần mềm**

## Hệ thống Quản lý Gia Phả — Family Tree Management System

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite%208-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Style-TailwindCSS-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%205-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![React Flow](https://img.shields.io/badge/Tree%20Visualization-React%20Flow-FF6B6B?style=flat-square&logo=react)](https://reactflow.dev/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%20%2B%20PostgreSQL-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)

---

## Thông tin đồ án

| Mục | Nội dung |
| --- | --- |
| **Tên đồ án** | Hệ thống Quản lý Gia Phả — Family Tree Management System |
| **Môn học** | Nhập môn Công nghệ Phần mềm |
| **Trường** | Đại học Công nghệ Thông tin – ĐHQG TP.HCM |
| **Năm học** | 2025 – 2026 |

---

## Thành viên thực hiện

| Họ và tên | MSSV | Vai trò |
| --- | --- | --- |
| Ngô Nhật Quân | 23521258 | Trưởng nhóm |
| Trương Thanh Quang | 23521295 |
| Đào Bảo Phúc | 23521192 |
| Lê Quốc Đại | 23520214 |

---

## Mục tiêu đồ án

Đồ án xây dựng hệ thống **Quản lý Gia Phả** hoàn chỉnh theo mô hình **Fullstack**, với các mục tiêu chính:

- Xây dựng REST API chuẩn bằng **Node.js + Express**, kết nối cơ sở dữ liệu **MySQL/PostgreSQL** qua **Prisma ORM**
- Phát triển giao diện người dùng hiện đại với **React 19 + Vite + TailwindCSS**
- Trực quan hóa sơ đồ gia phả thông minh với **React Flow** - tự động sắp xếp theo thế hệ
- Tích hợp **Kinship Calculator** - tính toán mối quan hệ xung hô theo văn hóa Việt Nam
- Hỗ trợ **Âm lịch** (Lunar Calendar) tự động dịch chuyển
- Phân quyền 3 vai trò: **Admin (Quản trị viên)**, **Editor (Biên tập viên)**, **Viewer (Khách)**
- Xuất **Sơ đồ Gia Phả** dạng **PDF** độ phân giải cao
- Quản lý sự kiện, kỷ niệm gia tộc với lịch Âm/Dương tương thích
- Bảo mật API với **JWT** và **Bcrypt**
- Tối ưu hiệu năng với **React Query** để caching dữ liệu

---

## Công nghệ sử dụng

### Backend — `backend/`

| Công nghệ | Phiên bản | Vai trò |
| --- | --- | --- |
| Node.js + Express | `^5.x` | Web framework |
| Prisma ORM | `^latest` | Object-Relational Mapping |
| MySQL / PostgreSQL | — | Cơ sở dữ liệu |
| jsonwebtoken | `^9.0.3` | Xác thực JWT |
| bcryptjs | `^3.0.3` | Hash mật khẩu |
| Multer | `^1.4.x` | Xử lý upload ảnh |
| CORS | `^2.8.x` | Cross-Origin Resource Sharing |
| Helmet | `^8.x` | Bảo mật HTTP headers |

### Frontend — `frontend/`

| Công nghệ | Phiên bản | Vai trò |
| --- | --- | --- |
| React | `^19.2.4` | UI framework |
| Vite | `^8.0.1` | Build tool |
| TailwindCSS | `^3.4.17` | Utility-first CSS |
| React Flow | `@xyflow/react` | Trực quan hóa sơ đồ cây |
| TanStack React Query | `^latest` | State management & API caching |
| Zustand | `^4.x` | Lightweight state management |
| html2canvas & jsPDF | `^1.x` | Xuất PDF sơ đồ |
| lunar-javascript | — | Chuyển đổi Âm/Dương lịch |
| Axios | `^1.6.x` | HTTP client |

---

## Kiến trúc hệ thống

```
Developer
    └─► git push → Local Repository
            ├─► Backend API (Node.js + Express)
            │       └─► Prisma ─► MySQL/PostgreSQL
            └─► Frontend (React + Vite)
                    └─► Axios → API

User / Browser
    └─► http://localhost:5173        (React SPA)
            └─► Axios → Backend API  (Express)
                    └─► Database (Prisma + MySQL/PostgreSQL)
```

---

## Phân quyền hệ thống

| Vai trò | Quyền truy cập |
| --- | --- |
| **Admin (Quản trị viên)** | Toàn quyền: quản lý thành viên, phê duyệt gia nhập, tham số hệ thống, xem tất cả gia phả |
| **Editor (Biên tập viên)** | Thêm/sửa/xoá thành viên, quản lý hôn nhân, sự kiện, xuất PDF |
| **Viewer (Khách)** | Chỉ được phép xem thông tin và xuất dữ liệu (không chỉnh sửa) |

---

## Chức năng chi tiết

### 👨‍👩‍👧‍👦 Trực quan hóa Gia Phả

- **Sơ đồ Gia Phả tương tác** (`Interactive Family Tree`):
  - Biểu diễn cây gia phả dưới dạng sơ đồ hình cây cổ điển
  - Tự động sắp xếp hàng và chia khoảng cách theo thế hệ (đời)
  - Phân biệt rõ ràng giữa người mang huyết thống (nhân vật chính) và người kết hôn vào họ (vợ/chồng)
  - Hỗ trợ ẩn/hiện người ngoài huyết thống để quan sát trực hệ
  - Hỗ trợ xuất sơ đồ ra file PDF với độ phân giải cao, giữ nguyên thiết kế

### 🔍 Tra cứu Quan hệ Xung Hô

- **Kinship Calculator** (Máy tính xung hô):
  - Tích hợp thuật toán tìm kiếm đường đi ngắn nhất (BFS) để phân tích mối liên kết giữa 2 thành viên bất kỳ
  - Tự động đưa ra danh xưng chính xác theo văn hóa Việt Nam (vd: Ông nội, Bác gái, Thím, Anh họ, Cháu đích tôn...)
  - Dựa trên số đời, tuổi tác và giới tính
  - Vẽ sơ đồ rẻ nhánh trực quan cho từng kết quả tra cứu

### 👤 Quản lý Thành viên & Hôn nhân

- **Hồ sơ chi tiết**:
  - Tên, ngày sinh (tự động dịch Âm lịch), quê quán, tiểu sử, hình ảnh
  - Lưu trữ dữ liệu cá nhân an toàn
- **Quản lý hôn nhân**:
  - Ghi nhận nhiều cuộc hôn nhân
  - Hỗ trợ các trạng thái: Đang sống chung, Ly hôn, Góa
- **Quản lý sự kiện qua đời**:
  - Ghi nhận ngày mất, nguyên nhân, nơi mai táng
  - Tự động sinh ra sự kiện "Ngày giỗ" vào hệ thống

### 📅 Quản lý Sự kiện & Kỷ niệm

- **Quản lý sự kiện động học** (Hợp họ, Ngày giỗ, v.v):
  - Với thông tin ngày Âm/Dương lịch đồng bộ
- **Ghi nhận thành tích, đóng góp** của từng cá nhân cho họ tộc

### 🔐 Phân quyền Đa tầng

- Phân quyền theo từng Cây Gia Phả chứ không phải toàn hệ thống
- Các vai trò:
  - **Quản trị viên (Admin)**: Toàn quyền quản lý, phê duyệt thành viên
  - **Biên tập viên (Editor)**: Thêm, sửa, xoá dữ liệu thành viên và gia phả
  - **Khách (Viewer)**: Chỉ được phép xem thông tin và xuất dữ liệu
- **Quy trình xin gia nhập (Join Request)** chuyên nghiệp

---

## Cấu trúc thư mục

```
GiaPhaA/
├── backend/                            # Backend Node.js + Express
│   └── src/
│       ├── config/
│       │   ├── database.js             # Kết nối Prisma
│       │   ├── constants.js            # Hằng số hệ thống
│       │   └── schema.prisma           # Schema database
│       ├── controllers/                # Request handlers
│       │   ├── auth.controller.js
│       │   ├── family-tree.controller.js
│       │   ├── member.controller.js
│       │   ├── kinship.controller.js
│       │   └── event.controller.js
│       ├── services/                   # Business logic
│       │   ├── auth.service.js
│       │   ├── family-tree.service.js
│       │   ├── member.service.js
│       │   ├── kinship.service.js      # Kinship Calculator
│       │   └── event.service.js
│       ├── models/                     # Database queries
│       ├── routes/                     # API routes
│       │   ├── auth.routes.js
│       │   ├── family-tree.routes.js
│       │   ├── member.routes.js
│       │   ├── kinship.routes.js
│       │   └── event.routes.js
│       ├── middlewares/
│       │   ├── auth.middleware.js      # Xác thực JWT + phân quyền
│       │   ├── upload.middleware.js    # Multer
│       │   └── error.middleware.js     # Xử lý lỗi tập trung
│       └── utils/
│           ├── jwt.js                  # Tạo/verify JWT
│           ├── password.js             # Bcrypt hashing
│           ├── lunar-calendar.js       # Chuyển đổi Âm/Dương lịch
│           └── response.js             # Chuẩn hoá response
│   ├── app.js
│   └── package.json
│
├── frontend/                           # Frontend React + Vite
│   └── src/
│       ├── pages/
│       │   ├── FamilyTreePage.jsx      # Sơ đồ gia phả chính
│       │   ├── KinshipPage.jsx         # Tra cứu xung hô
│       │   ├── MemberManagement.jsx    # Quản lý thành viên
│       │   ├── EventManagement.jsx     # Quản lý sự kiện
│       │   ├── AuthPage.jsx            # Đăng nhập/Đăng ký
│       │   └── SettingsPage.jsx        # Cài đặt & phân quyền
│       ├── components/
│       │   ├── FamilyTree/             # React Flow components
│       │   │   ├── TreeNode.jsx
│       │   │   ├── TreeEdge.jsx
│       │   │   └── TreeLayout.jsx
│       │   ├── KinshipCalculator/      # Kinship components
│       │   │   ├── SearchForm.jsx
│       │   │   ├── ResultDisplay.jsx
│       │   │   └── PathVisualization.jsx
│       │   ├── Member/                 # Member components
│       │   └── UI/                     # Reusable components
│       ├── hooks/
│       │   ├── useFamilyTree.js        # React Query for tree data
│       │   ├── useKinship.js
│       │   └── useAuth.js
│       ├── services/                   # API calling
│       │   ├── auth.api.js
│       │   ├── family-tree.api.js
│       │   ├── member.api.js
│       │   ├── kinship.api.js
│       │   └── event.api.js
│       ├── store/                      # Zustand store
│       │   ├── authStore.js
│       │   ├── treeStore.js
│       │   └── uiStore.js
│       ├── utils/
│       │   ├── lunar-calendar.js       # Lunar calendar utilities
│       │   ├── tree-layout.js          # Tree layout algorithm
│       │   └── export-pdf.js           # PDF export utilities
│       └── App.jsx
│   └── package.json
│
├── docs/
│   ├── API.md                          # API documentation
│   ├── SETUP.md                        # Setup guide
│   └── ARCHITECTURE.md                 # Architecture overview
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Hướng dẫn cài đặt & chạy local

### Yêu cầu

```
Node.js  >= 18.x
npm      >= 9.x
MySQL hoặc PostgreSQL
```

### 1. Clone repository

```bash
git clone https://github.com/quanuiter/GiaPhaA.git
cd GiaPhaA
```

### 2. Cài đặt & chạy Backend

```bash
cd backend
npm install
```

**Chỉnh sửa file `.env`:**

```env
PORT=3001
DATABASE_URL="mysql://username:password@localhost:3306/giapha_db"
# hoặc
DATABASE_URL="postgresql://username:password@localhost:5432/giapha_db"

JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"

NODE_ENV="development"
```

**Khởi tạo cơ sở dữ liệu:**

```bash
npx prisma db push
```

**(Tùy chọn) Chạy seed data để tạo dữ liệu mẫu:**

```bash
npm run seed
```

**Chạy server:**

```bash
npm run dev
```

Backend chạy tại: `http://localhost:3001`

⚠️ **Lưu ý**: Đảm bảo thư mục `uploads` đã được tạo trong backend để lưu trữ ảnh đại diện.

### 3. Cài đặt & chạy Frontend

```bash
cd frontend
npm install
```

**Chỉnh sửa file `.env`:**

```env
VITE_API_URL=http://localhost:3001/api
```

**Chạy ứng dụng:**

```bash
npm run dev
```

Frontend chạy tại: `http://localhost:5173` (hoặc URL được hiển thị trên terminal)

---

## API Endpoints tổng quan

| Nhóm | Prefix | Mô tả |
| --- | --- | --- |
| Auth | `/api/auth` | Đăng nhập, đăng xuất, refresh token |
| Gia Phả | `/api/family-trees` | CRUD gia phả |
| Thành viên | `/api/members` | CRUD thành viên, quản lý hôn nhân |
| Xung hô | `/api/kinship` | Tra cứu quan hệ, danh xưng |
| Sự kiện | `/api/events` | Quản lý sự kiện, ngày giỗ, kỷ niệm |
| Người dùng | `/api/users` | Quản lý tài khoản, phân quyền |
| Xuất | `/api/export` | Xuất PDF, xuất dữ liệu |

---

## Tính năng nổi bật

### 🌳 Sơ đồ Gia Phả Thông minh

- Hiển thị cây gia phả dưới dạng sơ đồ hình cây cổ điển
- Tự động sắp xếp theo thế hệ với khoảng cách tối ưu
- Phân biệt người mang huyết thống và người kết hôn vào họ
- Ẩn/hiện linh hoạt các nhánh
- Xuất PDF chất lượng cao

### 🔗 Máy tính Xung Hô

- Tính toán mối quan hệ chính xác giữa 2 thành viên bất kỳ
- Danh xưng theo chuẩn văn hóa Việt Nam
- Hiển thị đường dẫn quan hệ trực quan
- Hỗ trợ nhiều loại quan hệ phức tạp

### 📅 Lịch Âm/Dương Tích hợp

- Tự động chuyển đổi giữa lịch Âm và Dương
- Quản lý ngày kỷ niệm, ngày giỗ tự động
- Hỗ trợ thêm sự kiện gia tộc

### 🔐 Phân quyền Linh hoạt

- 3 vai trò: Admin, Editor, Viewer
- Phân quyền theo từng gia phả
- Quy trình xin gia nhập chuyên nghiệp

---

## Hướng phát triển

- [ ] Tích hợp **thông báo email** khi có yêu cầu gia nhập
- [ ] Thêm **ứng dụng mobile** (React Native)
- [ ] Tích hợp **OAuth** cho đăng nhập xã hội
- [ ] Nâng cấp thuật toán layout cây với **Dagre** hoặc **Elk**
- [ ] Thêm **comment & discussion** trên thành viên
- [ ] Hỗ trợ **import/export** từ các định dạng khác

---

## Liên hệ

Mọi thắc mắc vui lòng liên hệ nhóm thực hiện qua **Issues** của repository.

---

**© 2025–2026 – UIT · Nhập môn CNPM · ĐHQG TP.HCM**
