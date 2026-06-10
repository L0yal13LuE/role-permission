import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoDataService, ModeDto } from '../../../core/services/demo-data.service';

interface ModeForm {
  id: string | null;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
}

const MOCK_MODES: ModeDto[] = [
  { id: '11111111-1111-1111-1111-111111111111', code: 'SingleUser',   name: 'Single User',   description: 'ผู้ใช้คนเดียวทำรายการและอนุมัติเอง', sortOrder: 1 },
  { id: '22222222-2222-2222-2222-222222222222', code: 'MultipleUser', name: 'Multiple User', description: 'มี workflow Maker → Approver',          sortOrder: 2 },
];

@Component({
  selector: 'app-modes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Modes</div>
          <div class="ss">จัดการ master data ของรูปแบบการทำงาน (Mode)</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          @if (loading()) { <span style="font-size:12px;color:#64748B">⏳ กำลังโหลด...</span> }
          @if (apiError()) { <span class="badge b-red" style="max-width:320px;white-space:normal">⚠️ {{ apiError() }}</span> }
          @if (!form()) {
            <button class="btn btn-primary" (click)="startAdd()">＋ เพิ่ม Mode</button>
          }
        </div>
      </div>
    </div>

    <!-- ── Form ─────────────────────────────────────────────────── -->
    @if (form(); as f) {
      <div class="card" style="margin-bottom:20px">
        <div class="card-hd">
          <div class="card-title">{{ f.id ? 'แก้ไข Mode' : 'เพิ่ม Mode ใหม่' }}</div>
        </div>
        <div class="card-body">
          <div class="g2" style="margin-bottom:14px">
            <div>
              <label class="form-label">Code <span style="color:#EF4444">*</span></label>
              @if (f.id) {
                <div class="form-input" style="background:#F8FAFC;color:#64748B;cursor:not-allowed">{{ f.code }}</div>
              } @else {
                <input class="form-input" [(ngModel)]="f.code" placeholder="เช่น SingleUser"
                       style="font-family:monospace">
              }
              @if (!f.id) {
                <div style="font-size:11px;color:#94A3B8;margin-top:3px">ใช้ PascalCase, ห้ามเปลี่ยนภายหลัง</div>
              }
            </div>
            <div>
              <label class="form-label">Sort Order <span style="color:#EF4444">*</span></label>
              <input class="form-input" type="number" [(ngModel)]="f.sortOrder" min="0">
            </div>
          </div>
          <div style="margin-bottom:14px">
            <label class="form-label">Name (แสดงผล) <span style="color:#EF4444">*</span></label>
            <input class="form-input" [(ngModel)]="f.name" placeholder="เช่น Single User">
          </div>
          <div style="margin-bottom:18px">
            <label class="form-label">Description</label>
            <input class="form-input" [(ngModel)]="f.description" placeholder="อธิบายรูปแบบการทำงาน (optional)">
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" [disabled]="saving() || !f.code.trim() || !f.name.trim()" (click)="save()">
              {{ saving() ? '⏳...' : (f.id ? '💾 บันทึก' : '＋ สร้าง') }}
            </button>
            <button class="btn btn-outline" [disabled]="saving()" (click)="form.set(null)">ยกเลิก</button>
          </div>
        </div>
      </div>
    }

    <!-- ── Table ─────────────────────────────────────────────────── -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:60px;text-align:center">#</th>
              <th style="width:160px">Code</th>
              <th>Name</th>
              <th>Description</th>
              <th style="width:100px"></th>
            </tr>
          </thead>
          <tbody>
            @if (modes().length === 0 && !loading()) {
              <tr><td colspan="5" style="text-align:center;color:#94A3B8;padding:32px">ไม่มีข้อมูล</td></tr>
            }
            @for (m of sortedModes(); track m.id) {
              <tr [class.row-editing]="form()?.id === m.id">
                <td style="text-align:center;color:#94A3B8;font-size:12px">{{ m.sortOrder }}</td>
                <td><span class="mono" style="font-size:12.5px;color:#034EA1">{{ m.code }}</span></td>
                <td style="font-weight:600;font-size:13px">{{ m.name }}</td>
                <td style="color:#64748B;font-size:12.5px">{{ m.description ?? '—' }}</td>
                <td>
                  <div style="display:flex;gap:6px;justify-content:flex-end">
                    <button class="btn btn-outline btn-sm" (click)="startEdit(m)"
                            [disabled]="!!form() || !!deleting()">✏️</button>
                    <button class="btn btn-danger btn-sm" (click)="delete(m)"
                            [disabled]="!!form() || deleting() === m.id">
                      {{ deleting() === m.id ? '⏳' : '🗑️' }}
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .row-editing { background: #EBF2FC; }
    .mono { font-family: monospace; }
    .btn-danger {
      padding: 4px 10px; font-size: 11.5px; border-radius: 6px;
      border: 1px solid #FCA5A5; background: #FEF2F2; color: #DC2626; cursor: pointer;
      font-weight: 600; transition: all .15s;
      &:hover:not(:disabled) { background: #FEE2E2; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
  `],
})
export class ModesComponent implements OnInit {
  readonly apiMode = inject(ApiModeService);
  private dataApi  = inject(DemoDataService);

  modes    = signal<ModeDto[]>([]);
  form     = signal<ModeForm | null>(null);
  loading  = signal(false);
  saving   = signal(false);
  deleting = signal<string | null>(null);
  apiError = signal<string | null>(null);

  sortedModes = computed(() => [...this.modes()].sort((a, b) => a.sortOrder - b.sortOrder));

  ngOnInit() {
    if (this.apiMode.isReal()) {
      this.load();
    } else {
      this.modes.set(MOCK_MODES);
    }
  }

  private load() {
    this.loading.set(true);
    this.apiError.set(null);
    this.dataApi.getModes().subscribe({
      next: modes => { this.modes.set(modes); this.loading.set(false); },
      error: err  => { this.apiError.set(`Load error: ${err?.status}`); this.loading.set(false); },
    });
  }

  startAdd() {
    const nextOrder = this.modes().length > 0
      ? Math.max(...this.modes().map(m => m.sortOrder)) + 1
      : 1;
    this.form.set({ id: null, code: '', name: '', description: '', sortOrder: nextOrder });
    this.apiError.set(null);
  }

  startEdit(m: ModeDto) {
    this.form.set({ id: m.id, code: m.code, name: m.name, description: m.description ?? '', sortOrder: m.sortOrder });
    this.apiError.set(null);
  }

  save() {
    const f = this.form();
    if (!f) return;

    if (!this.apiMode.isReal()) {
      if (f.id) {
        this.modes.update(list => list.map(m => m.id === f.id
          ? { ...m, name: f.name, description: f.description || null, sortOrder: f.sortOrder }
          : m));
      } else {
        this.modes.update(list => [...list, {
          id: crypto.randomUUID(), code: f.code, name: f.name,
          description: f.description || null, sortOrder: f.sortOrder,
        }]);
      }
      this.form.set(null);
      return;
    }

    this.saving.set(true);
    this.apiError.set(null);

    const req$ = f.id
      ? this.dataApi.updateMode(f.id, { name: f.name, description: f.description || null, sortOrder: f.sortOrder })
      : this.dataApi.createMode({ code: f.code, name: f.name, description: f.description || null, sortOrder: f.sortOrder });

    req$.subscribe({
      next: updated => {
        if (f.id) {
          this.modes.update(list => list.map(m => m.id === f.id ? updated : m));
        } else {
          this.modes.update(list => [...list, updated]);
        }
        this.saving.set(false);
        this.form.set(null);
      },
      error: err => {
        this.apiError.set(err?.error?.detail ?? err?.error?.message ?? `Save error: ${err?.status}`);
        this.saving.set(false);
      },
    });
  }

  delete(m: ModeDto) {
    if (!confirm(`ลบ Mode "${m.name}" (${m.code})?\n\nไม่สามารถลบได้ถ้ายังมี app หรือ role ที่อ้างอิงอยู่`)) return;

    if (!this.apiMode.isReal()) {
      this.modes.update(list => list.filter(x => x.id !== m.id));
      return;
    }

    this.deleting.set(m.id);
    this.apiError.set(null);
    this.dataApi.deleteMode(m.id).subscribe({
      next: () => {
        this.modes.update(list => list.filter(x => x.id !== m.id));
        this.deleting.set(null);
      },
      error: err => {
        this.apiError.set(err?.error?.detail ?? err?.error?.message ?? `Delete error: ${err?.status}`);
        this.deleting.set(null);
      },
    });
  }
}
