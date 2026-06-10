# Role & Permission Demo — Domain Glossary

## Actors

**Employee**
Internal staff who access the **Admin Portal**. Configures platform-wide settings: services, roles, permissions, companies. Maps to `UserType = Employee` in UserService. See also [[UserService CONTEXT.md]].

**Customer**
End-users who access the **Super App Platform**. In the context of this demo, the Customer is specifically a ตัวแทน (Agent) — a Customer who manages a Company's service subscriptions and team member role assignments.

## Views (Demo Toggle)

This demo web shows **two distinct views** within a single application, toggled by a switch:

| View | Actor | Portal |
|---|---|---|
| **Employee view** | Employee | Admin Portal — manages services, roles, permissions, companies platform-wide |
| **Customer view** | Customer (ตัวแทน) | Super App Platform — onboards services, assigns roles to team members within their Company |

## Screens in Scope (Demo)

**Employee view (4 screens):**
1. `service-config` — เปิด/ปิด service + approval type
2. `mode-config` — กำหนด role ที่ใช้ได้ใน Single/Multiple mode
3. `role-builder` — permission matrix editor
4. `companies` — รายชื่อ company

**Customer view (3 screens):**
5. `dashboard` — overview stats + service list + team members
6. `onboarding` — 3-step wizard (เลือก service → approval type → assign roles)
7. `team` — จัดการ role ของ team members

**Reference (1 screen, shared):**
8. `db-schema` — Database schema reference

## Open / Parked

- View toggle UX: **Login page** (เลือก view แรก) + **Topbar** (switch ได้ภายในแอป) — RESOLVED
- Color scheme: ใช้ @exim/ui-kit (blue #034EA1, Exim Bank design system) — RESOLVED
- API mode toggle: **Topbar** มี switch ระหว่าง Real / Mock mode — RESOLVED
- Real mode ใช้ `withCredentials: true` interceptor (pattern จาก `gateway-credentials.interceptor.ts`) เพื่อส่ง httpOnly cookie ไปกับทุก request ที่ cross-origin
- Mock mode ใช้ in-memory mock data service (standalone ไม่ต้อง run backend)
- Real mode auth: cookie มาจากระบบอื่น (Sentinel/Exim auth) ผ่าน `withCredentials: true` — login page ของ demo คงเป็นแค่ view selector เหมือน mock mode — RESOLVED
- Real API base URL: `https://gateway-dev.exim.go.th/userservice-api/api/user-service/v1`
- @exim/ui-kit registry: `.npmrc` จาก `Frontend_SuperAppLibraryUi` ต้อง copy มาที่ project นี้
