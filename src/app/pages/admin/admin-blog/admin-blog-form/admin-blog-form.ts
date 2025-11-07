import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimateOnScrollDirective } from '../../../../directives/animate-on-scroll.directive';
import { of } from 'rxjs';
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

  readonly imageSlots = signal<ImageSlot[]>([
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
  ]);

  readonly postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(20)]],
    excerpt: ['', [Validators.required, Validators.minLength(20)]],
    author: ['', Validators.required],
    tags: [''],
    published: [false],
    video_url: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const slug = this.route.snapshot.paramMap.get('slug');
    console.log(slug);


    if (slug) {
      this.isEditMode.set(true);
      this.postId.set(Number(id));
      this.loadPost(slug);
    }
  }

  private loadPost(slug: string): void {
    this.loading.set(true);

    this.adminService.getPostForEdit(slug).subscribe({
      next: (post) => {

        this.postForm.patchValue({
          title: post.title,
          slug: post.slug,
          content: post.content || '',
          tags: post.tags || '',
          excerpt: post.excerpt || '',
          author: post.author || '',
          published: post.published || false,
        });

        if (post.tags) {
          this.tags.set(
            post.tags
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t)
          );
        }

        if (post.images && post.images.length > 0) {
          const sortedImages = post.images.sort(
            (a: any, b: any) => a.image_order - b.image_order
          );

          const slots = [...this.imageSlots()];
          sortedImages.forEach((img: any, index: number) => {
            if (index < 5) {
              slots[index] = {
                id: img.id,
                file: null,
                preview: img.image_url,
                uploaded: true,
              };
            }
          });
          this.imageSlots.set(slots);
        }

        if (post.videos && post.videos.length > 0) {
          this.postForm.patchValue({
            video_url: post.videos[0].url,
          });
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.submitError.set('Failed to load post data');
        this.loading.set(false);
      },
    });
  }

  onTagInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tagInputValue.set(input.value);
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Backspace' && this.tagInputValue() === '') {
      event.preventDefault();
      const currentTags = this.tags();
      if (currentTags.length > 0) {
        this.removeTag(currentTags[currentTags.length - 1]);
      }
    }
  }

  addTag(): void {
    const value = this.tagInputValue().trim();
    if (value && !this.tags().includes(value)) {
      this.tags.set([...this.tags(), value]);
      this.updateTagsFormValue();
      this.tagInputValue.set('');
    }
  }

  removeTag(tag: string): void {
    this.tags.set(this.tags().filter((t) => t !== tag));
    this.updateTagsFormValue();
  }

  private updateTagsFormValue(): void {
    const tagString = this.tags().join(', ');
    this.postForm.patchValue({ tags: tagString });
  }

  focusTagInput(): void {
    setTimeout(() => this.tagInput?.nativeElement.focus(), 0);
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.imageError.set('Please select a valid image file');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.imageError.set('Image must not exceed 10MB');
      return;
    }

    this.imageError.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const slots = [...this.imageSlots()];
      slots[index] = {
        id: slots[index].id,
        file: file,
        preview: e.target?.result as string,
        uploaded: false,
      };
      this.imageSlots.set(slots);
    };
    reader.readAsDataURL(file);

    input.value = '';
  }

  removeImage(index: number): void {
    const slot = this.imageSlots()[index];

    if (slot.uploaded && slot.id && this.postId()) {
      this.adminService.deletePostImage(this.postId()!, slot.id).subscribe({
        next: () => {
          const slots = [...this.imageSlots()];
          slots[index] = { file: null, preview: null, uploaded: false };
          this.imageSlots.set(slots);
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          this.imageError.set('Failed to delete image');
        },
      });
    } else {
      const slots = [...this.imageSlots()];
      slots[index] = { file: null, preview: null, uploaded: false };
      this.imageSlots.set(slots);
    }

    this.imageError.set(null);
  }

  onSubmit(): void {
    if (this.postForm.invalid) {
      this.markFormGroupTouched(this.postForm);
      return;
    }

    this.submitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(null);

    const postData: BlogPostFormData = {
      title: this.postForm.value.title!,
      slug: this.postForm.value.slug!,
      excerpt: this.postForm.value.excerpt || '',
      author: this.postForm.value.author!,
      content: this.postForm.value.content || '',
      tags: this.postForm.value.tags || undefined,
      published: this.postForm.value.published || false,
    };

    if (this.isEditMode() && this.postId()) {
      this.updatePost(this.postId()!, postData);
    } else {
      this.createPost(postData);
    }
  }

  private async uploadNewImages(postId: number): Promise<void> {
    const slots = this.imageSlots();
    const uploadPromises: Promise<any>[] = [];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.file && !slot.uploaded) {
        const promise = this.adminService
          .uploadPostImage(postId, slot.file, i + 1, `Image ${i + 1}`)
          .toPromise();
        uploadPromises.push(promise);
      }
    }

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
  }

  private createPost(postData: BlogPostFormData): void {
    this.adminService
      .createPost(postData)
      .pipe(
        switchMap(async (post) => {
          const postId = post.id;

          await this.uploadNewImages(postId);

          const videoUrl = this.postForm.value.video_url;
          if (videoUrl) {
            await this.adminService.addPostVideo(postId, {
              title: postData.title,
              url: videoUrl,
              source: 'youtube'
            }).toPromise();
          }

          return post;
        }),
        catchError((error) => {
          this.handleError(error);
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.handleSuccess();
        },
      });
  }

  private updatePost(postId: number, postData: BlogPostFormData): void {
    this.adminService
      .updatePost(postId, postData)
      .pipe(
        switchMap(async () => {
          await this.uploadNewImages(postId);

          const videoUrl = this.postForm.value.video_url;
          if (videoUrl) {
            await this.adminService.addPostVideo(postId, {
              title: postData.title,
              url: videoUrl,
              source: 'youtube'
            }).toPromise();
          }
        }),
        catchError((error) => {
          this.handleError(error);
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.handleSuccess();
        },
      });
  }

  private handleSuccess(): void {
    this.submitSuccess.set(true);
    this.submitting.set(false);

    setTimeout(() => {
      this.router.navigate(['/admin/posts']);
    }, 2000);
  }

  private handleError(error: any): void {
    console.error('Error saving post:', error);
    this.submitError.set(
      this.isEditMode()
        ? 'Failed to update post. Please try again.'
        : 'Failed to create post. Please try again.'
    );
    this.submitting.set(false);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.postForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      slug: 'Slug',
      content: 'Content',
      excerpt: 'Excerpt',
      author: 'Author',
      tags: 'Tags',
      video_url: 'Video URL',
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: any): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control && 'controls' in control) {
        this.markFormGroupTouched(control);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/posts']);
  }
}
