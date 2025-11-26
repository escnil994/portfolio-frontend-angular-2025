import { Component, inject, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BlogPostUI,
  Comment,
  CommentCreate,
  ReactionSummary,
} from '../../../interfaces/portfolio.interface';
import { ReactionBarComponent } from '../../../directives/reaction-bar.component';
import { CommentSectionComponent } from '../../../directives/comment.-section.component';
import { ImageCarouselComponent } from '../../../directives/image-carousel.component';
import { ImageModalComponent } from '../../../directives/image-modal.component';
import { UserInfoModalComponent } from '../../../directives/user-info.component';
import { BlogService } from '../../../services/blog.service';
import { SubscriptionService } from '../../../services/subscription.service';
import { ReactionType } from '../../../enums/reaction-type.enum';
import { ShareModalComponent } from '../../../directives/share-modal.component';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReactionBarComponent,
    CommentSectionComponent,
    ImageCarouselComponent,
    ImageModalComponent,
    UserInfoModalComponent,
    MarkdownComponent,
    ShareModalComponent,
    RouterLink,
  ],
  templateUrl: './blog.component.html'
})
export class BlogComponent implements OnInit {
  @ViewChild(UserInfoModalComponent) userInfoModal!: UserInfoModalComponent;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly blogService = inject(BlogService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  readonly selectedCategory = signal('all');
  readonly categories = ['all', 'devops', 'cloud', 'development', 'tutorials'];

  readonly expandedPosts = signal<Set<number>>(new Set());
  readonly openComments = signal<number | null>(null);
  readonly posts = signal<BlogPostUI[]>([]);
  readonly isLoading = signal(true);

  readonly selectedImages = signal<string[]>([]);
  readonly selectedImageIndex = signal(0);
  readonly showImageModal = signal(false);

  readonly showShareModal = signal(false);
  readonly sharePostUrl = signal('');
  readonly sharePostTitle = signal('');
  readonly sharePostDescription = signal('');

  readonly userEmail = signal<string | null>(null);
  readonly userName = signal<string | null>(null);
  readonly pendingReactionPostId = signal<number | null>(null);
  readonly pendingReactionType = signal<ReactionType | null>(null);

  readonly authError = signal<string | null>(null);
  readonly commentError = signal<string | null>(null);
  readonly commentErrorPostId = signal<number | null>(null);

  readonly subscriptionEmail = new FormControl('', [Validators.required, Validators.email]);
  readonly subscriptionLoading = signal(false);
  readonly subscriptionMessage = signal<string | null>(null);
  readonly subscriptionError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUserInfoFromStorage();
    this.loadPosts();
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

  private loadPosts(): void {
    this.isLoading.set(true);

    this.blogService.getPosts().subscribe({
      next: (posts) => {

        this.posts.set(posts);

        posts.forEach((post) => {
          this.loadPostReactions(post.id);
          this.loadPostComments(post.slug);
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.isLoading.set(false);
      },
    });
  }

  private loadPostReactions(postId: number): void {
    const email = this.userEmail();

    this.blogService.getReactions(postId, email || undefined).subscribe({
      next: (reactions) => {
        const posts = this.posts();
        const post = posts.find((p) => p.id === postId);

        if (post) {
          post.reactions = reactions;
          this.posts.set([...posts]);
        }
      },
      error: (error) => console.error('Error loading reactions:', error),
    });
  }

  private loadPostComments(postSlug: string): void {
    this.blogService.getComments(postSlug).subscribe({
      next: (comments) => {
        const posts = this.posts();
        const post = posts.find((p) => p.slug === postSlug);

        if (post) {
          post.comments = comments;
          post.comments_count = comments.length;
          this.posts.set([...posts]);
        }
      },
      error: (error) => console.error('Error loading comments:', error),
    });
  }

  onSubscribe(): void {
    // Limpiar mensajes anteriores
    this.subscriptionError.set(null);
    this.subscriptionMessage.set(null);

    // Validar que no esté vacío
    const emailValue = this.subscriptionEmail.value?.trim();
    if (!emailValue) {
      this.subscriptionError.set('Email is required');
      return;
    }

    // Validar formato de email
    if (!this.emailRegex.test(emailValue)) {
      this.subscriptionError.set('Please enter a valid email address');
      return;
    }

    // Validar con FormControl
    if (this.subscriptionEmail.invalid) {
      this.subscriptionError.set('Please enter a valid email address');
      return;
    }

    // Deshabilitar mientras procesa
    this.subscriptionEmail.disable();
    this.subscriptionLoading.set(true);

    this.subscriptionService.subscribe(emailValue).subscribe({
      next: (response) => {
        this.subscriptionLoading.set(false);
        this.subscriptionMessage.set(response.message);
        this.subscriptionEmail.reset();
        this.subscriptionEmail.enable();

        setTimeout(() => {
          this.subscriptionMessage.set(null);
        }, 5000);
      },
      error: (error) => {
        this.subscriptionLoading.set(false);
        this.subscriptionEmail.enable();
        this.subscriptionError.set(
          error.error?.detail || 'Failed to subscribe. Please try again.'
        );
      },
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  get filteredPosts(): BlogPostUI[] {
    const posts = this.posts();
    const category = this.selectedCategory();

    if (category === 'all') {
      return posts;
    }

    return posts.filter((post) => post.category === category);
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

  togglePostExpanded(postId: number): void {
    const expanded = this.expandedPosts();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }

    this.expandedPosts.set(newExpanded);
  }

  isPostExpanded(postId: number): boolean {
    return this.expandedPosts().has(postId);
  }

  getPreviewText(content: string): string {
    const words = content.split(' ');
    return words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
  }

  toggleComments(postId: number): void {
    const currentOpen = this.openComments();

    if (currentOpen === postId) {
      this.openComments.set(null);
    } else {
      this.openComments.set(postId);
    }
  }

  viewComments(postId: number): void {
    if (this.openComments() !== postId) {
      this.openComments.set(postId);
    }
  }

  isCommentsOpen(postId: number): boolean {
    return this.openComments() === postId;
  }

  handleCommentSubmit(postId: number, postSlug: string, comment: CommentCreate): void {
    this.commentError.set(null);
    this.commentErrorPostId.set(null);

    if (!comment.name.trim() || !comment.email.trim() || !comment.content.trim()) {
      this.commentError.set('Todos los campos (Nombre, Email, Comentario) son requeridos.');
      this.commentErrorPostId.set(postId);
      return;
    }
    if (!this.emailRegex.test(comment.email)) {
      this.commentError.set('Por favor, introduce una dirección de correo válida.');
      this.commentErrorPostId.set(postId);
      return;
    }

    if (this.isBrowser) {
      localStorage.setItem('user_email', comment.email);
      localStorage.setItem('user_name', comment.name);
    }

    this.userEmail.set(comment.email);
    this.userName.set(comment.name);

    this.blogService.addComment(postId, comment).subscribe({
      next: () => {
        this.loadPostComments(postSlug);
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.commentError.set('Fallo al enviar el comentario. Por favor, inténtalo de nuevo.');
        this.commentErrorPostId.set(postId);
      },
    });
  }

  handleReaction(postId: number, reactionType: ReactionType): void {
    const email = this.userEmail();
    const name = this.userName();

    if (!email || !name) {
      this.pendingReactionPostId.set(postId);
      this.pendingReactionType.set(reactionType);
      this.authError.set(null);
      this.userInfoModal.open();
      return;
    }

    this.applyReactionWithOptimisticUI(postId, reactionType);
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

    const postId = this.pendingReactionPostId();
    const reactionType = this.pendingReactionType();

    if (postId && reactionType) {
      this.applyReactionWithOptimisticUI(postId, reactionType);
      this.pendingReactionPostId.set(null);
      this.pendingReactionType.set(null);
    }
  }

  private applyReactionWithOptimisticUI(postId: number, reactionType: ReactionType): void {
    const email = this.userEmail();
    const name = this.userName();

    if (!email || !name) return;

    const posts = this.posts();
    const post = posts.find((p) => p.id === postId);

    if (!post) return;

    const previousReactions = { ...post.reactions };

    const updatedReactions = this.calculateOptimisticReactions(
      previousReactions,
      reactionType
    );

    post.reactions = updatedReactions;
    this.posts.set([...posts]);

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

          post.reactions = previousReactions;
          this.posts.set([...posts]);

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

  handleShare(postId: number): void {
    const post = this.posts().find((p) => p.id === postId);
    if (!post) return;

    const baseUrl = window.location.origin;

    this.sharePostUrl.set(`${baseUrl}/blog/${post.slug}`);
    this.sharePostTitle.set(post.title);
    this.sharePostDescription.set(post.excerpt || post.title);
    this.showShareModal.set(true);
  }

  closeShareModal(): void {
    this.showShareModal.set(false);
  }
}
