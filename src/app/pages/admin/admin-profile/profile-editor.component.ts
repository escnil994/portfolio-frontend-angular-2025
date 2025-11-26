import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ImageResponse, ProfileUpdate } from '../../../interfaces/user.interface';

// --- Interfaces auxiliares para el tipado ---
interface Experience { role: string; company: string; period: string; description: string; }
interface Education { institution: string; degree: string; period: string; description: string; }
interface Certification { name: string; issuer: string; year: string; url: string; }
interface Achievement { title: string; description: string; date: string; }

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-editor.component.html',
  styleUrls: ['./profile-editor.component.scss']
})
export class ProfileEditorComponent implements OnInit {
  // ... (Servicios e inyecciones existentes se mantienen igual)
  adminService = inject(AdminService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private location = inject(Location);

  // Signals de estado
  profileId = signal<number | null>(null);
  loading = signal<boolean>(true);
  loadingImage = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  profileImage = signal<ImageResponse | null>(null);
  filePreview = signal<string | null>(null);

  // --- Control de Modales y Edición ---
  activeModal = signal<'skill' | 'experience' | 'education' | 'certification' | 'achievement' | null>(null);
  editingIndex = signal<number | null>(null);
  isDeleteModalOpen = signal(false);
  deleteTarget = signal<{ type: string, index: number } | null>(null);

  // --- Formularios Auxiliares para los Modales ---
  skillForm: FormGroup;
  experienceForm: FormGroup;
  educationForm: FormGroup;
  certificationForm: FormGroup;
  achievementForm: FormGroup;
  imageForm = this.fb.nonNullable.group({
    file: [null as File | null],
    alt_text: ['Profile Image', [Validators.required]]
  });

  // --- Formulario Principal ---
  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    last_name: [null as string | null],
    display_name: [null as string | null],
    title: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    bio: [null as string | null],
    github_url: [null as string | null],
    linkedin_url: [null as string | null],
    twitter_url: [null as string | null],
    resume_url: [null as string | null],
    // Arrays dinámicos
    skills: this.fb.array([]),
    experience: this.fb.array([]),
    education: this.fb.array([]),
    certifications: this.fb.array([]),
    achievements: this.fb.array([])
  });

  constructor() {
    // Inicializamos los sub-formularios
    this.skillForm = this.createSkillGroup();
    this.experienceForm = this.createExperienceGroup();
    this.educationForm = this.createEducationGroup();
    this.certificationForm = this.createCertificationGroup();
    this.achievementForm = this.createAchievementGroup();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  // --- Getters para los FormArrays ---
  get skillsArray() { return this.profileForm.get('skills') as FormArray; }
  get experienceArray() { return this.profileForm.get('experience') as FormArray; }
  get educationArray() { return this.profileForm.get('education') as FormArray; }
  get certificationsArray() { return this.profileForm.get('certifications') as FormArray; }
  get achievementsArray() { return this.profileForm.get('achievements') as FormArray; }

  // --- Creadores de Grupos (FormGroups) ---
  // Usados tanto para iniciar el array como para resetear el modal
  createSkillGroup(data?: any): FormGroup {
    return this.fb.group({
      name: [data?.name || '', Validators.required],
      icon: [data?.icon || ''],
      color: [data?.color || ''],
      category: [data?.category || ''],
      proficiency: [data?.proficiency || 50],
      yearsOfExperience: [data?.yearsOfExperience || 1]
    });
  }

  createExperienceGroup(data?: Experience): FormGroup {
    return this.fb.group({
      role: [data?.role || '', Validators.required],
      company: [data?.company || '', Validators.required],
      period: [data?.period || '', Validators.required],
      description: [data?.description || '']
    });
  }

  createEducationGroup(data?: Education): FormGroup {
    return this.fb.group({
      institution: [data?.institution || '', Validators.required],
      degree: [data?.degree || '', Validators.required],
      period: [data?.period || '', Validators.required],
      description: [data?.description || '']
    });
  }

  createCertificationGroup(data?: Certification): FormGroup {
    return this.fb.group({
      name: [data?.name || '', Validators.required],
      issuer: [data?.issuer || '', Validators.required],
      year: [data?.year || '', Validators.required],
      url: [data?.url || '']
    });
  }

  createAchievementGroup(data?: Achievement): FormGroup {
    return this.fb.group({
      title: [data?.title || '', Validators.required],
      description: [data?.description || '', Validators.required],
      date: [data?.date || '']
    });
  }

  // --- Lógica Genérica de Modales ---
  openModal(type: 'skill' | 'experience' | 'education' | 'certification' | 'achievement', index: number | null = null): void {
    this.activeModal.set(type);
    this.editingIndex.set(index);

    let targetForm: FormGroup;
    let sourceArray: FormArray;
    let createFn: (data?: any) => FormGroup;

    // Selección de estrategia según el tipo
    switch (type) {
      case 'skill': targetForm = this.skillForm; sourceArray = this.skillsArray; createFn = this.createSkillGroup.bind(this); break;
      case 'experience': targetForm = this.experienceForm; sourceArray = this.experienceArray; createFn = this.createExperienceGroup.bind(this); break;
      case 'education': targetForm = this.educationForm; sourceArray = this.educationArray; createFn = this.createEducationGroup.bind(this); break;
      case 'certification': targetForm = this.certificationForm; sourceArray = this.certificationsArray; createFn = this.createCertificationGroup.bind(this); break;
      case 'achievement': targetForm = this.achievementForm; sourceArray = this.achievementsArray; createFn = this.createAchievementGroup.bind(this); break;
      default: return;
    }

    if (index !== null) {
      targetForm.patchValue(sourceArray.at(index).value);
    } else {
      targetForm.reset(); // Limpiar form
      // Restaurar valores por defecto si es necesario (ej. proficiency 50)
      if(type === 'skill') targetForm.patchValue({proficiency: 50, yearsOfExperience: 1});
    }
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.editingIndex.set(null);
  }

  saveModalData(): void {
    const type = this.activeModal();
    const index = this.editingIndex();
    let targetForm: FormGroup;
    let targetArray: FormArray;
    let createFn: (data?: any) => FormGroup;

    switch (type) {
      case 'skill': targetForm = this.skillForm; targetArray = this.skillsArray; createFn = this.createSkillGroup.bind(this); break;
      case 'experience': targetForm = this.experienceForm; targetArray = this.experienceArray; createFn = this.createExperienceGroup.bind(this); break;
      case 'education': targetForm = this.educationForm; targetArray = this.educationArray; createFn = this.createEducationGroup.bind(this); break;
      case 'certification': targetForm = this.certificationForm; targetArray = this.certificationsArray; createFn = this.createCertificationGroup.bind(this); break;
      case 'achievement': targetForm = this.achievementForm; targetArray = this.achievementsArray; createFn = this.createAchievementGroup.bind(this); break;
      default: return;
    }

    if (targetForm.invalid) return;

    if (index === null) {
      targetArray.push(createFn(targetForm.value));
    } else {
      targetArray.at(index).patchValue(targetForm.value);
    }
    this.closeModal();
  }

  // --- Lógica de Eliminación ---
  askDelete(type: string, index: number): void {
    this.deleteTarget.set({ type, index });
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (target) {
      switch (target.type) {
        case 'skill': this.skillsArray.removeAt(target.index); break;
        case 'experience': this.experienceArray.removeAt(target.index); break;
        case 'education': this.educationArray.removeAt(target.index); break;
        case 'certification': this.certificationsArray.removeAt(target.index); break;
        case 'achievement': this.achievementsArray.removeAt(target.index); break;
      }
    }
    this.isDeleteModalOpen.set(false);
    this.deleteTarget.set(null);
  }

  // --- Carga de Datos (Parsing JSON) ---
  loadProfile(): void {
    this.loading.set(true);
    this.adminService.getProfile().subscribe({
      next: (profile) => {
        const { skills, experience, education, certifications, achievements, images, ...basicData } = profile;
        this.profileId.set(profile.id);
        this.profileForm.patchValue(basicData);

        // Helper para parsear y llenar arrays
        const populateArray = (jsonString: string | any, array: FormArray, createFn: Function) => {
          array.clear();
          if (!jsonString) return;
          try {
            // Si ya viene como objeto (algunos backends lo hacen automatico) o string
            let data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

            // Manejo especifico por si tu backend envuelve en { skills: [...] } o es directo [...]
            if (data.skills) data = data.skills; // Caso especial skills

            if (Array.isArray(data)) {
              data.forEach(item => array.push(createFn(item)));
            }
          } catch (e) {
            console.error("Error parsing JSON field", e);
          }
        };

        populateArray(skills, this.skillsArray, this.createSkillGroup.bind(this));
        populateArray(experience, this.experienceArray, this.createExperienceGroup.bind(this));
        populateArray(education, this.educationArray, this.createEducationGroup.bind(this));
        populateArray(certifications, this.certificationsArray, this.createCertificationGroup.bind(this));
        populateArray(achievements, this.achievementsArray, this.createAchievementGroup.bind(this));

        if (images?.length) {
          this.profileImage.set(images[0]);
          this.imageForm.patchValue({ alt_text: images[0].alt_text || 'Profile Image' });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load profile');
        this.loading.set(false);
      }
    });
  }

  // --- Guardado (Stringify JSON) ---
  onSubmit(): void {
    if (this.profileForm.invalid || !this.profileId()) return;

    this.loading.set(true);
    const formVal = this.profileForm.getRawValue();

    // Convertimos los arrays de vuelta a string JSON para el backend
    const profileData: ProfileUpdate = {
      ...formVal,
      skills: JSON.stringify({ skills: formVal.skills }), // Estructura anidada si tu backend la requiere
      experience: JSON.stringify(formVal.experience),     // Estructura directa array
      education: JSON.stringify(formVal.education),
      certifications: JSON.stringify(formVal.certifications),
      achievements: JSON.stringify(formVal.achievements)
    };

    this.adminService.updateProfile(this.profileId()!, profileData).subscribe({
      next: () => {
        this.successMessage.set('Profile updated successfully!');
        this.loading.set(false);
        this.loadProfile(); // Recargar para asegurar consistencia
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Update failed');
        this.loading.set(false);
      }
    });
  }

  // ... (Métodos de imagen onFileSelected, onUpdateImage, etc. se mantienen igual)
   onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.imageForm.patchValue({ file: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onUpdateImage(): void {
    // ... (mismo código que tenías)
      if (!this.profileId()) return;
    const file = this.imageForm.get('file')?.value;
    const altText = this.imageForm.get('alt_text')?.value;
    if (!file || !altText) {
      this.errorMessage.set('Please select a file to upload.');
      return;
    }
    this.loadingImage.set(true);
    this.adminService.uploadProfileImage(this.profileId()!, file, altText).subscribe({
      next: (response) => {
        this.profileImage.set(response.image);
        this.successMessage.set('Profile image updated!');
        this.filePreview.set(null);
        this.loadingImage.set(false);
      },
      error: () => { this.loadingImage.set(false); }
    });
  }

  onDeleteImage(): void {
     // ... (mismo código que tenías)
     if (!this.profileImage() || !this.profileId()) return;
    if (!confirm('Remove image?')) return;
    this.loadingImage.set(true);
    this.adminService.deleteProfileImage(this.profileId()!, this.profileImage()!.id).subscribe({
      next: () => {
        this.profileImage.set(null);
        this.loadingImage.set(false);
      },
      error: () => this.loadingImage.set(false)
    });
  }

  goBack(): void { this.location.back(); }
}
