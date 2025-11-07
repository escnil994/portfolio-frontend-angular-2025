import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimateOnScrollDirective } from '../../../../directives/animate-on-scroll.directive';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AdminService } from '../../../../services/admin.service';
import { ProjectFormData } from '../../../../interfaces/portfolio.interface';

interface ImageSlot {
  id?: number;
  file: File | null;
  preview: string | null;
  uploaded: boolean;
}

@Component({
  selector: 'app-admin-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AnimateOnScrollDirective],
  templateUrl: './admin-project-form.component.html'
})
export class AdminProjectFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  @ViewChild('techInput') techInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  readonly projectId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitSuccess = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);

  // Technologies and Tags
  readonly technologies = signal<string[]>([]);
  readonly techInputValue = signal('');
  readonly tags = signal<string[]>([]);
  readonly tagInputValue = signal('');

  // Image slots (max 5)
  readonly imageSlots = signal<ImageSlot[]>([
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
    { file: null, preview: null, uploaded: false },
  ]);

  readonly projectForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    technologies: ['', Validators.required],
    tags: [''],
    github_url: [''],
    demo_url: [''],
    video_url: [''],
    featured: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      this.projectId.set(Number(id));
      this.loadProject(Number(id));
    }
  }

  private loadProject(id: number): void {
    this.loading.set(true);

    this.adminService.getProjectForEdit(id).subscribe({
      next: (project) => {
        // Populate form
        this.projectForm.patchValue({
          title: project.title,
          description: project.description,
          technologies: project.technologies || '',
          tags: project.tags || '',
          github_url: project.github_url || '',
          demo_url: project.demo_url || '',
          featured: project.featured || false,
        });

        // Load technologies
        if (project.technologies) {
          this.technologies.set(
            project.technologies
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t)
          );
        }

        // Load tags
        if (project.tags) {
          this.tags.set(
            project.tags
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t)
          );
        }

        // Load images
        if (project.images && project.images.length > 0) {
          const sortedImages = project.images.sort(
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

        // Load video URL
        if (project.videos && project.videos.length > 0) {
          this.projectForm.patchValue({
            video_url: project.videos[0].url,
          });
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.submitError.set('Failed to load project data');
        this.loading.set(false);
      },
    });
  }

  // Technologies
  onTechInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.techInputValue.set(input.value);
  }

  onTechKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTechnology();
    } else if (event.key === 'Backspace' && this.techInputValue() === '') {
      event.preventDefault();
      const techs = this.technologies();
      if (techs.length > 0) {
        this.removeTechnology(techs[techs.length - 1]);
      }
    }
  }

  addTechnology(): void {
    const value = this.techInputValue().trim();
    if (value && !this.technologies().includes(value)) {
      this.technologies.set([...this.technologies(), value]);
      this.updateTechnologiesFormValue();
      this.techInputValue.set('');
    }
  }

  removeTechnology(tech: string): void {
    this.technologies.set(this.technologies().filter((t) => t !== tech));
    this.updateTechnologiesFormValue();
  }

  private updateTechnologiesFormValue(): void {
    const techString = this.technologies().join(', ');
    this.projectForm.patchValue({ technologies: techString });
  }

  focusTechInput(): void {
    setTimeout(() => this.techInput?.nativeElement.focus(), 0);
  }

  // Tags
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
    this.projectForm.patchValue({ tags: tagString });
  }

  focusTagInput(): void {
    setTimeout(() => this.tagInput?.nativeElement.focus(), 0);
  }

  // Images
  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.imageError.set('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.imageError.set('Image must not exceed 5MB');
      return;
    }

    this.imageError.set(null);

    // Create image preview
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

    if (slot.uploaded && slot.id && this.projectId()) {
      this.adminService.deleteProjectImage(this.projectId()!, slot.id).subscribe({
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

  private getNewImages(): File[] {
    return this.imageSlots()
      .filter((slot) => slot.file !== null && !slot.uploaded)
      .map((slot) => slot.file!);
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.markFormGroupTouched(this.projectForm);
      return;
    }

    this.submitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(null);

    const projectData: ProjectFormData = {
      title: this.projectForm.value.title!,
      description: this.projectForm.value.description!,
      technologies: this.projectForm.value.technologies!,
      tags: this.projectForm.value.tags || undefined,
      github_url: this.projectForm.value.github_url || undefined,
      demo_url: this.projectForm.value.demo_url || undefined,
      featured: this.projectForm.value.featured || false,
    };

    if (this.isEditMode() && this.projectId()) {
      this.updateProject(this.projectId()!, projectData);
    } else {
      this.createProject(projectData);
    }
  }



  // Por este método:
private async uploadNewImages(projectId: number): Promise<void> {
  const slots = this.imageSlots();
  const uploadPromises: Promise<any>[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.file && !slot.uploaded) {
      const promise = this.adminService
        .uploadProjectImage(projectId, slot.file, i + 1, `Image ${i + 1}`)
        .toPromise();
      uploadPromises.push(promise);
    }
  }

  if (uploadPromises.length > 0) {
    await Promise.all(uploadPromises);
  }
}

// Actualiza createProject:
private createProject(projectData: ProjectFormData): void {
  this.adminService
    .createProject(projectData)
    .pipe(
      switchMap(async (project) => {
        const projectId = project.id;

        // Upload images
        await this.uploadNewImages(projectId);

        // Add video
        const videoUrl = this.projectForm.value.video_url;
        if (videoUrl) {
          await this.adminService.addProjectVideo(projectId, {
            title: projectData.title,
            url: videoUrl,
            source: 'youtube'
          }).toPromise();
        }

        return project;
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

// Actualiza updateProject:
private updateProject(projectId: number, projectData: ProjectFormData): void {
  this.adminService
    .updateProject(projectId, projectData)
    .pipe(
      switchMap(async () => {
        // Upload new images
        await this.uploadNewImages(projectId);

        // Update video if needed
        const videoUrl = this.projectForm.value.video_url;
        if (videoUrl) {
          await this.adminService.addProjectVideo(projectId, {
            title: projectData.title,
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
      this.router.navigate(['/admin/projects']);
    }, 2000);
  }

  private handleError(error: any): void {
    console.error('Error saving project:', error);
    this.submitError.set(
      this.isEditMode()
        ? 'Failed to update project. Please try again.'
        : 'Failed to create project. Please try again.'
    );
    this.submitting.set(false);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.projectForm.get(fieldName);
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
      description: 'Description',
      technologies: 'Technologies',
      tags: 'Tags',
      github_url: 'GitHub URL',
      demo_url: 'Demo URL',
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
    this.router.navigate(['/admin/projects']);
  }
}
