import { Injectable } from '@angular/core';
import {
  Application, Company, Permission, Role, User, Enrollment,
  CompanyApplication, CompanyApplicationMode, UserRole, DashboardStats,
} from '../models';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  applications: Application[] = [
    { application_id: 'app001', name_th: 'แอปหลัก (Shell)', name_en: 'Shell App', app_code: 'shell', base_url: 'https://shell.example.com', is_active: true },
    { application_id: 'app002', name_th: 'ระบบคลังสินค้า', name_en: 'Inventory App', app_code: 'inventory-app', base_url: 'https://cdn.example.com/inventory/remoteEntry.js', is_active: true },
    { application_id: 'app003', name_th: 'ระบบทรัพยากรบุคคล', name_en: 'HR App', app_code: 'hr-app', base_url: 'https://cdn.example.com/hr/remoteEntry.js', is_active: true },
    { application_id: 'app004', name_th: 'ระบบบัญชี', name_en: 'Accounting App', app_code: 'accounting-app', base_url: 'https://cdn.example.com/accounting/remoteEntry.js', is_active: false },
  ];

  companies: Company[] = [
    { company_id: 'co001', name_th: 'บริษัท แอคมี จำกัด', name_en: 'ACME Co., Ltd.', juristic_id: '0105560123456', status: 'Active' },
    { company_id: 'co002', name_th: 'บริษัท สตาร์ทอัพเอ็กซ์ จำกัด', name_en: 'StartupX Co., Ltd.', juristic_id: '0105570654321', status: 'Active' },
    { company_id: 'co003', name_th: 'บริษัท เทคโนโลยี ไทย จำกัด', name_en: 'TechThai Co., Ltd.', juristic_id: '0105580111222', status: 'Inactive' },
  ];

  users: User[] = [
    { user_id: 'u001', email: 'john@acme.com', display_name: 'John Doe', user_type: 'Customer', status: 'Active', created_at: '2026-01-10T08:00:00Z' },
    { user_id: 'u002', email: 'jane@acme.com', display_name: 'Jane Smith', user_type: 'Customer', status: 'Active', created_at: '2026-01-11T09:00:00Z' },
    { user_id: 'u003', email: 'bob@startupx.com', display_name: 'Bob Lee', user_type: 'Customer', status: 'Active', created_at: '2026-02-01T10:00:00Z' },
    { user_id: 'u004', email: 'admin@exim.go.th', display_name: 'Admin User', user_type: 'Employee', status: 'Active', created_at: '2025-12-01T08:00:00Z' },
  ];

  roles: Role[] = [
    { role_id: 'role01', application_id: 'app002', company_id: null, name: 'Viewer', is_active: true },
    { role_id: 'role02', application_id: 'app002', company_id: null, name: 'Editor', is_active: true },
    { role_id: 'role03', application_id: 'app002', company_id: null, name: 'Approver', is_active: true },
    { role_id: 'role04', application_id: 'app002', company_id: null, name: 'Manager', is_active: true },
    { role_id: 'role05', application_id: 'app002', company_id: 'co001', name: 'ACME-Approver', is_active: true },
    { role_id: 'role06', application_id: 'app003', company_id: null, name: 'HR Viewer', is_active: true },
    { role_id: 'role07', application_id: 'app003', company_id: null, name: 'HR Admin', is_active: true },
    { role_id: 'shell-normal', application_id: 'app001', company_id: null, name: 'Normal', is_active: true },
    { role_id: 'shell-agent', application_id: 'app001', company_id: null, name: 'ตัวแทน', is_active: true },
  ];

  permissions: Permission[] = [
    { permission_id: 'perm01', application_id: 'app002', resource: 'inventory', action: 'read', display_name_th: 'ดูคลังสินค้า', display_name_en: 'View Inventory', permission_group: 'Inventory' },
    { permission_id: 'perm02', application_id: 'app002', resource: 'inventory', action: 'write', display_name_th: 'แก้ไขคลังสินค้า', display_name_en: 'Edit Inventory', permission_group: 'Inventory' },
    { permission_id: 'perm03', application_id: 'app002', resource: 'inventory', action: 'export', display_name_th: 'ส่งออกคลังสินค้า', display_name_en: 'Export Inventory', permission_group: 'Inventory' },
    { permission_id: 'perm04', application_id: 'app002', resource: 'report', action: 'read', display_name_th: 'ดูรายงาน', display_name_en: 'View Reports', permission_group: 'Reports' },
    { permission_id: 'perm05', application_id: 'app001', resource: 'user', action: 'invite', display_name_th: 'สามารถเชิญผู้ใช้ได้', display_name_en: 'Invite Users', permission_group: 'User Management' },
    { permission_id: 'perm06', application_id: 'app003', resource: 'employee', action: 'read', display_name_th: 'ดูข้อมูลพนักงาน', display_name_en: 'View Employees', permission_group: 'Employee' },
    { permission_id: 'perm07', application_id: 'app003', resource: 'employee', action: 'write', display_name_th: 'แก้ไขข้อมูลพนักงาน', display_name_en: 'Edit Employees', permission_group: 'Employee' },
  ];

  rolePermissions: { role_id: string; permission_id: string }[] = [
    { role_id: 'role01', permission_id: 'perm01' },
    { role_id: 'role01', permission_id: 'perm04' },
    { role_id: 'role02', permission_id: 'perm01' },
    { role_id: 'role02', permission_id: 'perm02' },
    { role_id: 'role03', permission_id: 'perm01' },
    { role_id: 'role03', permission_id: 'perm02' },
    { role_id: 'role03', permission_id: 'perm03' },
    { role_id: 'role04', permission_id: 'perm01' },
    { role_id: 'role04', permission_id: 'perm02' },
    { role_id: 'role04', permission_id: 'perm03' },
    { role_id: 'role04', permission_id: 'perm04' },
    { role_id: 'shell-agent', permission_id: 'perm05' },
    { role_id: 'role06', permission_id: 'perm06' },
    { role_id: 'role07', permission_id: 'perm06' },
    { role_id: 'role07', permission_id: 'perm07' },
  ];

  userRoles: UserRole[] = [
    { user_id: 'u001', company_id: 'co001', role_id: 'role03', application_id: 'app002', assigned_at: '2026-01-10T09:00:00Z', role_name: 'Approver', app_name: 'Inventory App' },
    { user_id: 'u001', company_id: null, role_id: 'shell-agent', application_id: 'app001', assigned_at: '2026-01-10T09:00:00Z', role_name: 'ตัวแทน', app_name: 'Shell App' },
    { user_id: 'u002', company_id: 'co001', role_id: 'role02', application_id: 'app002', assigned_at: '2026-01-11T10:00:00Z', role_name: 'Editor', app_name: 'Inventory App' },
    { user_id: 'u002', company_id: null, role_id: 'shell-normal', application_id: 'app001', assigned_at: '2026-01-11T09:30:00Z', role_name: 'Normal', app_name: 'Shell App' },
    { user_id: 'u003', company_id: 'co002', role_id: 'role01', application_id: 'app002', assigned_at: '2026-02-01T11:00:00Z', role_name: 'Viewer', app_name: 'Inventory App' },
  ];

  companyApplications: { company_id: string; apps: CompanyApplication[] }[] = [
    {
      company_id: 'co001',
      apps: [
        { application_id: 'app002', name_th: 'ระบบคลังสินค้า', name_en: 'Inventory App', app_code: 'inventory-app', base_url: 'https://cdn.example.com/inventory/remoteEntry.js', is_active: true, subscribed_at: '2026-01-15T00:00:00Z' },
        { application_id: 'app003', name_th: 'ระบบทรัพยากรบุคคล', name_en: 'HR App', app_code: 'hr-app', base_url: 'https://cdn.example.com/hr/remoteEntry.js', is_active: true, subscribed_at: '2026-01-15T00:00:00Z' },
      ],
    },
    {
      company_id: 'co002',
      apps: [
        { application_id: 'app002', name_th: 'ระบบคลังสินค้า', name_en: 'Inventory App', app_code: 'inventory-app', base_url: 'https://cdn.example.com/inventory/remoteEntry.js', is_active: true, subscribed_at: '2026-02-10T00:00:00Z' },
      ],
    },
  ];

  companyApplicationModes: { company_id: string; application_id: string; modes: CompanyApplicationMode[] }[] = [
    {
      company_id: 'co001', application_id: 'app002',
      modes: [
        { mode: 'single_user', is_active: true },
        { mode: 'multiple_user', is_active: true },
      ],
    },
    {
      company_id: 'co002', application_id: 'app002',
      modes: [
        { mode: 'single_user', is_active: true },
        { mode: 'multiple_user', is_active: false },
      ],
    },
  ];

  enrollments: Enrollment[] = [
    { flow_instance_id: 'fi001', user_id: 'u001', company_id: 'co001', status: 'Finalized', created_at: '2026-01-10T08:00:00Z', owner_display_name: 'John Doe', company_name: 'ACME Co., Ltd.' },
    { flow_instance_id: 'fi002', user_id: 'u001', company_id: 'co002', status: 'Submitted', created_at: '2026-03-01T10:00:00Z', owner_display_name: 'John Doe', company_name: 'StartupX Co., Ltd.' },
    { flow_instance_id: 'fi003', user_id: 'u003', company_id: 'co003', status: 'Submitted', created_at: '2026-04-15T09:00:00Z', owner_display_name: 'Bob Lee', company_name: 'TechThai Co., Ltd.' },
  ];

  getDashboardStats(): DashboardStats {
    return {
      total_applications: this.applications.length,
      total_roles: this.roles.length,
      total_permissions: this.permissions.length,
      total_companies: this.companies.length,
      total_users: this.users.length,
      pending_enrollments: this.enrollments.filter(e => e.status === 'Submitted').length,
    };
  }
}
