# iPhone PWA 測試方式

這個專案可直接作為 iPhone 主畫面 Web App 使用，不需要 Apple Developer 帳號，也不需要上架 App Store。

## 部署後安裝

1. 執行 `npm run build`，並將 `dist` 目錄部署到 Cloudflare Pages。
2. 在 iPhone 使用 Safari 開啟正式網址。PWA 必須透過 HTTPS 提供，區域網路的 HTTP 網址無法完整測試 Service Worker。
3. 點 Safari 工具列的「分享」按鈕。
4. 選擇「加入主畫面」，確認名稱後點「加入」。
5. 從 iPhone 主畫面開啟「家族點餐」，此時會以獨立 App 視窗顯示。

## 更新與離線行為

- 每次正式建置都會產生新版 `dist/sw.js`，使用者下次開啟網站時會自動取得更新。
- HTML、CSS、JavaScript、PWA 圖示及必要資料會在安裝後快取。
- 菜單及店家圖片會在第一次瀏覽後快取，避免首次安裝下載大量圖片。
- 沒有網路時可開啟已快取的頁面，但 Supabase 的建立、查詢、修改及送出訂單仍需要網路。

## 本機檢查

在電腦執行：

```powershell
npm.cmd run build
npm.cmd run preview
```

再以瀏覽器開啟 `http://localhost:4173`。瀏覽器將 localhost 視為安全環境，因此可檢查 manifest 與 Service Worker；iPhone 則應使用部署後的 HTTPS 網址測試。
