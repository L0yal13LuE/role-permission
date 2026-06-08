/* ── Auth ── */
export interface LoginRequest { email: string; password: string; }
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: { user_id: string; email: string; display_name: string; companies: Company[]; };
}
export interface AuthUser { user_id: string; email: string; display_name: string; companies: Company[]; }

/* ── User ── */
export interface User {
  user_id: string;
  email: string;
  display_name: string;
  user_type: 'Employee' | 'Customer';
  status: 'Active' | 'Inactive';
  created_at: string;
}
export interface CreateUserRequest { email: string; display_name: string; user_type?: 'Employee' | 'Customer'; }

/* ── Company ── */
export interface Company {
  company_id: string;
  name_th: string;
  name_en: string;
  juristic_id: string;
  status: 'Active' | 'Inactive';
  is_primary?: boolean;
}
export interface CreateCompanyRequest { name_th: string; name_en: string; juristic_id: string; }

/* ── Application ── */
export interface Application {
  application_id: string;
  name_th: string;
  name_en: string;
  app_code: string;
  base_url: string;
  is_active: boolean;
}
export interface CreateApplicationRequest { name_th: string; name_en: string; app_code: string; base_url: string; }

/* ── Role ── */
export interface Role {
  role_id: string;
  application_id: string;
  company_id: string | null;
  name: string;
  is_active: boolean;
}
export interface CreateRoleRequest { name: string; company_id?: string | null; }

/* ── Permission ── */
export interface Permission {
  permission_id: string;
  application_id: string;
  resource: string;
  action: string;
  display_name_th: string;
  display_name_en: string;
  permission_group: string;
}
export interface CreatePermissionRequest {
  resource: string;
  action: string;
  display_name_th?: string;
  display_name_en?: string;
  permission_group?: string;
}

/* ── Role Permission ── */
export interface RolePermission { role_id: string; permission_id: string; }
export interface AssignPermissionsRequest { permission_ids: string[]; }

/* ── User Role ── */
export interface UserRole {
  user_id: string;
  company_id: string | null;
  role_id: string;
  application_id: string;
  assigned_at: string;
  role_name?: string;
  app_name?: string;
}
export interface AssignRoleRequest { role_id: string; }

/* ── Company Application ── */
export interface CompanyApplication {
  application_id: string;
  name_th: string;
  name_en: string;
  app_code: string;
  base_url: string;
  is_active: boolean;
  subscribed_at: string;
}

/* ── Company Application Mode ── */
export interface CompanyApplicationMode {
  mode: 'single_user' | 'multiple_user';
  is_active: boolean;
}
export interface UpdateModeRequest { is_active: boolean; }

/* ── Enrollment ── */
export interface Enrollment {
  flow_instance_id: string;
  user_id: string;
  company_id: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Finalized';
  created_at: string;
  owner_display_name?: string;
  company_name?: string;
}
export interface CreateEnrollmentRequest {
  email: string;
  display_name: string;
  company_id: string;
  invited_users: { email: string; role_id: string; }[];
}
export interface ApproveEnrollmentResponse {
  flow_instance_id: string;
  status: string;
  company_requestor_id: string;
  shell_role_swapped_to: string;
  invitations_sent: number;
}

/* ── Authorization Check ── */
export interface PermissionCheck {
  user_id: string;
  company_id: string | null;
  application_id: string;
  role: { role_id: string; name: string; } | null;
  permissions: string[];
}

/* ── Dashboard ── */
export interface DashboardStats {
  total_applications: number;
  total_roles: number;
  total_permissions: number;
  total_companies: number;
  total_users: number;
  pending_enrollments: number;
}
