import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ModeRole { id: string; name: string; locked: boolean; single: boolean; multiple: boolean; }

@Component({
  selector: 'app-mode-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Mode Role Configuration</div>
          <div class="ss">กำหนด role ที่ใช้งานได้ในแต่ละรูปแบบอนุมัติ</div>
        </div>
        <button class="btn btn-primary" (click)="save()">💾 บันทึก</button>
      </div>
    </div>

    @if (saved()) {
      <div class="alert alert-green" style="margin-bottom:16px">✅ บันทึกเรียบร้อย</div>
    }

    <div class="alert" style="background:#FEF3C7;border-color:#F59E0B;color:#92400E;margin-bottom:16px;font-size:12px">
      🔶 <strong>Mock-only screen</strong> — ยังไม่มี API สำหรับ platform-level mode config. Mode ที่บริษัทใช้จริงอยู่ใน <code>PATCH /companies/&#123;id&#125;/applications/&#123;appId&#125;/modes/&#123;mode&#125;</code> (per-company)
    </div>

    <div class="alert alert-info" style="margin-bottom:18px">
      ℹ️ Role ที่ล็อคไว้ไม่สามารถเปลี่ยนแปลงได้ — เป็นค่า default ของแต่ละ mode
    </div>

    <div class="g2">
      <!-- Single Mode -->
      <div class="card">
        <div class="card-hd">
          <div>
            <div class="card-title">Single User Mode</div>
            <div class="card-sub">1 คนทำรายการและอนุมัติเอง</div>
          </div>
          <span class="badge b-single">Single</span>
        </div>
        <div class="card-body">
          @for (r of roles(); track r.id) {
            <div class="role-row" [class.locked]="r.locked">
              <div class="role-info">
                <span class="badge" [class]="roleBadge(r.id)" style="margin-right:8px">{{ r.name }}</span>
                @if (r.locked) { <span class="lock-icon">🔒</span> }
              </div>
              <div class="toggle-wrap" (click)="!r.locked && toggleRole(r, 'single')">
                <div class="toggle-track" [class.on]="r.single">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Multiple Mode -->
      <div class="card">
        <div class="card-hd">
          <div>
            <div class="card-title">Multiple User Mode</div>
            <div class="card-sub">มี workflow Maker → Approver</div>
          </div>
          <span class="badge b-multiple">Multiple</span>
        </div>
        <div class="card-body">
          @for (r of roles(); track r.id) {
            <div class="role-row" [class.locked]="r.id === 'admin' || r.id === 'maker'">
              <div class="role-info">
                <span class="badge" [class]="roleBadge(r.id)" style="margin-right:8px">{{ r.name }}</span>
                @if (r.id === 'admin' || r.id === 'maker') { <span class="lock-icon">🔒</span> }
              </div>
              <div class="toggle-wrap" (click)="(r.id !== 'admin' && r.id !== 'maker') && toggleRole(r, 'multiple')">
                <div class="toggle-track" [class.on]="r.multiple">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .role-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid #F1F5F9;
      &:last-child { border-bottom: none; }
      &.locked { opacity: .65; }
    }
    .role-info { display: flex; align-items: center; }
    .lock-icon { font-size: 12px; color: #94A3B8; }
  `],
})
export class ModeConfigComponent {
  saved = signal(false);

  roles = signal<ModeRole[]>([
    { id: 'dataentry', name: 'Data Entry', locked: true,  single: true,  multiple: false },
    { id: 'admin',     name: 'Admin',      locked: false, single: false, multiple: true  },
    { id: 'maker',     name: 'Maker',      locked: false, single: false, multiple: true  },
    { id: 'approver',  name: 'Approver',   locked: false, single: false, multiple: true  },
    { id: 'viewer',    name: 'Viewer',     locked: false, single: true,  multiple: true  },
    { id: 'requester', name: 'Requester',  locked: false, single: false, multiple: true  },
  ]);

  roleBadge(id: string): string {
    const map: Record<string, string> = {
      admin: 'b-orange', maker: 'b-blue', approver: 'b-multiple',
      viewer: 'b-viewer', requester: 'b-purple', dataentry: 'b-inactive',
    };
    return map[id] ?? 'b-inactive';
  }

  toggleRole(role: ModeRole, mode: 'single' | 'multiple') {
    if (role.locked) return;
    this.roles.update(list =>
      list.map(r => r.id === role.id ? { ...r, [mode]: !r[mode] } : r)
    );
  }

  save() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }
}
