import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard',    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'applications', loadComponent: () => import('./features/applications/applications.component').then(m => m.ApplicationsComponent) },
      { path: 'roles',        loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent) },
      { path: 'permissions',  loadComponent: () => import('./features/permissions/permissions.component').then(m => m.PermissionsComponent) },
      { path: 'companies',    loadComponent: () => import('./features/companies/companies.component').then(m => m.CompaniesComponent) },
      { path: 'users',        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
      { path: 'enrollments',  loadComponent: () => import('./features/enrollments/enrollments.component').then(m => m.EnrollmentsComponent) },
      { path: '',             redirectTo: '/dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
