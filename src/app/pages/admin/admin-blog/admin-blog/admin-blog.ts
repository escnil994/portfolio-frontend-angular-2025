import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-blog',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Gestionar Blog</h1>

      <a routerLink="/admin/blog/new" class="btn btn-primary">
        Crear Nuevo Artículo
      </a>
    </div>

    <p class="mb-4">
      Aquí se mostrará una tabla o lista de todos los posts existentes.
    </p>

    <div class="space-y-2">
      <div class="card bg-base-100 shadow p-4 flex-row justify-between items-center">
        <span>Post "Alfa"</span>
        <a routerLink="/admin/blog/edit/alfa-id-123" class="btn btn-sm btn-ghost">
          Editar
        </a>
      </div>
      <div class="card bg-base-100 shadow p-4 flex-row justify-between items-center">
        <span>Post "Beta"</span>
        <a routerLink="/admin/blog/edit/beta-id-456" class="btn btn-sm btn-ghost">
          Editar
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBlog { }
