# 你可以直接造訪這個網頁：  
## [https://tseng1114.github.io/Ordersystem/](https://tseng1114.github.io/Ordersystem/)
&nbsp;
# You can visit the website here: 
## [https://tseng1114.github.io/Ordersystem/](https://tseng1114.github.io/Ordersystem/)

```mermaid
graph LR
    classDef line fill:#2ecc71,stroke:#27ae60,stroke-width:2px,color:#fff,font-weight:bold;
    classDef frontend fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#fff,font-weight:bold;
    classDef automation fill:#9b59b6,stroke:#8e44ad,stroke-width:2px,color:#fff,font-weight:bold;
    classDef backend fill:#f39c12,stroke:#d35400,stroke-width:2px,color:#fff,font-weight:bold;

    subgraph L_Group ["LINE Bot Function"]
        Line[LINE Official Account]
        L1[Provide Website Link]
        L2[Check Orders]
        Line --- L1
        Line --- L2
    end

    subgraph Web_Group ["Frontend (User Interface)"]
        Index["index.html<br/>(Website and Menus)"]
        Create["create_event.html<br/>(Create Orders)"]
        Order["order.html<br/>(Fill in Orders)"]
        Summary["summary.html<br/>(Summary Orders)"]
        
        Index -->|Select shop & deadline| Create
        Create -->|Create link| Order
        Order -->|Sent| Summary
    end

    subgraph Deploy_Group ["CI/CD"]
        Repo[GitHub Repo] -->|Push Code| GHA[GitHub Actions]
        GHA -->|Vite Build & Secrets| GHP[GitHub Pages]
    end

    subgraph DB_Group ["Backend (Supabase)"]
        Supa[(Supabase)]
        Events[Table: events]
        Orders[Table: orders]
        Supa --- Events
        Supa --- Orders
    end

    L1 -->|Enter| Index
    L2 -->|Enter order ID| Summary
    GHP -.->|Deploy| Index
    
    Create -.->|Insert| Events
    Order -.->|Insert| Orders
    Summary -.->|Select/Filter| Supa

    class Line,L1,L2 line;
    class Index,Create,Order,Summary frontend;
    class Repo,GHA,GHP automation;
    class Supa,Events,Orders backend;
