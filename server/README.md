# ⚙️ Aachi Vanthachu — Backend Service

> Robust Express 5 + Node.js REST API service with MongoDB persistence for **Aachi Vanthachu Magazine ERP**.

For complete system documentation, architecture diagrams, and desktop packaging, please refer to the [Main Repository README](../README.md).

---

## 🛠 Tech Stack

- **Runtime**: [Node.js (v18+ LTS)](https://nodejs.org/)
- **Framework**: [Express 5.2](https://expressjs.com/)
- **Database ODM**: [Mongoose 9.0](https://mongoosejs.com/)
- **Authentication**: JWT (`jsonwebtoken`) in HTTP-only cookies + `bcryptjs`
- **Security**: `helmet`, `cors`, `cookie-parser`
- **Data Export & Utilities**: `exceljs`, `multer`

---

## 🔌 API Route Groups

| Base Route | Description | File |
|:---|:---|:---|
| `/api/auth` | Login, logout, session status, initial admin creation | [`routes/auth.js`](./routes/auth.js) |
| `/api/admin` | Comprehensive ERP operations (Customers, Subscriptions, Ads, Inventory, Invoices, Backups, Analytics) | [`routes/admin.js`](./routes/admin.js) |
| `/api/customer` | Customer self-service magazine catalog and subscription requests | [`routes/customer.js`](./routes/customer.js) |
| `/api/health` | Service and MongoDB connectivity health check | [`index.js`](./index.js) |
| `/api/settings/license` | Local hardware license synchronization | [`index.js`](./index.js) |

---

## 🚀 Running the Server

```bash
# Install dependencies
npm install

# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Seed database with sample data & default admin credentials
npm run seed
```
