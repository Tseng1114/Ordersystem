# Project structure

- Root `*.html`: public page entry points. They stay at the root to preserve existing URLs.
- `js/`: shared browser modules, Supabase client access, UI helpers, and shop data.
- `css/`: page and component styles.
- `fragments/`: HTML fragments imported by the home page.
- `data/`: source data used by maintenance scripts.
- `public/`: static PWA assets, icons, logos, menus, and hosting headers.
- `scripts/`: build and shop-catalog maintenance scripts.
- `supabase/migrations/`: database security and schema migrations.
- `supabase/schema/`: standalone schema definitions.
- `OrdersystemLineBot/`: Supabase Edge Function for the LINE Bot.
- `docs/`: deployment and maintenance documentation.

Generated or machine-local directories such as `node_modules/`, `dist/`, `.idea/`, `.vscode/`, and virtual environments are not source code and should not be committed.
