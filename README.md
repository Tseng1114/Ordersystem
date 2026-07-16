# 曾可愛家族點餐系統

[線上網站](https://ordersystem-46n.pages.dev/)

一個適合家庭、朋友與小型團體使用的多人點餐 PWA。主揪建立活動後分享參與連結，其他人不需註冊即可下單、查看彙整與最新菜單。

## 主要功能

- 建立飲料或餐點活動並設定截止時間
- 產生參與連結與主揪管理連結
- 多人下單、品項彙整與自動更新
- 主揪新增、修改及刪除訂單
- 查看店家菜單與官方網站
- iPhone／Android PWA 安裝與離線頁面
- LINE Bot 查詢訂單內容

## 安全設計

- `events`、`orders` 已啟用 Supabase RLS
- 匿名使用者無法直接讀寫資料表
- 所有活動操作透過 Token-scoped RPC 執行
- 參與者使用 UUID Token，主揪使用獨立的 64 字元管理 Token
- 管理 Token 在資料庫只保存 SHA-256 雜湊
- 截止時間、欄位長度與訂購數量由資料庫函式驗證
- Cloudflare Pages 使用 CSP、HSTS 與其他安全標頭

## 專案結構

```text
ordersystem/
├─ *.html                 公開頁面入口
├─ js/                    前端 JavaScript 模組
├─ css/                   頁面與元件樣式
├─ fragments/             首頁載入的 HTML 片段
├─ data/                  店家與菜單來源資料
├─ public/                PWA、圖片、菜單與部署標頭
├─ scripts/               建置及資料維護腳本
├─ supabase/
│  ├─ migrations/         RLS 與 RPC migration
│  └─ schema/             獨立資料表 schema
├─ OrdersystemLineBot/    LINE Bot Edge Function
└─ docs/                  維護與部署文件
```

詳細說明請參考 [`docs/project-structure.md`](docs/project-structure.md)。

## 本機開發

需求：Node.js 20 以上。

```bash
git clone https://github.com/Tseng1114/Ordersystem.git
cd Ordersystem
npm install
```

複製環境變數範例並填入 Supabase 設定：

```bash
copy .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

啟動開發伺服器：

```bash
npm run dev
```

## 常用指令

```bash
npm run build
npm run preview
npm run audit:shop-catalog
npm run sync:shop-catalog
```

`sync:shop-catalog` 需要在本機 `.env` 設定 `SUPABASE_SERVICE_ROLE_KEY`。此金鑰不得放入 `VITE_` 變數或提交至 Git。

## Supabase

安全 migration 位於：

```text
supabase/migrations/202607170001_secure_event_access.sql
```

新環境需在 Supabase SQL Editor 執行 migration，再部署相同版本的前端。`events` 與 `orders` 應保持 RLS 開啟且沒有公開 Policy；`shop_catalogs` 僅保留公開唯讀 Policy。

更多資訊請參考 [`docs/rls-deployment.md`](docs/rls-deployment.md)。

## 部署

目前網站使用 Cloudflare Pages。推送至 GitHub 後由 Cloudflare 執行：

```bash
npm run build
```

輸出目錄為：

```text
dist
```

若 LINE Bot 程式有異動，需另外重新部署 `OrdersystemLineBot/supabase/functions/LineBot` Edge Function。

## 驗證

提交前建議執行：

```bash
npm run build
npm run audit:shop-catalog
npm audit --omit=dev
```
