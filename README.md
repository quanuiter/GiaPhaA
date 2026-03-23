# HE THONG QUAN LY GIA PHA

Hệ Thống Quản Lý Gia Phả là một ứng dụng web toàn diện được thiết kế để giúp các dòng họ xây dựng, lưu trữ và trực quan hóa sơ đồ gia phả một cách khoa học. 

Dự án được tinh chỉnh đặc biệt để phù hợp với văn hóa truyền thống Việt Nam, bao gồm hỗ trợ Âm lịch, phân biệt các mối quan hệ nội ngoại phức tạp, tự động nội suy danh xưng họ hàng, và kiến trúc phân quyền chặt chẽ.

---

## TINH NANG NOI BAT

### 1. Truc quan hoa Pha do (Interactive Family Tree)
- Bieu dien cay gia pha duoi dang so do hinh nhanh cay co dien.
- Tu dong xep hang va chia khoang cach theo the he (doi).
- Phan biet ro rang giua nguoi mang huyet thong (nhan vat chinh) va nguoi ket hon vao ho (vo/chong).
- Ho tro an/hien nguoi ngoai huyet thong de quan sat truc he.
- Ho tro xuat pha do ra file PDF voi do phan giai cao, giu nguyen thiet ke.

### 2. Tra cuu quan he xung ho (Kinship Calculator)
- Tich hop thuat toan tim kiem duong di ngan nhat (BFS) de phan tich moi lien ket giua 2 thanh vien bat ky.
- Tu dong dua ra danh xung chinh xac theo van hoa Viet Nam (vi du: Ong noi, Bac gai, Thim, Anh ho, Chau dich ton...) dua tren so doi, tuoi tac va gioi tinh.
- Ve so do re nhanh truc quan cho tung ket qua tra cuu.

### 3. Quan ly thanh vien & Hon nhan
- Ho so chi tiet: Ten, ngay sinh (tu dong dich Am lich), que quan, tieu su, hinh anh.
- Quan ly hon nhan: Ghi nhan nhieu cuoc hon nhan, ho tro cac trang thai (Dang song chung, Ly hon, Goa).
- Quan ly su kien qua doi: Ghi nhan ngay mat, nguyen nhan, noi mai tang va tu dong sinh ra su kien "Ngay gio" vao he thong.

### 4. Quan ly Su kien & Thanh tich
- Quan ly su kien dong ho (Hop ho, Ngay gio, v.v) voi thong tin ngay Am/Duong lich dong bo.
- Ghi nhan thanh tich, dong gop cua tung ca nhan cho ho toc.

### 5. Phan quyen da tang (Role-Based Access Control)
- Phan quyen theo tung Cay Gia pha chu khong phai toan he thong.
- Cac vai tro:
  - Quan tri vien (Admin): Toan quyen quan ly, phe duyet thanh vien.
  - Bien tap vien (Editor): Them, sua, xoa du lieu thanh vien va pha do.
  - Khach (Viewer): Chi duoc phep xem thong tin va xuat du lieu.
- Quy trinh xin gia nhap (Join Request) chuyen nghiep.

---

## CONG NGHE SU DUNG

### Frontend
- React.js (Vite)
- Tailwind CSS
- React Flow (@xyflow/react) - Ve so do cay
- TanStack React Query - Quan ly state & API caching
- Zustand - State management
- html2canvas & jsPDF - Xuat file PDF
- lunar-javascript - Chuyen doi Am/Duong lich

### Backend
- Node.js & Express.js
- Prisma ORM
- Co so du lieu: MySQL / PostgreSQL (Tuy cau hinh Prisma)
- JsonWebToken (JWT) & Bcrypt - Xac thuc va bao mat
- Multer - Xu ly upload hinh anh

---

## HUONG DAN CAI DAT VA CHAY LOCAL

### 1. Yeu cau he thong
- Node.js (Phien ban 18.x tro len)
- npm hoac yarn
- Co so du lieu (MySQL hoac PostgreSQL tuy theo cau hinh o file `.env`)

### 2. Cai dat Backend

Buoc 1: Di chuyen vao thu muc backend
```bash
cd backend
```

Buoc 2: Cai dat thu vien
```bash
npm install
```

Buoc 3: Cau hinh bien moi truong
Tao file `.env` tu file `.env.example` (neu co) hoac tao moi voi noi dung sau:
```env
PORT=3001
DATABASE_URL="mysql://username:password@localhost:3306/giapha_db"
JWT_SECRET="your_jwt_secret_key"
```

Buoc 4: Khoi tao co so du lieu
```bash
npx prisma db push
```

(Tuy chon) Chay seed data de tao du lieu mau:
```bash
npm run seed
```

Buoc 5: Chay server
```bash
npm run dev
```
Server backend se chay tai: `http://localhost:3001`
*Luu y: Dam bao thu muc `uploads` da duoc tao trong backend de luu tru anh dai dien.*

### 3. Cai dat Frontend

Buoc 1: Di chuyen vao thu muc frontend
```bash
cd frontend
```

Buoc 2: Cai dat thu vien
```bash
npm install
```

Buoc 3: Cau hinh bien moi truong
Tao file `.env` tai thu muc frontend:
```env
VITE_API_URL=http://localhost:3001/api
```

Buoc 4: Chay ung dung
```bash
npm run dev
```
Ung dung se chay tai URL hien thi tren terminal (Thuong la `http://localhost:5173`).

---

## CAU TRUC THU MUC CHINH

```text
GiaPha/
|-- backend/
|   |-- src/
|   |   |-- controllers/    # Xu ly logic nghiep vu API
|   |   |-- middlewares/    # Xac thuc va kiem tra quyen
|   |   |-- routes/         # Dinh tuyen API
|   |   |-- prisma/         # Schema va ket noi DB
|-- frontend/
|   |-- src/
|   |   |-- components/     # UI Components (Modals, Nodes...)
|   |   |-- pages/          # Cac trang chinh (Giao dien)
|   |   |-- services/       # API calling
|   |   |-- utils/          # Thuat toan layout, helpers
|   |   |-- store/          # Zustand store
```

---

## BAN QUYEN

Du an duoc phat trien phuc vu muc dich quan ly gia pha va nghien cuu hoc tap. 
