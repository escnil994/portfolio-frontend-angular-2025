import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimateOnScrollDirective } from '../../../../directives/animate-on-scroll.directive';
import { of, lastValueFrom } from 'rxjs';
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

  readonly technologies = signal<string[]>([]);
  readonly techInputValue = signal('');
  readonly tags = signal<string[]>([]);
  readonly tagInputValue = signal('');

  readonly imageSlots = signal<ImageSlot[]>(Array(5).fill({ file: null, preview: null, uploaded: false }));

  readonly projectForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    // Agregamos el campo content al formulario
    content: [''],
    technologies: ['', Validators.required],
    slug: ['', [Validators.required, Validators.minLength(3)]],
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
      next: (project: any) => {
        this.projectForm.patchValue({
          title: project.title,
          description: project.description,
          content: project.content || '', // Cargar contenido si existe
          technologies: project.technologies || '',
          slug: project.slug || '',
          tags: project.tags || '',
          github_url: project.github_url || '',
          demo_url: project.demo_url || '',
          featured: project.featured || false,
        });

        if (project.technologies) {
          this.technologies.set(this.splitAndTrim(project.technologies));
        }

        if (project.tags) {
          this.tags.set(this.splitAndTrim(project.tags));
        }

        if (project.images?.length) {
          // Crear copia fresca de los slots vacíos
          const slots: ImageSlot[] = Array(5).fill(null).map(() => ({
            file: null,
            preview: null,
            uploaded: false
          }));

          project.images
            .sort((a: any, b: any) => a.image_order - b.image_order)
            .forEach((img: any, index: number) => {
              if (index < 5) {
                // Asegurarnos de que la URL es válida
                slots[index] = {
                  id: img.id,
                  file: null,
                  preview: img.image_url, // Asignar URL del backend
                  uploaded: true
                };
              }
            });
          this.imageSlots.set(slots);
        }

        if (project.videos?.length) {
          this.projectForm.patchValue({ video_url: project.videos[0].url });
        }
        this.loading.set(false);
      },
      error: () => {
        this.submitError.set('Failed to load project data');
        this.loading.set(false);
      },
    });
  }

  private splitAndTrim(value: string): string[] {
    return value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
  }

  onTechInput(event: Event): void {
    this.techInputValue.set((event.target as HTMLInputElement).value);
  }

  onTechKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addItem(this.technologies, this.techInputValue, 'technologies');
    } else if (event.key === 'Backspace' && !this.techInputValue()) {
      this.removeItem(this.technologies, 'technologies');
    }
  }

  onTagInput(event: Event): void {
    this.tagInputValue.set((event.target as HTMLInputElement).value);
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addItem(this.tags, this.tagInputValue, 'tags');
    } else if (event.key === 'Backspace' && !this.tagInputValue()) {
      this.removeItem(this.tags, 'tags');
    }
  }

  private addItem(listSignal: any, inputSignal: any, formControlName: string): void {
    const value = inputSignal().trim();
    if (value && !listSignal().includes(value)) {
      listSignal.update((current: string[]) => [...current, value]);
      this.projectForm.patchValue({ [formControlName]: listSignal().join(', ') });
      inputSignal.set('');
    }
  }

  private removeItem(listSignal: any, formControlName: string, item?: string): void {
    const current = listSignal();
    if (item) {
      listSignal.set(current.filter((t: string) => t !== item));
    } else if (current.length > 0) {
      listSignal.set(current.slice(0, -1));
    }
    this.projectForm.patchValue({ [formControlName]: listSignal().join(', ') });
  }

  removeTechnology(tech: string): void {
    this.removeItem(this.technologies, 'technologies', tech);
  }

  removeTag(tag: string): void {
    this.removeItem(this.tags, 'tags', tag);
  }

  focusTechInput(): void { setTimeout(() => this.techInput?.nativeElement.focus(), 0); }
  focusTagInput(): void { setTimeout(() => this.tagInput?.nativeElement.focus(), 0); }

  onImageSelected(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      this.imageError.set(file.size > 5 * 1024 * 1024 ? 'Image must not exceed 5MB' : 'Invalid file type');
      return;
    }
    this.imageError.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const slots = [...this.imageSlots()];
      // Actualizamos el slot específico preservando el resto
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

    if (slot.uploaded && slot.id && this.projectId()) {
      this.adminService.deleteProjectImage(this.projectId()!, slot.id).subscribe({
        next: clearSlot,
        error: () => this.imageError.set('Failed to delete image'),
      });
    } else {
      clearSlot();
    }
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(null);

    const formData = this.projectForm.getRawValue();

    // CORRECCIÓN: Incluir 'content' en el objeto que se envía
    const projectData: any = { // Usamos any temporalmente para permitir campos extra si la interfaz no está al día
      title: formData.title!,
      description: formData.description!,
      content: formData.content || '', // <-- AQUÍ ESTABA FALTANDO
      technologies: formData.technologies!,
      slug: formData.slug!,
      tags: formData.tags || undefined,
      github_url: formData.github_url || undefined,
      demo_url: formData.demo_url || undefined,
      featured: formData.featured || false,
    };

    const action$ = this.isEditMode() && this.projectId()
      ? this.adminService.updateProject(this.projectId()!, projectData)
      : this.adminService.createProject(projectData);

    action$.pipe(
      switchMap(async (project: any) => {
        const targetId = this.isEditMode() ? this.projectId()! : project.id;
        await this.processMedia(targetId, formData.video_url, projectData.title);
        return project;
      }),
      catchError((error) => {
        console.error('Error saving project:', error);
        this.submitError.set('Failed to save project. Please try again.');
        this.submitting.set(false);
        return of(null);
      })
    ).subscribe((res) => {
      if (res) {
        this.submitSuccess.set(true);
        setTimeout(() => this.router.navigate(['/admin/projects']), 2000);
      }
    });
  }

  private async processMedia(projectId: number, videoUrl: string | null | undefined, title: string): Promise<void> {
    const uploadPromises = this.imageSlots()
      .map((slot, i) => {
        if (slot.file && !slot.uploaded) {
          return lastValueFrom(this.adminService.uploadProjectImage(projectId, slot.file, i + 1, `${title} image ${i + 1}`));
        }
        return null;
      })
      .filter(Boolean);

    if (uploadPromises.length) await Promise.all(uploadPromises);

    if (videoUrl) {
      await lastValueFrom(this.adminService.addProjectVideo(projectId, {
        title,
        url: videoUrl,
        source: 'youtube'
      }));
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.projectForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return 'This field is required';
      if (field.errors?.['minlength']) return `Min length is ${field.errors['minlength'].requiredLength}`;
    }
    return null;
  }

  goBack(): void {
    this.router.navigate(['/admin/projects']);
  }
}
