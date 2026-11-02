# AI HUB

Web app quản lý nhiều tài khoản AI (Claude, ChatGPT, Gemini), nhiều dự án và bộ nhớ dự án (CONTEXT / TASKS / DECISIONS / CHANGELOG / HANDOFF) để AI này tiếp tục công việc của AI trước. Chạy trên GitHub Pages, không cần server.

## Chế độ hoạt động
- **Offline Mode** (mặc định): dữ liệu lưu trong `localStorage` của trình duyệt. Dùng được ngay, không cần cấu hình.
- **Connected Mode**: khi cấu hình Supabase và đăng nhập, bấm *Đẩy lên cloud* / *Kéo về* trong Settings để đồng bộ.

## Bảo mật
- Không lưu mật khẩu, cookie đăng nhập AI hay API key AI trong app.
- Repo public: chỉ dùng **anon key** của Supabase (công khai theo thiết kế). Không bao giờ đặt `service_role` key hay token GitHub trong code.
- Bảo mật dữ liệu cloud dựa vào **Row Level Security** trong `supabase/schema.sql`. Bắt buộc chạy file này.

## Chạy thử trên máy
```bash
npm install
npm run dev
```
`npm run typecheck` để kiểm tra kiểu TypeScript.

## Triển khai GitHub Pages
1. Tạo repo public, đẩy toàn bộ source lên nhánh `main` (nhớ thư mục ẩn `.github`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Mỗi lần push lên `main`, workflow `.github/workflows/deploy.yml` tự build và deploy.
4. Web chạy tại `https://<username>.github.io/<tên-repo>/`.

Routing dùng `HashRouter` và `base: './'` nên không phụ thuộc tên repo và refresh trang không bị 404.

## Cấu hình Supabase (tùy chọn)
1. Tạo project tại supabase.com.
2. SQL Editor: chạy `supabase/schema.sql`.
3. Authentication → Providers: bật GitHub (cần một OAuth App trên GitHub, Callback URL lấy từ Supabase).
4. Authentication → URL Configuration: đặt Site URL và Redirect URL là địa chỉ web của bạn.
5. Repo → Settings → Secrets and variables → Actions: thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
6. Tab Actions → Run workflow để build lại.

Xem `.env.example` cho chạy local.

## Cấu trúc
```
src/pages        Dashboard, Accounts, Projects, Workspace, Activity, Settings
src/data         Provider registry (thêm nhà cung cấp AI tại đây)
src/lib          browserManager, handoff, supabase, sync
src/*Store.ts    Dữ liệu (zustand + localStorage)
supabase/        schema.sql (bảng + RLS)
```

## Lộ trình
Đã có: tài khoản AI, dự án, Workspace/Handoff, Supabase Auth + đồng bộ, Activity History.
Chưa có: File Manager, sao lưu lên repo GitHub, Cloudflare Worker, Local Browser Manager.
