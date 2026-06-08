import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      // Employee routes
      { path: 'employee/service-config', loadComponent: () => import('./features/employee/service-config/service-config.component').then(m => m.ServiceConfigComponent) },
      { path: 'employee/mode-config',    loadComponent: () => import('./features/employee/mode-config/mode-config.component').then(m => m.ModeConfigComponent) },
      { path: 'employee/role-builder',   loadComponent: () => import('./features/employee/role-builder/role-builder.component').then(m => m.RoleBuilderComponent) },
      { path: 'employee/companies',      loadComponent: () => import('./features/employee/companies/companies.component').then(m => m.CompaniesComponent) },
      // Customer routes
      { path: 'customer/dashboard',  loadComponent: () => import('./features/customer/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'customer/onboarding', loadComponent: () => import('./features/customer/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
      { path: 'customer/team',       loadComponent: () => import('./features/customer/team/team.component').then(m => m.TeamComponent) },
      // Shared
      { path: 'shared/db-schema', loadComponent: () => import('./features/shared-screens/db-schema/db-schema.component').then(m => m.DbSchemaComponent) },
      { path: '', redirectTo: '/login', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
