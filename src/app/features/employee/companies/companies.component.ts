import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoContextService } from '../../../core/services/demo-context.service';
import { DemoDataService, ApiCompanyListItem } from '../../../core/services/demo-data.service';
import { switchMap, forkJoin } from 'rxjs';

interface Company {
  id: string; name: string; code: string;
  services: string[]; members: number; status: string;
}

const MOCK_COMPANIES: Company[] = [
  { id: 'co01', name: 'SCG Group',              code: 'SCG', services: ['FX','TBP','ECI'], members: 12, status: 'Active'   },
  { id: 'co02', name: 'PTT Group',              code: 'PTT', services: ['FX','TBP'],       members: 8,  status: 'Active'   },
  { id: 'co03', name: 'CP Group',               code: 'CP',  services: ['FX'],             members: 5,  status: 'Active'   },
  { id: 'co04', name: 'Charoen Pokphand Foods', code: 'CPF', services: ['TBP','ECI'],      members: 7,  status: 'Active'   },
  { id: 'co05', name: 'True Corporation',       code: 'TRU', services: ['FX'],             members: 3,  status: 'Inactive' },
];

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Companies</div>
          <div class="ss">รายชื่อบริษัทและ service ที่ใช้งาน</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          @if (loading()) {
            <span style="font-size:12px;color:#64748B">⏳ กำลังโหลด...</span>
          }
          @if (apiError()) {
            <span class="badge b-red" style="font-size:11px">⚠️ {{ apiError() }}</span>
          }
          <div class="search-box" style="width:220px">
            <span class="search-icon">🔍</span>
            <input [(ngModel)]="q" placeholder="ค้นหาบริษัท...">
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>บริษัท</th>
              <th>Code</th>
              <th>Services</th>
              <th class="center">Members</th>
              <th class="center">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (co of filtered(); track co.id) {
              <tr>
                <td><div style="font-weight:600;font-size:13px">{{ co.name }}</div></td>
                <td><span class="mono badge b-inactive">{{ co.code }}</span></td>
                <td>
                  <div style="display:flex;gap:4px;flex-wrap:wrap">
                    @for (svc of co.services; track svc) {
                      <span class="badge b-blue">{{ svc }}</span>
                    }
                    @if (co.services.length === 0) { <span style="color:#94A3B8;font-size:12px">—</span> }
                  </div>
                </td>
                <td class="center"><strong>{{ co.members }}</strong></td>
                <td class="center">
                  <span class="badge" [class]="co.status === 'Active' ? 'b-active' : 'b-inactive'">
                    {{ co.status === 'Active' ? '● Active' : '○ Inactive' }}
                  </span>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="5">
                <div class="empty-state">
                  <div class="empty-icon">🏢</div>
                  <div class="empty-title">ไม่พบบริษัท</div>
                </div>
              </td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`.center { text-align: center; }`],
})
export class CompaniesComponent implements OnInit {
  private apiMode = inject(ApiModeService);
  private demoCtx = inject(DemoContextService);
  private data    = inject(DemoDataService);

  q = '';
  loading  = signal(false);
  apiError = signal<string | null>(null);
  companies = signal<Company[]>(MOCK_COMPANIES);

  filtered = computed(() => {
    const sq = this.q.toLowerCase();
    return this.companies().filter(c =>
      !sq || c.name.toLowerCase().includes(sq) || c.code.toLowerCase().includes(sq)
    );
  });

  ngOnInit() {
    if (this.apiMode.isReal()) this.loadReal();
  }

  private loadReal() {
    this.loading.set(true);
    this.apiError.set(null);

    this.demoCtx.bootstrap().pipe(
      switchMap(() => this.data.listCompanies())
    ).subscribe({
      next: res => {
        const items = res.companies ?? [];
        this.companies.set(
          items.map(c => ({
            id:      c.companyId,
            name:    c.companyNameTH,
            code:    c.juristicId?.slice(0, 6) ?? '—',
            services: [],   // not returned by list endpoint — would need per-company call
            members: 0,
            status:  'Active',
          }))
        );
        this.loading.set(false);
      },
      error: err => {
        this.apiError.set(err?.status === 401 ? 'ไม่ได้ล็อกอิน' : `Error ${err?.status}`);
        this.loading.set(false);
      },
    });
  }
}
