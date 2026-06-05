# APEX Platform — Role & Permission Management

Angular 21 frontend for the APEX Super App Platform's Role & Permission management system.

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | Stats overview, quick navigation |
| **Applications** | Register/manage remote apps (name, app_code, base_url) |
| **Roles** | Create global/company-specific roles + interactive permission matrix |
| **Permissions** | Manage `resource:action` permissions per application |
| **Companies** | Tenant companies, subscribed apps, and `single_user`/`multiple_user` mode config |
| **Users** | User CRUD, view/assign/remove role assignments |
| **Enrollments** | Enrollment requests — approve/reject (swaps Shell App role → ตัวแทน) |

## Mock vs Real API

Toggle is available in the sidebar:
- **🧪 Mock Mode** — in-memory data, no backend required (default)
- **🌐 Real API** — calls the User Service at the configured `apiBaseUrl`

Configure API URL in `src/environments/environment.ts`:
```ts
export const environment = {
  useMock: true,                           // false = real API
  apiBaseUrl: 'http://localhost:5000/api/user-service/v1',
};
```

## Local Development

```bash
npm install
npm start           # http://localhost:4200
```

## Build

```bash
npm run build       # production build → dist/role-permission-ui/browser/
```

## CI/CD — GitHub Actions → Cloudflare Pages

Pipeline in `.github/workflows/ci-cd.yml`:
1. **CI**: `npm ci` + `ng build --configuration=production` on every push/PR
2. **CD**: Deploy to Cloudflare Pages on `main`/`master` branch push

### Required GitHub Secrets

Add these in **Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token with **Cloudflare Pages:Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | `7e3a906db7cbb13c5dc7baa1ded4816a` |

### Create Cloudflare Pages Project (one-time)

```bash
npx wrangler pages project create role-permission \
  --production-branch=master
```

Or create it via Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.

## Project Structure

```
src/
  app/
    core/
      models/         # TypeScript interfaces (User, Role, Permission, etc.)
      services/
        mock-data.service.ts       # In-memory mock data
        user-service.service.ts    # API facade (mock + real)
        toast.service.ts           # Toast notifications
    features/
      login/          # Login page
      dashboard/      # Stats & quick actions
      applications/   # Application CRUD
      roles/          # Role CRUD + permission matrix
      permissions/    # Permission CRUD
      companies/      # Company + app subscriptions + mode config
      users/          # User CRUD + role assignments
      enrollments/    # Enrollment approve/reject flow
    layout/
      shell/          # Sidebar + topbar shell
    shared/
      toast/          # Toast notification component
  environments/
    environment.ts              # Development (mock: true)
    environment.production.ts   # Production (mock: false)
```
