# [Ordersystem](https://ordersystem-46n.pages.dev/)

整合部分手搖飲連鎖店及餐廳菜單，讓大家可以在同一個地方瀏覽多家店家的菜單，並統一建立與管理訂單。

---

## 功能

- 瀏覽多家手搖飲店的菜單
- 建立訂餐活動並產生專屬連結
- 填寫、修改個人訂單
- 查看所有人的訂單彙整

---

## 使用流程

1. 進入網站，選擇要訂的店家
2. 建立訂餐活動，設定截止時間，取得訂單連結
3. 將連結分享給大家填單
4. 截止後查看訂單總覽

> 也可以透過 **LINE Bot** 輸入活動 ID 來查詢訂單總覽。

---

## 技術

| 類別 | 技術 |
|:------:|:------:|
| 前端 | HTML / CSS / JavaScript |
| 建置工具 | Vite |
| 後端 | Supabase |
| LINE Bot | LINE Messaging API |
| CI/CD | GitHub Actions |
| 部署 | GitHub Pages |


---

## 系統架構

```mermaid
graph LR
    classDef line fill:#2ecc71,stroke:#27ae60,stroke-width:2px,color:#fff,font-weight:bold;
    classDef frontend fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#fff,font-weight:bold;
    classDef automation fill:#9b59b6,stroke:#8e44ad,stroke-width:2px,color:#fff,font-weight:bold;
    classDef backend fill:#f39c12,stroke:#d35400,stroke-width:2px,color:#fff,font-weight:bold;
    classDef cloudflare fill:#e67e22,stroke:#d35400,stroke-width:2px,color:#fff,font-weight:bold;
 
    subgraph L_Group ["LINE Bot"]
        Line[LINE Official Account]
        L2[Check Orders]
        Line --- L2
    end
 
    subgraph Web_Group ["Frontend (User Interface)"]
        Index["index.html<br/>(Menus)"]
        Create["create_event.html<br/>(Create Event)"]
        Order["order.html<br/>(Fill Order)"]
        Edit["edit_order.html<br/>(Edit Order)"]
        Summary["summary.html<br/>(Summary)"]
        
        Index -->|Select shop & deadline| Create
        Create -->|Create link| Order
        Order -->|Edit| Edit
        Order -->|Submit| Summary
    end
 
    subgraph Deploy_Group ["CI/CD"]
        Repo[GitHub Repo] -->|Push Code| CFP[Cloudflare Pages]
    end
 
    subgraph DB_Group ["Backend (Supabase)"]
        Supa[(Supabase)]
        Events[Table: events]
        Orders[Table: orders]
        Supa --- Events
        Supa --- Orders
    end
 
    L2 -->|Enter order ID| Summary
    CFP -.->|Deploy| Index
    
    Create -.->|Insert| Events
    Order -.->|Insert| Orders
    Edit -.->|Update| Orders
    Summary -.->|Select/Filter| Supa
    L2 -.->|Query by event_id| Supa
 
    class Line,L2 line;
    class Index,Create,Order,Edit,Summary frontend;
    class Repo automation;
    class CFP cloudflare;
    class Supa,Events,Orders backend;
```

---

## 本地開發

```bash
git clone https://github.com/Tseng1114/Ordersystem.git
cd Ordersystem
npm install
npm run dev
```

在 `.env` 填入 Supabase 相關設定：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
