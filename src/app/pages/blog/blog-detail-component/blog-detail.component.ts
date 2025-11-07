import { Component, inject, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogPostUI, CommentCreate, ReactionSummary } from '../../../interfaces/portfolio.interface';
import { ReactionBarComponent } from '../../../directives/reaction-bar.component';
import { CommentSectionComponent } from '../../../directives/comment.-section.component';
import { ImageCarouselComponent } from '../../../directives/image-carousel.component';
import { ImageModalComponent } from '../../../directives/image-modal.component';
import { UserInfoModalComponent } from '../../../directives/user-info.component';
import { ShareModalComponent } from '../../../directives/share-modal.component';
import { BlogService } from '../../../services/blog.service';
import { ReactionType } from '../../../enums/reaction-type.enum';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactionBarComponent,
    CommentSectionComponent,
    ImageCarouselComponent,
    ImageModalComponent,
    UserInfoModalComponent,
    ShareModalComponent,
  ],
  templateUrl: './blog-detail.component.html',
})
export class BlogDetailComponent implements OnInit {
  @ViewChild(UserInfoModalComponent) userInfoModal!: UserInfoModalComponent;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  readonly post = signal<BlogPostUI | null>(null);
  readonly relatedPosts = signal<BlogPostUI[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly showComments = signal(false);

  readonly selectedImages = signal<string[]>([]);
  readonly selectedImageIndex = signal(0);
  readonly showImageModal = signal(false);

  readonly showShareModal = signal(false);
  readonly shareUrl = signal('');
  readonly shareTitle = signal('');
  readonly shareDescription = signal('');

  readonly userEmail = signal<string | null>(null);
  readonly userName = signal<string | null>(null);
  readonly pendingReactionType = signal<ReactionType | null>(null);
  readonly authError = signal<string | null>(null);
  readonly commentError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUserInfoFromStorage();
    this.loadPost();
  }

  private loadUserInfoFromStorage(): void {
    if (!this.isBrowser) return;

    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');

    if (email && name && name.trim() && this.emailRegex.test(email)) {
      this.userEmail.set(email);
      this.userName.set(name);
    } else {
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      this.userEmail.set(null);
      this.userName.set(null);
    }
  }

  private loadPost(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.router.navigate(['/blog']);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.blogService.getPostBySlug(slug).subscribe({
      next: (postData) => {
        const post = this.transformPostToUI(postData);
        this.post.set(post);
        this.loadPostReactions(post.id);
        this.loadRelatedPosts(post.category, post.id);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.error.set('Post not found');
        this.isLoading.set(false);
      },
    });
  }

  private transformPostToUI(postData: any): BlogPostUI {
    const images = postData.images?.map((img: any) => img.image_url) || [];
    const tags = postData.tags ? postData.tags.split(',').map((t: string) => t.trim()) : [];

    return {
      ...postData,
      image: images[0] || postData.image_url || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
      images: images.length > 0 ? images : [postData.image_url || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80'],
      category: this.extractCategory(tags),
      date: postData.created_at,
      readTime: this.calculateReadTime(postData.content),
      reactions: {
        total_reactions: 0,
        like_count: 0,
        love_count: 0,
        congratulations_count: 0,
        user_reaction: null,
      },
      comments_count: postData.comments?.length || 0,
      comments: postData.comments || [],
      tags: postData.tags,
    };
  }

  private extractCategory(tags: string[]): string {
    const categories = ['devops', 'cloud', 'development', 'tutorials'];
    const tag = tags.find((t) => categories.includes(t.toLowerCase()));
    return tag ? tag.toLowerCase() : 'development';
  }

  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }

  private loadPostReactions(postId: number): void {
    const email = this.userEmail();

    this.blogService.getReactions(postId, email || undefined).subscribe({
      next: (reactions) => {
        const currentPost = this.post();
        if (currentPost) {
          currentPost.reactions = reactions;
          this.post.set({ ...currentPost });
        }
      },
      error: (error) => console.error('Error loading reactions:', error),
    });
  }

  private loadRelatedPosts(category: string, currentPostId: number): void {
    this.blogService.getPosts().subscribe({
      next: (posts) => {
        const related = posts
          .filter((p) => p.category === category && p.id !== currentPostId)
          .slice(0, 2);
        this.relatedPosts.set(related);
      },
      error: (error) => console.error('Error loading related posts:', error),
    });
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      devops: 'badge-primary',
      cloud: 'badge-accent',
      development: 'badge-secondary',
      tutorials: 'badge-info',
    };
    return colors[category] || 'badge-neutral';
  }

  parseTags(tagsString: string | null): string[] {
    if (!tagsString) return [];
    return tagsString.split(',').map((t: string) => t.trim());
  }

  toggleComments(): void {
    this.showComments.update((show) => !show);
  }

  scrollToComments(): void {
    if (!this.showComments()) {
      this.showComments.set(true);
    }

    setTimeout(() => {
      const commentsElement = document.getElementById('comments-section');
      if (commentsElement) {
        commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  handleCommentSubmit(comment: CommentCreate): void {
    this.commentError.set(null);
    if (!comment.name.trim() || !comment.email.trim() || !comment.content.trim()) {
      this.commentError.set('Todos los campos (Nombre, Email, Comentario) son requeridos.');
      return;
    }
    if (!this.emailRegex.test(comment.email)) {
      this.commentError.set('Por favor, introduce una dirección de correo válida.');
      return;
    }

    const currentPost = this.post();
    if (!currentPost) return;

    if (this.isBrowser) {
      localStorage.setItem('user_email', comment.email);
      localStorage.setItem('user_name', comment.name);
    }

    this.userEmail.set(comment.email);
    this.userName.set(comment.name);

    this.blogService.addComment(currentPost.id, comment).subscribe({
      next: () => {
        this.loadPost();
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.commentError.set('Fallo al enviar el comentario. Por favor, inténtalo de nuevo.');
      },
    });
  }

  handleReaction(reactionType: ReactionType): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const email = this.userEmail();
    const name = this.userName();

    if (!email || !name) {
      this.pendingReactionType.set(reactionType);
      this.authError.set(null);
      this.userInfoModal.open();
      return;
    }

    this.applyReactionWithOptimisticUI(currentPost.id, reactionType);
  }

  onUserInfoSubmit(data: { name: string; email: string }): void {
    this.authError.set(null);
    if (!data.name.trim()) {
      this.authError.set('El nombre es requerido.');
      return;
    }
    if (!data.email.trim() || !this.emailRegex.test(data.email)) {
      this.authError.set('Se requiere una dirección de correo válida.');
      return;
    }

    if (this.isBrowser) {
      localStorage.setItem('user_email', data.email);
      localStorage.setItem('user_name', data.name);
    }

    this.userEmail.set(data.email);
    this.userName.set(data.name);

    const currentPost = this.post();
    const reactionType = this.pendingReactionType();

    if (currentPost && reactionType) {
      this.applyReactionWithOptimisticUI(currentPost.id, reactionType);
      this.pendingReactionType.set(null);
    }
  }

  private applyReactionWithOptimisticUI(postId: number, reactionType: ReactionType): void {
    const email = this.userEmail();
    const name = this.userName();

    if (!email || !name) return;

    const currentPost = this.post();
    if (!currentPost) return;

    const previousReactions = { ...currentPost.reactions };

    const updatedReactions = this.calculateOptimisticReactions(
      previousReactions,
      reactionType
    );

    currentPost.reactions = updatedReactions;
    this.post.set({ ...currentPost });

    this.blogService
      .addReaction(postId, {
        email,
        name,
        reaction_type: reactionType,
      })
      .subscribe({
        next: () => {
          this.loadPostReactions(postId);
        },
        error: (error) => {
          console.error('Error adding reaction:', error);

          currentPost.reactions = previousReactions;
          this.post.set({ ...currentPost });

          alert('Failed to add reaction. Please try again.');
        },
      });
  }

  private calculateOptimisticReactions(
    current: ReactionSummary,
    newReaction: ReactionType
  ): ReactionSummary {
    const result = { ...current };
    const previousReaction = current.user_reaction;

    if (previousReaction) {
      switch (previousReaction) {
        case ReactionType.Like:
          result.like_count = Math.max(0, result.like_count - 1);
          break;
        case ReactionType.Love:
          result.love_count = Math.max(0, result.love_count - 1);
          break;
        case ReactionType.Congratulations:
          result.congratulations_count = Math.max(0, result.congratulations_count - 1);
          break;
      }

      if (previousReaction === newReaction) {
        result.user_reaction = null;
        result.total_reactions = Math.max(0, result.total_reactions - 1);
        return result;
      }
    } else {
      result.total_reactions += 1;
    }

    switch (newReaction) {
      case ReactionType.Like:
        result.like_count += 1;
        break;
      case ReactionType.Love:
        result.love_count += 1;
        break;
      case ReactionType.Congratulations:
        result.congratulations_count += 1;
        break;
    }

    result.user_reaction = newReaction;
    return result;
  }

  openImageModal(images: string[], index: number): void {
    this.selectedImages.set(images);
    this.selectedImageIndex.set(index);
    this.showImageModal.set(true);
  }

  closeImageModal(): void {
    this.showImageModal.set(false);
  }

  handleShare(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    if (this.isBrowser) {
      const baseUrl = window.location.origin;
      this.shareUrl.set(`${baseUrl}/blog/${currentPost.slug}`);
    }

    this.shareTitle.set(currentPost.title);
    this.shareDescription.set(currentPost.excerpt || currentPost.title);
    this.showShareModal.set(true);
  }

  closeShareModal(): void {
    this.showShareModal.set(false);
  }
}
