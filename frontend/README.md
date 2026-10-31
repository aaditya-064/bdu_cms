# Buddha Dana Udhyog — integrated frontend

A Next.js, React, TypeScript and Tailwind CSS management frontend built against the supplied Express backend. This version replaces the original layout-only delivery with real authentication and API-driven pages. There are no design-preview badges, fixed “not connected” labels or mock business records in the application.

## Replace the earlier frontend

1. Stop the old frontend process.
2. Extract this archive into a clean folder. Replace the earlier application source, rather than merging it with the demo frontend.
3. Copy your existing `.env.local` into the new `buddha-dana-frontend` folder, beside `package.json`. Keep backend secrets in the backend only.
4. Install the updated dependencies:

```bash
npm install
```

5. Start local development:

```bash
npm run dev
```

Open http://localhost:3000. Protected pages send you to `/login` when you do not have a valid backend session.

For a production build:

```bash
npm run build
npm start
```

Use `npm ci` instead of `npm install` for repeatable deployments from the included lockfile. Node.js 20.9 or later is required; use a supported Node LTS release. The Next.js development badge is supplied by `next dev` and is absent from the production server.

## Configuration

For local development, `.env.local` should contain:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_ENABLE_VAULT=false
```

Replace the port or hostname if your backend uses another address. Include `/api/v1` exactly once. Both values are public configuration. Never add JWT, database, SMTP or Cloudinary secrets to frontend variables.

For production, set the real HTTPS API URL in the hosting environment **before building**:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_ENABLE_VAULT=false
```

`NEXT_PUBLIC_` values are compiled into the client. Rebuild after changing them. In production the client does not silently fall back to localhost if the API address is missing: it displays a service configuration error.

The existing backend must run separately. Its development settings should include:

```env
NODE_ENV=development
PORT=8080
ORIGINS=http://localhost:3000
FRONT_END_URL=http://localhost:3000
```

Keep the backend's existing database, JWT, Cloudinary and SMTP settings. For production use `NODE_ENV=production`, HTTPS, and your exact frontend origin in `ORIGINS`. The backend reads `ORIGINS`, not `ALLOWED_ORIGINS`; do not add a trailing slash or spaces to the origin. Both sides must permit credentialed requests. Prefer app and API subdomains on the same domain to reduce cross-site cookie problems. Browser privacy settings can block cookies when frontend and backend use unrelated sites.

The backend's `uploads/` directory must exist and be writable for file/staff uploads. Its active route middleware writes there directly. Cloudinary and SMTP must also be configured for their respective operations.

## Implemented functionality

| Module         | Behaviour                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | Login, registration, `/auth/me` session restoration, logout, session expiry handling, focus revalidation and protected workspace                   |
| Dashboard      | Real staff/file/folder totals, staff-status counts and recent files; independent loading and failure states                                        |
| Staff          | Search, department/status filters, sorting, detail view, creation, editing, photo upload, deletion confirmation and client pagination              |
| Files          | Search, folder filter, sorting, upload, open stored file URL, rename, supported moves and deletion confirmation                                    |
| Folders        | Root/all-folder browsing, search, category filter, sorting, creation, nested contents, ancestor breadcrumbs and deletion of empty folders          |
| Account        | Real signed-in name, email, phone, role and account creation date                                                                                  |
| Vaults         | Optional module with search/filter, creation/editing/deletion and explicit password reveal/copy; disabled by default for the security reason below |

Loading states display skeletons. Empty states appear only after successful responses. Network failures and malformed API responses show errors with retry controls. Search inputs are debounced and escaped for the backend's regex queries. Requests are cancelled when filters or locations change, so older results cannot overwrite a newer search.

Pagination operates on the list returned by the backend; the backend does not implement server pagination. No fake totals, storage sizes, audit feed, revenue or manufacturing features have been introduced.

## Authentication and permissions

Axios sends credentials with every request. Login is followed by `/auth/me` to verify the browser accepted the session cookie. Tokens and secrets are not stored in local storage. Old session requests cannot restore an account after logout. Server/network failures are distinguished from known session-expiry errors, including the backend's misspelled `Unauthroized Login` message returned with HTTP 500.

| Action                      | ADMIN | DIRECTOR | USER / STAFF / SUPER_ADMIN |
| --------------------------- | ----- | -------- | -------------------------- |
| Create staff                | Yes   | Yes      | No                         |
| Edit/delete staff           | Yes   | No       | No                         |
| Manage files                | Yes   | Yes      | No                         |
| Create/delete empty folders | Yes   | Yes      | No                         |
| Access enabled vault UI     | Yes   | Yes      | No                         |

These checks mirror the supplied middleware. `SUPER_ADMIN` is not translated into `ADMIN` because the backend does not grant it those permissions. Registration creates a `USER`. There is no user-role assignment API. Ask the backend maintainer to provision the correct admin account; sign out and sign in after a role change to refresh the token.

## Existing backend limits — unchanged

This is frontend code only. The original backend and reference archives have not been modified.

1. **Public reads:** staff, file, folder and vault GET routes have no authentication middleware. The frontend requires a session before loading these screens, but that does not secure direct API access. Backend access control must be corrected before exposing sensitive company records publicly.
2. **Vault security:** the supplied backend stores vault passwords as plain strings and returns them through public GET routes. Vault navigation and all vault requests are disabled by default. Only set `NEXT_PUBLIC_ENABLE_VAULT=true` after the backend maintainer has fixed and verified authentication, authorisation and secret storage. Rebuild afterward. This flag is a UI configuration switch, not an API security boundary.
3. **Role mismatch:** the User schema accepts USER/ADMIN/SUPER_ADMIN, but permission middleware uses STAFF/ADMIN/DIRECTOR. The frontend does not invent a mapping.
4. **Broken folder updates:** the folder update handler queries the File model. The frontend does not expose folder rename/move controls or call that route.
5. **Move to root:** the file update handler ignores `parentFolder: null`. Existing files inside folders can be moved to other folders, but the root destination is omitted for those records.
6. **Incomplete account editing:** profile-image editing does not persist correctly; password-change is not routed; there is no password recovery or mounted user-management router. These controls are not shown.
7. **Uploads:** the Cloudinary helper applies an image-oriented 800×800 transformation. Verify your actual document types, original-file preservation and staff-photo uploads against the deployed backend before launch. Server rejection is shown as an error.
8. **Vault values/timestamps:** the frontend maps Government to the backend's `Governemnt` and Inactive to `inActive`. It uses name sorting because the Vault model has no automatic timestamps.
9. **Build/source differences:** the uploaded `dist` differs from TypeScript source. Build the backend from source and verify its startup/upload behaviour rather than deploying the old distribution without checking it.

The frontend is prepared for integration and deployment; the known backend security issues mean the combined system should not yet be described as production-safe.

## Code organisation

| Folder                                                                                  | Purpose                                                           |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `app/`                                                                                  | Routes, metadata, authentication pages and protected layout       |
| `components/layout/`, `components/ui/`                                                  | Shared application shell and UI components                        |
| `components/auth/`, `staff/`, `files/`, `folders/`, `vaults/`, `dashboard/`, `account/` | Feature views/forms                                               |
| `api/`                                                                                  | Credentialed Axios client and explicit module API functions       |
| `context/`, `providers/`, `hooks/`                                                      | Authentication and shared navigation state; local request helpers |
| `types/`, `utils/`                                                                      | Backend contracts, permissions, formatting and error handling     |
| `tests/`                                                                                | Isolated API contract and permission tests                        |

React Context handles shared authentication/navigation state. Forms use local state and native validation. Headless UI supplies accessible menus/dialogs. No Redux, Zustand or extra application-state framework is used. `tsx` is a development-only runner for the Node test suite.

## Verification and launch checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The 18 contract tests, TypeScript checks, ESLint and production build passed in this environment. Contract tests simulate Axios responses without contacting a real database or sending login emails. They cover cookie-session verification, exact endpoints/payloads, upload fields, role enforcement, network errors, unexpected HTML/list responses, vault gating, literal search text and safe external URLs.

The live backend at your machine was not accessible from this environment. Browser QA also remains unverified: the provided managed preview service supplies Vite-only CLI flags that Next.js rejects. No application workaround was added for that service.

Before production, test with your actual deployment:

- Sign in, refresh a protected page, sign out and confirm protected screens require a new session.
- Confirm an ADMIN can mutate records and a USER cannot. Check denied requests directly against the backend, too.
- Create/edit/delete test staff and verify the saved data after reloading.
- Upload a test file, rename it, move it to another folder, open its URL and delete it.
- Create nested folders and confirm non-empty deletion is rejected.
- Stop the backend and verify the application shows retryable errors rather than zero counts.
- Review mobile navigation, horizontally scrolling tables, keyboard focus and dialog dismissal locally.
- Verify HTTPS, cookie behaviour, database backups and the backend security fixes before exposing real records.

## Phase 5 review

The final frontend review adds locked form controls while saving, longer upload timeouts, invalid folder-response checks, and automatic mobile-drawer dismissal on desktop resize. Staff phone edits now send empty values when clearing the optional field. Vault edit forms omit clear-category/status choices that the current backend cannot persist.

Phases 1–4 and the Phase 5 code polish are implemented. Live backend integration, desktop/mobile browser verification and the backend security corrections remain release requirements; the application is not yet verified for production use.
