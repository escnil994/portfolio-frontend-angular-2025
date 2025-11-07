import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent)
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./pages/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog-component/blog.component').then(m => m.BlogComponent)
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog/blog-detail-component/blog-detail.component').then(m => m.BlogDetailComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'private/user/me/login',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },


  {
    path: 'verify-subscription',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./pages/subscriptions/verify-subscription.component').then(m => m.VerifySubscriptionComponent)
  },

  {
    path: 'private/user/me/verify-2fa',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./pages/auth/2fa/verify-2fa.component').then(m => m.Verify2faComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
        import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
