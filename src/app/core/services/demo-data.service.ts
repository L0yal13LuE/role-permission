import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DemoContextService } from './demo-context.service';

// ── Response shapes ──────────────────────────────────────────────────

/** App catalog from Codex service (F1/F2/F3) */
export interface ApiApp {
  id: string; appCode: string | null; appName: string; isActive: boolean;
  baseUrl?: string | null; routePath?: string | null;
}

export interface ApiCompanyListItem {
  companyId: string; companyNameTH: string; companyNameEN?: string | null;
  juristicId: string; juristicType?: string | null; imageUrl?: string | null;
  isDefault: boolean; role: string;
}

export interface ApiCompanyApp {
  applicationId: string; isActive: boolean; subscribedAt: string;
}

export interface ModeDto {
  id: string; code: string; name: string; description?: string | null; sortOrder: number;
}

export interface ApiMode {
  modeId: string; code: string; name: string; isActive: boolean;
}

export interface ApiRole {
  id: string; name: string; description: string; isActive: boolean;
  modes?: string[];
}

export interface ApiPermission {
  permissionId: string; applicationId: string; resource: string; action: string;
  displayNameTH?: string; displayNameEN?: string; permissionGroup?: string;
}

export interface ApiRolePermission {
  permissionId: string; resource: string; action: string;
}

export interface ApiMember {
  seq: number; userId: string; isMe: boolean; displayName?: string;
  fullName: string; email: string; avatarURL?: string; role: string;
  activeStatus: string; joinedAt?: string;
}

export interface ApiPagedResult<T> {
  items: T[]; totalCount: number; page: number; pageSize: number;
  totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean;
}

export interface ApiRoleModeDto {
  roleModeId: string; roleId: string; modeId: string; code: string; name: string; isActive: boolean;
}

// ── Service ──────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private http      = inject(HttpClient);
  private ctx       = inject(DemoContextService);
  private base      = environment.apiBaseUrl;
  private codexBase = environment.codexBaseUrl;

  // ── Applications (F1 — now from Codex) ──────────────────────────

  getApps(): Observable<ApiApp[]> {
    return this.http.get<ApiPagedResult<ApiApp>>(
      `${this.codexBase}/app-management/apps`,
      { params: { isActive: 'true', pageSize: '100', sortBy: 'sortOrder', sortDirection: 'asc' } }
    ).pipe(map(r => r.items ?? []));
  }

  updateApp(id: string, isActive: boolean): Observable<void> {
    const status = isActive ? 'Active' : 'Inactive';
    return this.http.patch<void>(`${this.codexBase}/app-management/apps/${id}/status`, { status, description: null });
  }

  // ── Company Applications ─────────────────────────────────────────

  getCompanyApps(companyId: string): Observable<ApiCompanyApp[]> {
    return this.http.get<ApiCompanyApp[]>(`${this.base}/companies/${companyId}/applications`);
  }

  subscribeToApp(companyId: string, applicationId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/companies/${companyId}/applications`, { applicationId });
  }

  unsubscribeFromApp(companyId: string, applicationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/companies/${companyId}/applications/${applicationId}`);
  }

  getModes(): Observable<ModeDto[]> {
    return this.http.get<ModeDto[]>(`${this.base}/modes`);
  }

  createMode(req: { code: string; name: string; description?: string | null; sortOrder: number }): Observable<ModeDto> {
    return this.http.post<ModeDto>(`${this.base}/modes`, req);
  }

  updateMode(id: string, req: { name: string; description?: string | null; sortOrder: number }): Observable<ModeDto> {
    return this.http.put<ModeDto>(`${this.base}/modes/${id}`, req);
  }

  deleteMode(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/modes/${id}`);
  }

  getAppModes(appId: string): Observable<ApiMode[]> {
    return this.http.get<ApiMode[]>(`${this.base}/apps/${appId}/modes`);
  }

  setAppMode(appId: string, mode: string, isActive: boolean): Observable<ApiMode> {
    return this.http.patch<ApiMode>(`${this.base}/apps/${appId}/modes/${mode}`, { isActive });
  }

  // ── Companies ────────────────────────────────────────────────────

  listCompanies(): Observable<{ companies: ApiCompanyListItem[]; total: number }> {
    return this.http.get<{ companies: ApiCompanyListItem[]; total: number }>(`${this.base}/companies/list`);
  }

  // ── Roles ────────────────────────────────────────────────────────

  getRoles(appId: string): Observable<ApiRole[]> {
    return this.http.get<{ appId: string; roles: ApiRole[] }>(`${this.base}/admin/apps/${appId}/roles`).pipe(
      map(r => r.roles ?? [])
    );
  }

  // ── Role Modes (RoleModeMapping — 1C) ───────────────────────────

  assignRoleMode(appId: string, roleId: string, mode: string): Observable<ApiRoleModeDto> {
    return this.http.post<ApiRoleModeDto>(
      `${this.base}/admin/apps/${appId}/roles/${roleId}/modes`,
      { mode }
    );
  }

  setRoleModeActive(appId: string, roleId: string, mode: string, isActive: boolean): Observable<ApiRoleModeDto> {
    return this.http.patch<ApiRoleModeDto>(
      `${this.base}/admin/apps/${appId}/roles/${roleId}/modes/${mode}`,
      { isActive }
    );
  }

  removeRoleMode(appId: string, roleId: string, mode: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/admin/apps/${appId}/roles/${roleId}/modes/${mode}`
    );
  }

  getRolesByAppAndMode(appId: string, mode: string): Observable<ApiRole[]> {
    return this.http.get<{ appId: string; mode: string; roles: ApiRole[] }>(
      `${this.base}/apps/${appId}/modes/${mode}/roles`
    ).pipe(map(r => r.roles ?? []));
  }

  // ── Permissions ─────────────────────────────────────────────────

  getPermissions(appId: string): Observable<ApiPermission[]> {
    return this.http.get<{ applicationId: string; permissions: ApiPermission[] }>(
      `${this.base}/apps/${appId}/permissions`
    ).pipe(map(r => r.permissions ?? []));
  }

  // ── Role Permissions ─────────────────────────────────────────────

  getRolePermissions(appId: string, roleId: string): Observable<ApiRolePermission[]> {
    return this.http.get<{ roleId: string; permissions: ApiRolePermission[] }>(
      `${this.base}/apps/${appId}/roles/${roleId}/permissions`
    ).pipe(map(r => r.permissions ?? []));
  }

  assignPermissionsToRole(appId: string, roleId: string, permissionIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.base}/apps/${appId}/roles/${roleId}/permissions`, { permissionIds });
  }

  removePermissionFromRole(appId: string, roleId: string, permissionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/apps/${appId}/roles/${roleId}/permissions/${permissionId}`);
  }

  getAllRolePermissions(appId: string): Observable<Record<string, string[]>> {
    return this.http.get<{ applicationId: string; roles: { roleId: string; permissionIds: string[] }[] }>(
      `${this.base}/apps/${appId}/roles/permissions`
    ).pipe(map(r => Object.fromEntries((r.roles ?? []).map(row => [row.roleId, row.permissionIds ?? []]))));
  }

  syncRolePermissions(appId: string, roles: { roleId: string; permissionIds: string[] }[]): Observable<void> {
    return this.http.patch<void>(`${this.base}/apps/${appId}/roles/permissions`, { roles });
  }

  // ── Members ──────────────────────────────────────────────────────

  getMembers(companyId: string): Observable<ApiMember[]> {
    return this.http.get<ApiPagedResult<ApiMember>>(
      `${this.base}/corporate/${companyId}/members`, { params: { pageSize: '1000' } }
    ).pipe(map(r => r.items ?? []));
  }

  // ── User Roles ──────────────────────────────────────────────────

  getUserRolesInCompanyApp(userId: string, companyId: string, appId: string): Observable<ApiRole[]> {
    return this.http.get<ApiRole[]>(
      `${this.base}/users/${userId}/companies/${companyId}/applications/${appId}/roles`
    );
  }

  assignRoleToMember(companyId: string, userId: string, roleId: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/companies/${companyId}/users/${userId}/application-roles`,
      { roleId }
    );
  }

  removeRoleFromMember(companyId: string, userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/companies/${companyId}/users/${userId}/application-roles/${roleId}`
    );
  }

  // ── Aggregated helpers ────────────────────────────────────────────

  /** Load roles + permissions for all given appIds in parallel */
  loadRoleBuilderData(appIds: string[]): Observable<Record<string, { roles: ApiRole[]; permissions: ApiPermission[] }>> {
    const calls: Record<string, Observable<{ roles: ApiRole[]; permissions: ApiPermission[] }>> = {};
    for (const id of appIds) {
      calls[id] = forkJoin({
        roles:       this.getRoles(id),
        permissions: this.getPermissions(id),
      });
    }
    return forkJoin(calls);
  }

  /** Load member list + their roles in each subscribed app */
  loadTeamData(companyId: string, appIds: string[]): Observable<{
    members: ApiMember[];
    roles: Record<string, ApiRole[]>;
    memberRoles: Record<string, Record<string, ApiRole[]>>;
  }> {
    return forkJoin({
      members:  this.getMembers(companyId),
      appRoles: forkJoin(Object.fromEntries(appIds.map(id => [id, this.getRoles(id)]))) as Observable<Record<string, ApiRole[]>>,
    }).pipe(
      map(({ members, appRoles }) => ({
        members,
        roles: appRoles,
        memberRoles: {},
      }))
    );
  }
}
