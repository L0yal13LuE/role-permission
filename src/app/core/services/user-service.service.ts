import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MockDataService } from './mock-data.service';
import {
  Application, Company, Permission, Role, User, Enrollment,
  CompanyApplication, CompanyApplicationMode, UserRole, DashboardStats,
  CreateApplicationRequest, CreateRoleRequest, CreatePermissionRequest,
  AssignPermissionsRequest, AssignRoleRequest, CreateUserRequest,
  CreateCompanyRequest, CreateEnrollmentRequest, ApproveEnrollmentResponse,
  UpdateModeRequest, UpdateDefaultRoleRequest, PermissionCheck,
} from '../models';

const MOCK_DELAY = 300;

// Unwrap { data: T, meta: {} } or pass-through if not wrapped
function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) return (res as any).data as T;
  return res as T;
}

// ── API response shapes ──────────────────────────────────────────────

interface ApiAppResponse {
  id: string; nameTH: string; nameEN: string; isActive: boolean;
  baseUrl?: string; routePath?: string; appCode?: string; createdAt?: string;
}

interface ApiRoleItem {
  id: string; name: string; description?: string; isActive: boolean; createdAt?: string;
}
interface ApiRolesResponse { appId: string; roles: ApiRoleItem[]; }

interface ApiPermissionDto {
  permissionId: string; applicationId: string; resource: string; action: string;
  displayNameTH?: string; displayNameEN?: string; permissionGroup?: string;
}
interface ApiPermissionsResponse { applicationId: string; permissions: ApiPermissionDto[]; }

interface ApiRolePermItem { permissionId: string; resource: string; action: string; }
interface ApiRolePermissionsResponse { roleId: string; permissions: ApiRolePermItem[]; }

// ── Mappers ──────────────────────────────────────────────────────────

function mapApp(a: ApiAppResponse): Application {
  return {
    application_id: a.id, name_th: a.nameTH, name_en: a.nameEN,
    is_active: a.isActive, base_url: a.baseUrl ?? '', app_code: a.appCode ?? '',
  };
}

function mapRole(r: ApiRoleItem, appId: string, companyId?: string | null): Role {
  return {
    role_id: r.id, application_id: appId, name: r.name,
    is_active: r.isActive, company_id: companyId ?? null,
  };
}

function mapPermission(p: ApiPermissionDto): Permission {
  return {
    permission_id: p.permissionId, application_id: p.applicationId,
    resource: p.resource, action: p.action,
    display_name_th: p.displayNameTH ?? `${p.resource}:${p.action}`,
    display_name_en: p.displayNameEN ?? `${p.resource}:${p.action}`,
    permission_group: p.permissionGroup ?? p.resource,
  };
}

function mapRolePermItem(p: ApiRolePermItem, appId: string): Permission {
  return {
    permission_id: p.permissionId, application_id: appId,
    resource: p.resource, action: p.action,
    display_name_th: `${p.resource}:${p.action}`,
    display_name_en: `${p.resource}:${p.action}`,
    permission_group: p.resource,
  };
}

@Injectable({ providedIn: 'root' })
export class UserServiceApi {
  private http = inject(HttpClient);
  private mock = inject(MockDataService);
  private base = environment.apiBaseUrl;
  useMock = environment.useMock;

  // ── Applications ────────────────────────────────────────────────

  getApplications(): Observable<Application[]> {
    if (this.useMock) return of([...this.mock.applications]).pipe(delay(MOCK_DELAY));
    return this.http.get<unknown>(`${this.base}/apps`).pipe(
      map(res => (unwrap<ApiAppResponse[]>(res)).map(mapApp))
    );
  }

  getApplication(id: string): Observable<Application> {
    if (this.useMock) {
      const app = this.mock.applications.find(a => a.application_id === id);
      return app ? of({ ...app }).pipe(delay(MOCK_DELAY)) : throwError(() => ({ status: 404 }));
    }
    return this.http.get<unknown>(`${this.base}/apps/${id}`).pipe(
      map(res => mapApp(unwrap<ApiAppResponse>(res)))
    );
  }

  createApplication(req: CreateApplicationRequest): Observable<Application> {
    if (this.useMock) {
      const app: Application = { application_id: crypto.randomUUID(), ...req, is_active: true };
      this.mock.applications.push(app);
      return of({ ...app }).pipe(delay(MOCK_DELAY));
    }
    const body = { nameTH: req.name_th, nameEN: req.name_en, appCode: req.app_code, baseUrl: req.base_url };
    return this.http.post<unknown>(`${this.base}/apps`, body).pipe(
      map(res => {
        const created = unwrap<{ id: string }>(res);
        return { application_id: created.id, name_th: req.name_th, name_en: req.name_en, is_active: true, base_url: req.base_url ?? null, app_code: req.app_code ?? null } as Application;
      })
    );
  }

  updateApplication(id: string, req: Partial<CreateApplicationRequest>): Observable<Application> {
    if (this.useMock) {
      const idx = this.mock.applications.findIndex(a => a.application_id === id);
      if (idx < 0) return throwError(() => ({ status: 404 }));
      this.mock.applications[idx] = { ...this.mock.applications[idx], ...req };
      return of({ ...this.mock.applications[idx] }).pipe(delay(MOCK_DELAY));
    }
    const body = { nameTH: req.name_th, nameEN: req.name_en, isActive: (req as any).is_active ?? true };
    return this.http.put<unknown>(`${this.base}/apps/${id}`, body).pipe(
      map(() => ({ application_id: id, ...req } as unknown as Application))
    );
  }

  deleteApplication(id: string): Observable<void> {
    if (this.useMock) {
      this.mock.applications = this.mock.applications.filter(a => a.application_id !== id);
      return of(undefined).pipe(delay(MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.base}/apps/${id}`);
  }

  // ── Roles ────────────────────────────────────────────────────────

  getApplicationRoles(appId: string): Observable<Role[]> {
    if (this.useMock) return of(this.mock.roles.filter(r => r.application_id === appId && !r.company_id)).pipe(delay(MOCK_DELAY));
    return this.http.get<unknown>(`${this.base}/admin/apps/${appId}/roles`).pipe(
      map(res => {
        const data = unwrap<ApiRolesResponse>(res);
        return (data.roles ?? []).map(r => mapRole(r, appId, null));
      })
    );
  }

  getCompanyRoles(companyId: string, appId: string): Observable<Role[]> {
    if (this.useMock) return of(this.mock.roles.filter(r => r.application_id === appId && r.company_id === companyId)).pipe(delay(MOCK_DELAY));
    return this.http.get<unknown>(`${this.base}/admin/companies/${companyId}/apps/${appId}/roles`).pipe(
      map(res => {
        const data = unwrap<ApiRolesResponse>(res);
        return (data.roles ?? []).map(r => mapRole(r, appId, companyId));
      })
    );
  }

  getAllRolesByApp(appId: string): Observable<Role[]> {
    if (this.useMock) return of(this.mock.roles.filter(r => r.application_id === appId)).pipe(delay(MOCK_DELAY));
    return this.http.get<unknown>(`${this.base}/admin/apps/${appId}/roles`).pipe(
      map(res => {
        const data = unwrap<ApiRolesResponse>(res);
        return (data.roles ?? []).map(r => mapRole(r, appId, null));
      })
    );
  }

  createRole(appId: string, req: CreateRoleRequest): Observable<Role> {
    if (this.useMock) {
      const role: Role = { role_id: crypto.randomUUID(), application_id: appId, company_id: req.company_id ?? null, name: req.name, is_active: true };
      this.mock.roles.push(role);
      return of({ ...role }).pipe(delay(MOCK_DELAY));
    }
    const body = { roles: [{ name: req.name, description: '' }] };
    return this.http.post<unknown>(`${this.base}/admin/apps/${appId}/roles`, body).pipe(
      map(res => {
        const data = unwrap<{ roleIds: string[] }>(res);
        return { role_id: data.roleIds[0], application_id: appId, name: req.name, is_active: true, company_id: null } as Role;
      })
    );
  }

  updateRole(appId: string, roleId: string, req: Partial<CreateRoleRequest>): Observable<Role> {
    if (this.useMock) {
      const idx = this.mock.roles.findIndex(r => r.role_id === roleId);
      if (idx < 0) return throwError(() => ({ status: 404 }));
      this.mock.roles[idx] = { ...this.mock.roles[idx], ...req };
      return of({ ...this.mock.roles[idx] }).pipe(delay(MOCK_DELAY));
    }
    const body = { roles: [{ roleId, name: req.name, description: '', isActive: (req as any).is_active ?? true }] };
    return this.http.put<unknown>(`${this.base}/admin/apps/${appId}/roles`, body).pipe(
      map(() => ({ role_id: roleId, application_id: appId, name: req.name ?? '', is_active: true, company_id: null } as Role))
    );
  }

  deleteRole(appId: string, roleId: string): Observable<void> {
    if (this.useMock) {
      this.mock.roles = this.mock.roles.filter(r => r.role_id !== roleId);
      return of(undefined).pipe(delay(MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.base}/admin/apps/${appId}/roles/cancel`, {
      body: { roleIds: [roleId] }
    });
  }

  // ── Permissions ──────────────────────────────────────────────────

  getApplicationPermissions(appId: string): Observable<Permission[]> {
    if (this.useMock) return of(this.mock.permissions.filter(p => p.application_id === appId)).pipe(delay(MOCK_DELAY));
    return this.http.get<unknown>(`${this.base}/apps/${appId}/permissions`).pipe(
      map(res => {
        const data = unwrap<ApiPermissionsResponse>(res);
        return (data.permissions ?? []).map(mapPermission);
      })
    );
  }

  createPermission(appId: string, req: CreatePermissionRequest): Observable<Permission> {
    if (this.useMock) {
      const perm: Permission = {
        permission_id: crypto.randomUUID(), application_id: appId,
        resource: req.resource, action: req.action,
        display_name_th: req.display_name_th ?? `${req.resource}:${req.action}`,
        display_name_en: req.display_name_en ?? `${req.resource}:${req.action}`,
        permission_group: req.permission_group ?? req.resource,
      };
      this.mock.permissions.push(perm);
      return of({ ...perm }).pipe(delay(MOCK_DELAY));
    }
    const body = {
      resource: req.resource, action: req.action,
      displayNameTH: req.display_name_th, displayNameEN: req.display_name_en,
      permissionGroup: req.permission_group,
    };
    return this.http.post<unknown>(`${this.base}/apps/${appId}/permissions`, body).pipe(
      map(res => mapPermission(unwrap<ApiPermissionDto>(res)))
    );
  }

  deletePermission(appId: string, permId: string): Observable<void> {
    if (this.useMock) {
      this.mock.permissions = this.mock.permissions.filter(p => p.permission_id !== permId);
      return of(undefined).pipe(delay(MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.base}/apps/${appId}/permissions/${permId}`);
  }

  // ── Role ↔ Permission ────────────────────────────────────────────

  getRolePermissions(appId: string, roleId: string): Observable<Permission[]> {
    if (this.useMock) {
      const ids = this.mock.rolePermissions.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id);
      return of(this.mock.permissions.filter(p => ids.includes(p.permission_id))).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<unknown>(`${this.base}/apps/${appId}/roles/${roleId}/permissions`).pipe(
      map(res => {
        const data = unwrap<ApiRolePermissionsResponse>(res);
        return (data.permissions ?? []).map(p => mapRolePermItem(p, appId));
      })
    );
  }

  assignPermissionsToRole(appId: string, roleId: string, req: AssignPermissionsRequest): Observable<{ role_id: string; assigned: string[] }> {
    if (this.useMock) {
      req.permission_ids.forEach(pid => {
        if (!this.mock.rolePermissions.find(rp => rp.role_id === roleId && rp.permission_id === pid))
          this.mock.rolePermissions.push({ role_id: roleId, permission_id: pid });
      });
      return of({ role_id: roleId, assigned: req.permission_ids }).pipe(delay(MOCK_DELAY));
    }
    // API uses camelCase: { permissionIds: [...] }
    return this.http.post<unknown>(`${this.base}/apps/${appId}/roles/${roleId}/permissions`, { permissionIds: req.permission_ids }).pipe(
      map(res => {
        const data = unwrap<{ roleId: string; assigned: string[] }>(res);
        return { role_id: data.roleId, assigned: data.assigned ?? req.permission_ids };
      })
    );
  }

  removePermissionFromRole(appId: string, roleId: string, permId: string): Observable<void> {
    if (this.useMock) {
      this.mock.rolePermissions = this.mock.rolePermissions.filter(rp => !(rp.role_id === roleId && rp.permission_id === permId));
      return of(undefined).pipe(delay(MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.base}/apps/${appId}/roles/${roleId}/permissions/${permId}`);
  }

  // ── Companies ────────────────────────────────────────────────────
  // NOTE: No admin list endpoint — GET /companies/list returns current user's companies only.
  // getCompanies() is mock-only; real API would need admin-level access.

  getCompanies(): Observable<Company[]> {
    if (this.useMock) return of([...this.mock.companies]).pipe(delay(MOCK_DELAY));
    return this.http.get<Company[]>(`${this.base}/companies/list`);
  }

  getCompany(id: string): Observable<Company> {
    if (this.useMock) {
      const c = this.mock.companies.find(c => c.company_id === id);
      return c ? of({ ...c }).pipe(delay(MOCK_DELAY)) : throwError(() => ({ status: 404 }));
    }
    return this.http.get<Company>(`${this.base}/companies/${id}/detail`);
  }

  createCompany(req: CreateCompanyRequest): Observable<Company> {
    if (this.useMock) {
      const c: Company = { company_id: crypto.randomUUID(), ...req, status: 'Active' };
      this.mock.companies.push(c);
      return of({ ...c }).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Company>(`${this.base}/companies`, req);
  }

  // ── Company Applications ─────────────────────────────────────────

  getCompanyApplications(companyId: string): Observable<CompanyApplication[]> {
    if (this.useMock) {
      const entry = this.mock.companyApplications.find(ca => ca.company_id === companyId);
      return of(entry ? [...entry.apps] : []).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<CompanyApplication[]>(`${this.base}/companies/${companyId}/applications`);
  }

  subscribeCompanyToApplication(companyId: string, appId: string): Observable<CompanyApplication> {
    if (this.useMock) {
      const app = this.mock.applications.find(a => a.application_id === appId);
      if (!app) return throwError(() => ({ status: 404 }));
      const ca: CompanyApplication = { ...app, subscribed_at: new Date().toISOString() };
      let entry = this.mock.companyApplications.find(e => e.company_id === companyId);
      if (!entry) { entry = { company_id: companyId, apps: [] }; this.mock.companyApplications.push(entry); }
      if (!entry.apps.find(a => a.application_id === appId)) entry.apps.push(ca);
      return of({ ...ca }).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<CompanyApplication>(`${this.base}/companies/${companyId}/applications`, { applicationId: appId });
  }

  unsubscribeCompanyFromApplication(companyId: string, appId: string): Observable<void> {
    if (this.useMock) {
      const entry = this.mock.companyApplications.find(e => e.company_id === companyId);
      if (entry) entry.apps = entry.apps.filter(a => a.application_id !== appId);
      return of(undefined).pipe(delay(MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.base}/companies/${companyId}/applications/${appId}`);
  }

  // ── Company Application Modes ────────────────────────────────────

  getCompanyApplicationModes(companyId: string, appId: string): Observable<CompanyApplicationMode[]> {
    if (this.useMock) {
      const entry = this.mock.companyApplicationModes.find(m => m.company_id === companyId && m.application_id === appId);
      const defaultModes: CompanyApplicationMode[] = [
        { mode: 'single_user', is_active: false, default_role_id: null },
        { mode: 'multiple_user', is_active: false, default_role_id: null },
      ];
      return of(entry ? [...entry.modes] : defaultModes).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<CompanyApplicationMode[]>(`${this.base}/companies/${companyId}/applications/${appId}/modes`);
  }

  updateCompanyApplicationMode(companyId: string, appId: string, mode: string, req: UpdateModeRequest): Observable<CompanyApplicationMode> {
    if (this.useMock) {
      let entry = this.mock.companyApplicationModes.find(m => m.company_id === companyId && m.application_id === appId);
      if (!entry) {
        entry = { company_id: companyId, application_id: appId, modes: [{ mode: 'single_user', is_active: false, default_role_id: null }, { mode: 'multiple_user', is_active: false, default_role_id: null }] };
        this.mock.companyApplicationModes.push(entry);
      }
      const m = entry.modes.find(m => m.mode === mode);
      if (m) m.is_active = req.is_active;
      return of({ ...m! }).pipe(delay(MOCK_DELAY));
    }
    return this.http.patch<CompanyApplicationMode>(`${this.base}/companies/${companyId}/applications/${appId}/modes/${mode}`, { isActive: req.is_active });
  }

  updateDefaultRole(companyId: string, appId: string, mode: string, req: UpdateDefaultRoleRequest): Observable<CompanyApplicationMode> {
    if (this.useMock) {
      const entry = this.mock.companyApplicationModes.find(m => m.company_id === companyId && m.application_id === appId);
      const m = entry?.modes.find(m => m.mode === mode);
      if (m) m.default_role_id = req.role_id;
      return of({ ...m! }).pipe(delay(MOCK_DELAY));
    }
    return this.http.patch<CompanyApplicationMode>(`${this.base}/companies/${companyId}/applications/${appId}/modes/${mode}/default-role`, { roleId: req.role_id });
  }

  // ── Users ────────────────────────────────────────────────────────
  // NOTE: No admin GET /users list endpoint — UserController only exposes /users/me.
  // getUsers() and getUser() are mock-only.

  getUsers(): Observable<User[]> {
    if (this.useMock) return of([...this.mock.users]).pipe(delay(MOCK_DELAY));
    // No server-side list endpoint; fallback to mock data
    return of([...this.mock.users]).pipe(delay(MOCK_DELAY));
  }

  getUser(id: string): Observable<User> {
    if (this.useMock) {
      const u = this.mock.users.find(u => u.user_id === id);
      return u ? of({ ...u }).pipe(delay(MOCK_DELAY)) : throwError(() => ({ status: 404 }));
    }
    const u = this.mock.users.find(u => u.user_id === id);
    return u ? of({ ...u }) : throwError(() => ({ status: 404 }));
  }

  createUser(req: CreateUserRequest): Observable<User> {
    if (this.useMock) {
      const u: User = { user_id: crypto.randomUUID(), ...req, user_type: req.user_type ?? 'Customer', status: 'Active', created_at: new Date().toISOString() };
      this.mock.users.push(u);
      return of({ ...u }).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<User>(`${this.base}/users`, req);
  }

  // ── User Roles ───────────────────────────────────────────────────

  getUserRoles(userId: string): Observable<UserRole[]> {
    if (this.useMock) return of(this.mock.userRoles.filter(ur => ur.user_id === userId)).pipe(delay(MOCK_DELAY));
    return this.http.get<UserRole[]>(`${this.base}/users/${userId}/application-roles`);
  }

  assignRoleToUserInCompany(companyId: string | null, userId: string, req: AssignRoleRequest): Observable<UserRole> {
    if (this.useMock) {
      const role = this.mock.roles.find(r => r.role_id === req.role_id);
      const ur: UserRole = { user_id: userId, company_id: companyId, role_id: req.role_id, application_id: role?.application_id ?? '', assigned_at: new Date().toISOString(), role_name: role?.name, app_name: this.mock.applications.find(a => a.application_id === role?.application_id)?.name_en };
      const existing = this.mock.userRoles.findIndex(r => r.user_id === userId && r.company_id === companyId && r.application_id === ur.application_id);
      if (existing >= 0) return throwError(() => ({ status: 409, error: { error: 'Conflict: user already has a role in this app context' } }));
      this.mock.userRoles.push(ur);
      return of({ ...ur }).pipe(delay(MOCK_DELAY));
    }
    if (companyId)
      return this.http.post<UserRole>(`${this.base}/companies/${companyId}/users/${userId}/application-roles`, { roleId: req.role_id });
    return this.http.post<UserRole>(`${this.base}/users/${userId}/application-roles`, { roleId: req.role_id });
  }

  removeRoleFromUser(companyId: string | null, userId: string, roleId: string): Observable<void> {
    if (this.useMock) {
      this.mock.userRoles = this.mock.userRoles.filter(ur => !(ur.user_id === userId && ur.role_id === roleId));
      return of(undefined).pipe(delay(MOCK_DELAY));
    }
    if (companyId)
      return this.http.delete<void>(`${this.base}/companies/${companyId}/users/${userId}/application-roles/${roleId}`);
    return this.http.delete<void>(`${this.base}/users/${userId}/application-roles/${roleId}`);
  }

  // ── Enrollments ──────────────────────────────────────────────────
  // NOTE: No enrollment endpoint in the UserService API — always uses mock data.

  getEnrollments(): Observable<Enrollment[]> {
    return of([...this.mock.enrollments]).pipe(delay(MOCK_DELAY));
  }

  getEnrollment(id: string): Observable<Enrollment> {
    const e = this.mock.enrollments.find(e => e.flow_instance_id === id);
    return e ? of({ ...e }).pipe(delay(MOCK_DELAY)) : throwError(() => ({ status: 404 }));
  }

  createEnrollment(req: CreateEnrollmentRequest): Observable<Enrollment> {
    const company = this.mock.companies.find(c => c.company_id === req.company_id);
    const e: Enrollment = { flow_instance_id: crypto.randomUUID(), user_id: crypto.randomUUID(), company_id: req.company_id, status: 'Submitted', created_at: new Date().toISOString(), owner_display_name: req.display_name, company_name: company?.name_en };
    this.mock.enrollments.push(e);
    return of({ ...e }).pipe(delay(MOCK_DELAY));
  }

  approveEnrollment(id: string): Observable<ApproveEnrollmentResponse> {
    const idx = this.mock.enrollments.findIndex(e => e.flow_instance_id === id);
    if (idx >= 0) this.mock.enrollments[idx].status = 'Approved';
    return of({ flow_instance_id: id, status: 'Approved', company_requestor_id: crypto.randomUUID(), shell_role_swapped_to: 'shell-agent', invitations_sent: 2 }).pipe(delay(MOCK_DELAY));
  }

  rejectEnrollment(id: string): Observable<void> {
    const idx = this.mock.enrollments.findIndex(e => e.flow_instance_id === id);
    if (idx >= 0) this.mock.enrollments[idx].status = 'Rejected';
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  // ── Dashboard ────────────────────────────────────────────────────

  getDashboardStats(): Observable<DashboardStats> {
    if (this.useMock) return of(this.mock.getDashboardStats()).pipe(delay(MOCK_DELAY));
    return of(this.mock.getDashboardStats()).pipe(delay(MOCK_DELAY));
  }

  // ── Permission Check ─────────────────────────────────────────────

  checkPermissions(userId: string, appId: string, companyId?: string): Observable<PermissionCheck> {
    if (this.useMock) {
      const userRole = this.mock.userRoles.find(ur => ur.user_id === userId && ur.application_id === appId && (companyId ? ur.company_id === companyId : !ur.company_id));
      const role = userRole ? this.mock.roles.find(r => r.role_id === userRole.role_id) : null;
      const permIds = userRole ? this.mock.rolePermissions.filter(rp => rp.role_id === userRole.role_id).map(rp => rp.permission_id) : [];
      const perms = this.mock.permissions.filter(p => permIds.includes(p.permission_id)).map(p => `${p.resource}:${p.action}`);
      return of({ user_id: userId, company_id: companyId ?? null, application_id: appId, role: role ? { role_id: role.role_id, name: role.name } : null, permissions: perms }).pipe(delay(MOCK_DELAY));
    }
    if (companyId)
      return this.http.get<PermissionCheck>(`${this.base}/users/${userId}/companies/${companyId}/applications/${appId}/permissions`);
    return this.http.get<PermissionCheck>(`${this.base}/users/${userId}/applications/${appId}/permissions`);
  }
}
