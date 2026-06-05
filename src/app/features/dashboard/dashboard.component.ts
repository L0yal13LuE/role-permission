import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserServiceApi } from '../../core/services/user-service.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Dashboard</div>
          <div class="ss">ภาพรวมระบบ Role &amp; Permission Management</div>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div style="text-align:center;padding:48px;color:var(--slate-400)">Loading…</div>
    } @else if (stats()) {
      <!-- Stats Grid -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--orange-bg)">🚀</div>
          <div class="stat-lbl">Applications</div>
          <div class="stat-val">{{ stats()!.total_applications }}</div>
          <div class="stat-note">Registered apps</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#EFF6FF">🛡</div>
          <div class="stat-lbl">Roles</div>
          <div class="stat-val">{{ stats()!.total_roles }}</div>
          <div class="stat-note">Across all apps</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#F5F3FF">🔑</div>
          <div class="stat-lbl">Permissions</div>
          <div class="stat-val">{{ stats()!.total_permissions }}</div>
          <div class="stat-note">Defined permissions</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#ECFDF5">🏢</div>
          <div class="stat-lbl">Companies</div>
          <div class="stat-val">{{ stats()!.total_companies }}</div>
          <div class="stat-note">Tenant companies</div>
        </div>
      </div>

      <div class="g2" style="margin-bottom:20px">
        <div class="stat-card" style="display:flex;align-items:center;gap:16px;padding:16px 20px">
          <div class="stat-icon" style="background:#EFF6FF;margin-bottom:0">👥</div>
          <div>
            <div class="stat-lbl">Total Users</div>
            <div class="stat-val">{{ stats()!.total_users }}</div>
          </div>
        </div>
        <div class="stat-card" [style.border-left]="stats()!.pending_enrollments > 0 ? '4px solid var(--orange)' : ''"
             style="display:flex;align-items:center;gap:16px;padding:16px 20px">
          <div class="stat-icon" style="background:var(--orange-bg);margin-bottom:0">📋</div>
          <div>
            <div class="stat-lbl">Pending Enrollments</div>
            <div class="stat-val">{{ stats()!.pending_enrollments }}</div>
            @if (stats()!.pending_enrollments > 0) {
              <div class="stat-note" style="color:var(--orange-dk)">
                <a routerLink="/enrollments" style="color:inherit;font-weight:700">Review →</a>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <div class="card-hd">
          <div>
            <div class="card-title">Quick Actions</div>
            <div class="card-sub">จัดการระบบได้อย่างรวดเร็ว</div>
          </div>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
            @for (action of quickActions; track action.route) {
              <a [routerLink]="action.route" class="quick-action-card">
                <div class="qa-icon">{{ action.icon }}</div>
                <div class="qa-title">{{ action.title }}</div>
                <div class="qa-desc">{{ action.desc }}</div>
              </a>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .quick-action-card {
      border: 2px solid var(--slate-200); border-radius: var(--r); padding: 16px;
      cursor: pointer; transition: all .2s; background: #fff; text-decoration: none;
      display: block;
      &:hover { border-color: var(--orange); transform: translateY(-2px); box-shadow: var(--sh-md); }
    }
    .qa-icon  { font-size: 24px; margin-bottom: 8px; }
    .qa-title { font-size: 13px; font-weight: 800; color: var(--navy); margin-bottom: 3px; }
    .qa-desc  { font-size: 11.5px; color: var(--slate-500); line-height: 1.4; }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(UserServiceApi);
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);

  quickActions = [
    { icon: '🚀', title: 'Applications', desc: 'Register and manage apps', route: '/applications' },
    { icon: '🛡', title: 'Roles', desc: 'Create roles per application', route: '/roles' },
    { icon: '🔑', title: 'Permissions', desc: 'Define fine-grained permissions', route: '/permissions' },
    { icon: '🏢', title: 'Companies', desc: 'Manage tenant companies', route: '/companies' },
    { icon: '👥', title: 'Users', desc: 'Manage users and assignments', route: '/users' },
    { icon: '📋', title: 'Enrollments', desc: 'Review enrollment requests', route: '/enrollments' },
  ];

  ngOnInit() {
    this.api.getDashboardStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
