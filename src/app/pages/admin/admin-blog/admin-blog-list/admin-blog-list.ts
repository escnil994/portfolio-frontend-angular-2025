// admin-blog-list.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../../services/blog.service';
import { AdminService } from '../../../../services/admin.service';
import { BlogPostUI } from '../../../../interfaces/portfolio.interface';

@Component({
  selector: 'app-admin-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-blog-list.html',
})
export class AdminBlogListComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly adminService = inject(AdminService);

  readonly posts = signal<BlogPostUI[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadPosts();
  }

  private loadPosts(): void {
    this.loading.set(true);
    this.blogService.getPosts().subscribe({
      next: (posts) => {
        console.log(posts);

        this.posts.set(posts);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading.set(false);
      }
    });
  }

  deletePost(post: BlogPostUI): void {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    this.adminService.deletePost(post.id).subscribe({
      next: () => {
        this.posts.set(this.posts().filter(p => p.id !== post.id));
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    });
  }
}
