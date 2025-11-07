import { Component, OnInit, signal, inject, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectService } from '../../services/project.service';
import { ProjectUI, CommentCreate } from '../../interfaces/portfolio.interface';
import { ReactionType } from '../../enums/reaction-type.enum';
import { CommentSectionComponent } from '../../directives/comment.-section.component';
import { UserInfoModalComponent } from '../../directives/user-info.component';
import { ShareModalComponent } from '../../directives/share-modal.component';
import { ImageCarouselComponent } from '../../directives/image-carousel.component';
import { ImageModalComponent } from '../../directives/image-modal.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CommentSectionComponent,
    UserInfoModalComponent,
    ShareModalComponent,
    ImageCarouselComponent,
    ImageModalComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  @ViewChild(UserInfoModalComponent) userInfoModal!: UserInfoModalComponent;

  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  readonly project = signal<ProjectUI | null>(null);
  readonly loading = signal(true);

  readonly selectedImageIndex = signal(0);
  readonly lightboxOpen = signal(false);
  readonly safeVideoUrl = signal<SafeResourceUrl | null>(null);

  readonly commentsOpen = signal(false);
  readonly userEmail = signal<string | null>(null);
  readonly userName = signal<string | null>(null);
  readonly pendingReactionType = signal<ReactionType | null>(null);

  readonly showShareModal = signal(false);
  readonly shareUrl = signal('');
  readonly shareTitle = signal('');

  readonly authError = signal<string | null>(null);
  readonly commentError = signal<string | null>(null);

  ngOnInit() {
    this.loadUserInfoFromStorage();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject(id);
  }

  // --- FUNCIÓN MODIFICADA ---
  // Ahora valida el contenido de localStorage antes de asignarlo.
  private loadUserInfoFromStorage(): void {
    if (!this.isBrowser) return;

    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');

    // Validar que ambos existan, que el nombre no esté vacío y que el email tenga el formato correcto.
    if (email && name && name.trim() && this.emailRegex.test(email)) {
      // Los datos son válidos, los cargamos en los signals
      this.userEmail.set(email);
      this.userName.set(name);
    } else {
      // Los datos están corruptos, vacíos o no son válidos.
      // Los borramos de localStorage para forzar un nuevo ingreso.
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');

      // Nos aseguramos de que los signals estén en null
      this.userEmail.set(null);
      this.userName.set(null);
    }
  }

  private loadProject(id: number) {
    this.loading.set(true);

    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);

        this.loadProjectReactions(id);
        this.loadProjectComments(id);

        if (project.videoUrl) {
          const videoId = this.extractYouTubeId(project.videoUrl);
          if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
          }
        }
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.loading.set(false);
      },
    });
  }

  readonly availableReactions = [
    { type: ReactionType.Like, icon: '👍', label: 'Like' },
    { type: ReactionType.Love, icon: '❤️', label: 'Love' },
    { type: ReactionType.Congratulations, icon: '🎉', label: 'Congratulations' },
  ];

  getReactionLabel(): string {
    const project = this.project();
    if (!project?.reactions) return 'Like';

    const userReaction = project.reactions.user_reaction;
    if (!userReaction) return 'Like';

    const reaction = this.availableReactions.find((r) => r.type === userReaction);
    return reaction?.label || 'Like';
  }

  private loadProjectReactions(projectId: number): void {
    const email = this.userEmail();

    this.projectService.getReactions(projectId, email || undefined).subscribe({
      next: (reactions) => {
        const project = this.project();
        if (project) {
          project.reactions = reactions;
          this.project.set({ ...project });
        }
      },
      error: (error) => console.error('Error loading reactions:', error),
    });
  }

  private loadProjectComments(projectId: number): void {
    this.projectService.getComments(projectId).subscribe({
      next: (comments) => {
        const project = this.project();
        if (project) {
          project.comments = comments.filter((c) => c.approved);
          project.comments_count = comments.filter((c) => c.approved).length;
          this.project.set({ ...project });
        }
      },
      error: (error) => console.error('Error loading comments:', error),
    });
  }

  handleReaction(reactionType: ReactionType): void {
    const project = this.project();
    if (!project) return;

    if (!this.userEmail() || !this.userName()) {
      this.pendingReactionType.set(reactionType);
      this.authError.set(null); // Limpiar errores antiguos antes de abrir
      this.userInfoModal.open();
      return;
    }

    this.applyReaction(project.id, reactionType);
  }

  onUserInfoSubmit(data: { name: string; email: string }): void {
    // Validación
    if (!data.name.trim()) {
      this.authError.set('El nombre es requerido.');
      return; // Detiene la ejecución
    }
    if (!data.email.trim() || !this.emailRegex.test(data.email)) {
      this.authError.set('Se requiere una dirección de correo válida.');
      return; // Detiene la ejecución
    }

    // Si es válido, limpiar error y continuar
    this.authError.set(null);

    if (this.isBrowser) {
      localStorage.setItem('user_email', data.email);
      localStorage.setItem('user_name', data.name);
    }

    this.userEmail.set(data.email);
    this.userName.set(data.name);

    const project = this.project();
    const reactionType = this.pendingReactionType();

    if (project && reactionType) {
      this.applyReaction(project.id, reactionType);
      this.pendingReactionType.set(null);
    }

    // Asumimos que el modal se cierra solo si no hay error
    // Si el modal no se cierra solo, necesitaríamos llamar a `this.userInfoModal.close()` aquí.
  }

private applyReaction(projectId: number, reactionType: ReactionType): void {
    const email = this.userEmail();
    const name = this.userName();

    if (!email || !name) return;

    const project = this.project();
    if (project?.reactions) {
      const previousUserReaction = project.reactions.user_reaction;

      const optimisticReactions = { ...project.reactions };

      if (previousUserReaction) {
        switch (previousUserReaction) {
          case ReactionType.Like:
            optimisticReactions.like_count = Math.max(0, optimisticReactions.like_count - 1);
            break;
          case ReactionType.Love:
            optimisticReactions.love_count = Math.max(0, optimisticReactions.love_count - 1);
            break;
          case ReactionType.Congratulations:
            optimisticReactions.congratulations_count = Math.max(0, optimisticReactions.congratulations_count - 1);
            break;
        }
      }

      switch (reactionType) {
        case ReactionType.Like:
          optimisticReactions.like_count++;
          break;
        case ReactionType.Love:
          optimisticReactions.love_count++;
          break;
        case ReactionType.Congratulations:
          optimisticReactions.congratulations_count++;
          break;
      }

      optimisticReactions.user_reaction = reactionType;
      optimisticReactions.total_reactions =
        optimisticReactions.like_count +
        optimisticReactions.love_count +
        optimisticReactions.congratulations_count;

      project.reactions = optimisticReactions;
      this.project.set({ ...project });
    }

    this.projectService
      .addReaction(projectId, {
        email,
        name,
        reaction_type: reactionType,
      })
      .subscribe({
        next: () => {
          this.loadProjectReactions(projectId);
        },
        error: (error) => {
          console.error('Error adding reaction:', error);
          alert('Failed to add reaction. Please try again.');
          this.loadProjectReactions(projectId);
        },
      });
  }

  toggleComments(): void {
    this.commentsOpen.set(!this.commentsOpen());
  }

  viewComments(): void {
    if (!this.commentsOpen()) {
      this.commentsOpen.set(true);
    }
  }

  handleCommentSubmit(comment: CommentCreate): void {
    // Validación
    if (!comment.name.trim() || !comment.email.trim() || !comment.content.trim()) {
      this.commentError.set('Todos los campos (Nombre, Email, Comentario) son requeridos.');
      return; // Detiene la ejecución
    }
    if (!this.emailRegex.test(comment.email)) {
      this.commentError.set('Por favor, introduce una dirección de correo válida.');
      return; // Detiene la ejecución
    }

    // Si es válido, limpiar error y continuar
    this.commentError.set(null);

    const project = this.project();
    if (!project) return;

    if (this.isBrowser) {
      localStorage.setItem('user_email', comment.email);
      localStorage.setItem('user_name', comment.name);
    }

    this.userEmail.set(comment.email);
    this.userName.set(comment.name);

    this.projectService.addComment(project.id, comment).subscribe({
      next: () => {
        this.loadProjectComments(project.id);
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.commentError.set('Fallo al enviar el comentario. Por favor, inténtalo de nuevo.');
      },
    });
  }

  handleShare(): void {
    const project = this.project();
    if (!project) return;

    const baseUrl = window.location.origin;
    this.shareUrl.set(`${baseUrl}/projects/${project.id}`);
    this.shareTitle.set(project.title);
    this.showShareModal.set(true);
  }

  closeShareModal(): void {
    this.showShareModal.set(false);
  }

  openLightbox(index: number) {
    this.selectedImageIndex.set(index);
    this.lightboxOpen.set(true);
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }

  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  }
}
