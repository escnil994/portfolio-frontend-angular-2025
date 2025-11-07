
import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '', // /admin
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects',
    loadComponent: () => import('./admin-projects/admin-project-list/admin-project-list').then(m => m.AdminProjectListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects/new',
    loadComponent: () => import('./admin-projects/admin-project-form/admin-project-form.component').then(m => m.AdminProjectFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./admin-projects/admin-project-form/admin-project-form.component').then(m => m.AdminProjectFormComponent),
    canActivate: [authGuard]
  },


  {
    path: 'blog',
    loadComponent: () => import('./admin-blog/admin-blog-list/admin-blog-list').then(m => m.AdminBlogListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'blog/new',
    loadComponent: () => import('./admin-blog/admin-blog-form/admin-blog-form').then(m => m.AdminBlogFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./admin-blog/admin-blog-form/admin-blog-form').then(m => m.AdminBlogFormComponent),
    canActivate: [authGuard]
  },

  /*

  // Profile route
  {
    path: 'profile',
    loadComponent: () => import('./profile-editor/profile-editor.component').then(m => m.ProfileEditorComponent),
    canActivate: [authGuard]
  },

  // Messages route
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages.component').then(m => m.MessagesComponent),
    canActivate: [authGuard]
  },

  // Settings route
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },

  */


  // Redirect unknown routes to dashboard
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
