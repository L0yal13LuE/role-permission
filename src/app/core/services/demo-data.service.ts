import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DemoContextService } from './demo-context.service';

// ── Response shapes ──────────────────────────────────────────────────

export interface ApiApp {
  id: string; nameTH: string; nameEN: string; isActive: boolean;
  appCode?: string | null; baseUrl?: string | null; routePath?: string | null;
}

export interface ApiCompanyListItem {
  companyId: string; companyNameTH: string; companyNameEN?: string | null;
  juristicId: string; juristicType?: string | null; imageUrl?: string | null;
  isDefault: boolean; role: string;
}

export interface ApiCompanyApp {
  applicationId: string; nameTH: string; nameEN: string;
  appCode?: string; isActive: boolean; subscribedAt: string;
}

export interface ApiMode {
  mode: string; isActive: boolean;
}

export interface ApiRole {
  id: string; name: string; description: string; isActive: boolean;
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

// ── Service ──────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private http = inject(HttpClient);
  private ctx  = inject(DemoContextService);
  private base = environment.apiBaseUrl;

  // ── Applications ─────────────────────────────────────────────────

  getApps(): Observable<ApiApp[]> {
    return this.http.get<ApiApp[]>(`${this.base}/apps`);
  }

  updateApp(id: string, isActive: boolean): Observable<void> {
    // PUT /apps/{id} — only send isActive change
    return this.http.put<void>(`${this.base}/apps/${id}`, { isActive });
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
    roles: Record<string, ApiRole[]>;       // appId → available roles
    memberRoles: Record<string, Record<string, ApiRole[]>>;  // userId → appId → roles
  }> {
    return forkJoin({
      members:  this.getMembers(companyId),
      appRoles: forkJoin(Object.fromEntries(appIds.map(id => [id, this.getRoles(id)]))) as Observable<Record<string, ApiRole[]>>,
    }).pipe(
      map(({ members, appRoles }) => ({
        members,
        roles: appRoles,
        memberRoles: {},   // lazy-load per member if needed
      }))
    );
  }
}
