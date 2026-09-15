# Buddha Dana Udhyog - Business Management System

## Architecture

```
bdu_cms/
├── frontend/          (this directory - React/Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/           (Express/MongoDB API server)
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── seed.ts
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your actual values:
# - MONGODB_URI
# - JWT_SECRET (generate with: openssl rand -hex 32)
# - ENCRYPTION_KEY (generate with: openssl rand -hex 32)
# - ADMIN_PASSWORD (set a strong password)

# Create admin user
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend  # (or root of this project)
npm install
npm run dev
```

### Environment Variables

See `backend/.env.example` for all required variables.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token signing
- `ENCRYPTION_KEY` - Key for AES-256-GCM vault encryption
- `ADMIN_EMAIL` - Admin email for seed script
- `ADMIN_PASSWORD` - Admin password for seed script
- `N8N_BASE_URL` - n8n instance URL (optional)
- `N8N_API_KEY` - n8n API key (optional)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (email, password)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Analytics
- `GET /api/analytics/summary` - Dashboard KPIs
- `GET /api/analytics/trend` - Time series data
- `GET /api/analytics/categories` - Category breakdowns
- `GET /api/analytics/top-customers` - Top customers
- `GET /api/analytics/top-products` - Top products

### Data Import
- `POST /api/import/sales` - Import sales data
- `POST /api/import/purchases` - Import purchase data
- `POST /api/import/expenses` - Import expense data

### Files
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/folders` - List folders
- `POST /api/files/folders` - Create folder
- `PUT /api/files/folders/:id` - Rename folder
- `DELETE /api/files/folders/:id` - Delete folder

### Vault
- `GET /api/vault` - List credentials
- `POST /api/vault` - Create credential
- `PUT /api/vault/:id` - Update credential
- `DELETE /api/vault/:id` - Delete credential
- `POST /api/vault/:id/reveal` - Reveal password (admin only)

### Audit Logs
- `GET /api/audit-logs` - List audit logs

### Users (admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### n8n Integration
- `GET /api/n8n/workflows` - List workflows
- `GET /api/n8n/status` - Check connection status

## Security

- Passwords hashed with bcrypt (12 rounds)
- Vault credentials encrypted with AES-256-GCM
- JWT-based authentication
- Role-based authorization (ADMIN/STAFF)
- All sensitive operations audit logged
- Server-side validation on all inputs
- File upload restrictions (type and size)
- CORS configured for specific origin
