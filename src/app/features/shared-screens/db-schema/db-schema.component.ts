import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Field  { name: string; type: string; note?: string; pk?: boolean; fk?: boolean; }
interface Table  { name: string; desc: string; fields: Field[]; }

const TABLES: Table[] = [
  {
    name: 'Users', desc: 'ผู้ใช้งานทั้งหมดในระบบ',
    fields: [
      { name: 'Id',          type: 'GUID',      pk: true },
      { name: 'Email',       type: 'NVARCHAR',  note: 'unique' },
      { name: 'DisplayName', type: 'NVARCHAR'   },
      { name: 'UserType',    type: 'ENUM',      note: "'Employee' | 'Customer'" },
      { name: 'Status',      type: 'ENUM',      note: "'Active' | 'Inactive'" },
      { name: 'CreatedAt',   type: 'DATETIME'   },
    ],
  },
  {
    name: 'Companies', desc: 'บริษัทที่ใช้งานระบบ',
    fields: [
      { name: 'Id',          type: 'GUID',     pk: true },
      { name: 'NameTH',      type: 'NVARCHAR'  },
      { name: 'NameEN',      type: 'NVARCHAR'  },
      { name: 'JuristicId',  type: 'VARCHAR',  note: 'unique' },
      { name: 'Status',      type: 'ENUM',     note: "'Active' | 'Inactive'" },
    ],
  },
  {
    name: 'Applications', desc: 'Service/App ที่ลงทะเบียนในระบบ',
    fields: [
      { name: 'Id',       type: 'GUID',    pk: true },
      { name: 'NameTH',  type: 'NVARCHAR' },
      { name: 'NameEN',  type: 'NVARCHAR' },
      { name: 'AppCode', type: 'VARCHAR',  note: 'unique, e.g. FX, TBP, ECI' },
      { name: 'BaseUrl', type: 'NVARCHAR' },
      { name: 'IsActive',type: 'BIT'      },
    ],
  },
  {
    name: 'Roles', desc: 'Role ที่กำหนดต่อ Application',
    fields: [
      { name: 'Id',            type: 'GUID',    pk: true },
      { name: 'ApplicationId', type: 'GUID',    fk: true, note: '→ Applications' },
      { name: 'CompanyId',     type: 'GUID',    fk: true, note: '→ Companies (NULL = global template)' },
      { name: 'Name',          type: 'NVARCHAR', note: 'Admin, Maker, Approver, Viewer, …' },
      { name: 'IsActive',      type: 'BIT'      },
    ],
  },
  {
    name: 'Permissions', desc: 'Permission scoped ต่อ Application',
    fields: [
      { name: 'Id',            type: 'GUID',    pk: true },
      { name: 'ApplicationId', type: 'GUID',    fk: true, note: '→ Applications (NOT NULL)' },
      { name: 'Resource',      type: 'NVARCHAR', note: 'e.g. document, user' },
      { name: 'Action',        type: 'NVARCHAR', note: 'e.g. read, write, invite' },
      { name: 'DisplayNameTH', type: 'NVARCHAR' },
    ],
  },
  {
    name: 'UserRoles', desc: 'User → Role mapping ต่อ app-context',
    fields: [
      { name: 'Id',        type: 'GUID', pk: true },
      { name: 'UserId',    type: 'GUID', fk: true, note: '→ Users' },
      { name: 'RoleId',    type: 'GUID', fk: true, note: '→ Roles (มี ApplicationId อยู่แล้ว)' },
      { name: 'CompanyId', type: 'GUID', fk: true, note: '→ Companies (NULL = Shell App role)' },
      { name: 'AssignedAt',type: 'DATETIME' },
    ],
  },
  {
    name: 'RolePermissions', desc: 'Role → Permission mapping',
    fields: [
      { name: 'RoleId',       type: 'GUID', pk: true, fk: true, note: '→ Roles' },
      { name: 'PermissionId', type: 'GUID', pk: true, fk: true, note: '→ Permissions (same AppId)' },
    ],
  },
  {
    name: 'ApplicationModeMappings', desc: 'App-level Single/Multiple mode availability',
    fields: [
      { name: 'Id',            type: 'GUID', pk: true },
      { name: 'ApplicationId', type: 'GUID', fk: true, note: '→ Applications' },
      { name: 'Mode',          type: 'ENUM', note: "'SingleUser' | 'MultipleUser'" },
      { name: 'IsActive',      type: 'BIT'  },
    ],
  },
];

@Component({
  selector: 'app-db-schema',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sec-hd">
      <div class="sh">Database Schema</div>
      <div class="ss">โครงสร้างตาราง UserService ที่เกี่ยวข้องกับ Role & Permission</div>
    </div>

    <div class="schema-grid">
      @for (table of tables; track table.name) {
        <div class="card">
          <div class="card-hd">
            <div>
              <div class="card-title mono" style="font-size:14px">{{ table.name }}</div>
              <div class="card-sub">{{ table.desc }}</div>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table" style="font-size:12px">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                @for (f of table.fields; track f.name) {
                  <tr>
                    <td>
                      <span class="mono" style="font-size:12px;color:#0F172A">{{ f.name }}</span>
                      @if (f.pk) { <span class="badge b-orange" style="font-size:9px;margin-left:4px">PK</span> }
                      @if (f.fk) { <span class="badge b-blue"   style="font-size:9px;margin-left:4px">FK</span> }
                    </td>
                    <td><span class="badge b-inactive mono" style="font-size:10px">{{ f.type }}</span></td>
                    <td style="color:#64748B;font-size:11.5px">{{ f.note ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .schema-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 16px;
    }
  `],
})
export class DbSchemaComponent {
  tables = TABLES;
}
