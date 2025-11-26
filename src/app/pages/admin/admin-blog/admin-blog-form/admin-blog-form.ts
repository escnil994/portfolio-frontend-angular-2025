import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimateOnScrollDirective } from '../../../../directives/animate-on-scroll.directive';
import { of, lastValueFrom } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AdminService } from '../../../../services/admin.service';
import { BlogPostFormData } from '../../../../interfaces/portfolio.interface';

interface ImageSlot {
  id?: number;
  file: File | null;
  preview: string | null;
  uploaded: boolean;
}

@Component({
  selector: 'app-admin-blog-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AnimateOnScrollDirective],
  templateUrl: './admin-blog-form.html',
  styleUrls: ['./admin-blog-form.scss'],
})
export class AdminBlogFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  readonly postId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitSuccess = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);

  readonly tags = signal<string[]>([]);
  readonly tagInputValue = signal('');

  readonly imageSlots = signal<ImageSlot[]>(Array(5).fill({ file: null, preview: null, uploaded: false }));

  readonly postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(20)]],
    excerpt: ['', [Validators.required, Validators.minLength(20)]],
    tags: [''],
    published: [false],
    video_url: [''],
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.isEditMode.set(true);
      this.loadPost(slug);
    }
  }

  private loadPost(slug: string): void {
    this.loading.set(true);
    this.adminService.getPostForEdit(slug).subscribe({
      next: (post: any) => {
        this.postId.set(post.id);
        this.postForm.patchValue({
          title: post.title,
          slug: post.slug,
          content: post.content || '',
          tags: post.tags || '',
          excerpt: post.excerpt || '',
          published: post.published || false,
        });

        if (post.tags) {
          this.tags.set(this.splitAndTrim(post.tags));
        }

        if (post.images?.length) {
          const slots = [...this.imageSlots()];
          post.images
            .sort((a: any, b: any) => a.image_order - b.image_order)
            .forEach((img: any, index: number) => {
              if (index < 5) {
                slots[index] = { id: img.id, file: null, preview: img.image_url, uploaded: true };
              }
            });
          this.imageSlots.set(slots);
        }

        if (post.videos?.length) {
          this.postForm.patchValue({ video_url: post.videos[0].url });
        }
        this.loading.set(false);
      },
      error: () => {
        this.submitError.set('Failed to load post data');
        this.loading.set(false);
      },
    });
  }

  private splitAndTrim(value: string): string[] {
    return value.split(',').map(t => t.trim()).filter(Boolean);
  }

  onTagInput(event: Event): void {
    this.tagInputValue.set((event.target as HTMLInputElement).value);
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Backspace' && !this.tagInputValue()) {
      this.removeTag();
    }
  }

  addTag(): void {
    const value = this.tagInputValue().trim();
    if (value && !this.tags().includes(value)) {
      this.tags.update(current => [...current, value]);
      this.updateTagsFormValue();
      this.tagInputValue.set('');
    }
  }

  removeTag(tag?: string): void {
    const current = this.tags();
    if (tag) {
      this.tags.set(current.filter(t => t !== tag));
    } else if (current.length > 0) {
      this.tags.set(current.slice(0, -1));
    }
    this.updateTagsFormValue();
  }

  private updateTagsFormValue(): void {
    this.postForm.patchValue({ tags: this.tags().join(', ') });
  }

  focusTagInput(): void { setTimeout(() => this.tagInput?.nativeElement.focus(), 0); }

  onImageSelected(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      this.imageError.set(file.size > 10 * 1024 * 1024 ? 'Image must not exceed 10MB' : 'Invalid file type');
      return;
    }
    this.imageError.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const slots = [...this.imageSlots()];
      slots[index] = { ...slots[index], file, preview: e.target?.result as string, uploaded: false };
      this.imageSlots.set(slots);
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(index: number): void {
    const slot = this.imageSlots()[index];
    const clearSlot = () => {
      const slots = [...this.imageSlots()];
      slots[index] = { file: null, preview: null, uploaded: false };
      this.imageSlots.set(slots);
    };

    if (slot.uploaded && slot.id && this.postId()) {
      this.adminService.deletePostImage(this.postId()!, slot.id).subscribe({
        next: clearSlot,
        error: () => this.imageError.set('Failed to delete image'),
      });
    } else {
      clearSlot();
    }
  }

  onSubmit(): void {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(null);

    const formData = this.postForm.getRawValue();
    const postData: Omit<BlogPostFormData, 'author'> = {
      title: formData.title!,
      slug: formData.slug!,
      excerpt: formData.excerpt || '',
      content: formData.content || '',
      tags: formData.tags || undefined,
      published: formData.published || false,
    };

    const action$ = this.isEditMode() && this.postId()
      ? this.adminService.updatePost(this.postId()!, postData)
      : this.adminService.createPost(postData);

    action$.pipe(
      switchMap(async (post: any) => {
        const targetId = this.isEditMode() ? this.postId()! : post.id;
        await this.processMedia(targetId, formData.video_url, postData.title);
        return post;
      }),
      catchError((error) => {
        console.error('Error saving post:', error);
        this.submitError.set('Failed to save post. Please try again.');
        this.submitting.set(false);
        return of(null);
      })
    ).subscribe((res) => {
      if (res) {
        this.submitSuccess.set(true);
        setTimeout(() => this.router.navigate(['/admin/blog']), 2000);
      }
    });
  }

  private async processMedia(postId: number, videoUrl: string | null | undefined, title: string): Promise<void> {
    const uploadPromises = this.imageSlots()
      .map((slot, i) => {
        if (slot.file && !slot.uploaded) {
          return lastValueFrom(this.adminService.uploadPostImage(postId, slot.file, i + 1, `${title} image ${i + 1}`));
        }
        return null;
      })
      .filter(Boolean);

    if (uploadPromises.length) await Promise.all(uploadPromises);

    if (videoUrl) {
      await lastValueFrom(this.adminService.addPostVideo(postId, {
        title,
        url: videoUrl,
        source: 'youtube'
      }));
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.postForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return 'This field is required';
      if (field.errors?.['minlength']) return `Min length is ${field.errors['minlength'].requiredLength}`;
    }
    return null;
  }

  goBack(): void {
    this.router.navigate(['/admin/blog']);
  }
}
