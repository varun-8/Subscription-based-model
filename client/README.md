# 🎨 Aachi Vanthachu — Frontend Client

> Modern React 19 + TypeScript + Vite Single Page Application for **Aachi Vanthachu Magazine ERP**.

For complete system documentation, architecture diagrams, backend setup, and desktop packaging, please refer to the [Main Repository README](../README.md).

---

## ⚡ Tech Stack & Libraries

- **Framework**: [React 19.2](https://react.dev/)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 7.2](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Analytics Charts**: [Chart.js](https://www.chartjs.org/) & `react-chartjs-2`
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) + `jspdf-autotable`
- **Spreadsheet Processing**: [XLSX (SheetJS)](https://sheetjs.com/)
- **Icons**: `react-icons` (Material Design Icons)

---

## 📂 Key Components (`src/components/admin/`)

The client provides 42 modular components handling enterprise operations:

| Component | Responsibility |
|:---|:---|
| [`AnalyticsView.tsx`](./src/components/admin/AnalyticsView.tsx) | BI dashboard, revenue trends, plan distributions, and renewal radars |
| [`QuickOrderView.tsx`](./src/components/admin/QuickOrderView.tsx) | Fast POS ordering workflow with real-time price & date computation |
| [`CustomersView.tsx`](./src/components/admin/CustomersView.tsx) | Filterable customer database across 38 Tamil Nadu districts & states |
| [`SubscriptionsView.tsx`](./src/components/admin/SubscriptionsView.tsx) | Multi-year plan lifecycle tracking, renewals, and date management |
| [`InvoicesView.tsx`](./src/components/admin/InvoicesView.tsx) | Professional invoice generation, payment status tracking, and PDF printing |
| [`AdvertisementsView.tsx`](./src/components/admin/AdvertisementsView.tsx) | Commercial ad placement, issue tracking, and client billing |
| [`InventoryView.tsx`](./src/components/admin/InventoryView.tsx) | Magazine print-run stock tracking, purchase ledgers, and courier entries |
| [`ReportsView.tsx`](./src/components/admin/ReportsView.tsx) | Print-ready postal dispatch sheets and Excel (`.xlsx`) data exports |
| [`DatabaseView.tsx`](./src/components/admin/DatabaseView.tsx) | Background database backup monitoring, restore, and reset panel |

---

## 🛠 Available Scripts

In the `client` directory, you can run:

```bash
# Start Vite development server with HMR on http://localhost:5173
npm run dev

# Compile TypeScript and bundle production assets into dist/
npm run build

# Run ESLint validation
npm run lint

# Preview the production build locally
npm run preview
```
