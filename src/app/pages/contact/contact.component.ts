import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AnimateOnScrollDirective } from '../../directives/animate-on-scroll.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AnimateOnScrollDirective],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  submitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);
  profile = this.apiService.profile;

  displayName = computed(() => {
    const profileData = this.profile();
    if (!profileData) return '';

    if (profileData.display_name) {
      return profileData.display_name;
    }

    return `${profileData.name} ${profileData.last_name || ''}`.trim();
  });

  contactInfo = computed(() => {
    const profileData = this.profile();
    if (!profileData) return [];

    const info = [];

    if (profileData.email) {
      info.push({
        icon: 'email',
        title: 'Email',
        value: profileData.email,
        link: `mailto:${profileData.email}`,
        color: 'from-[#0ea5e9]/20 to-[#133550]/20'
      });
    }

    if (profileData.github_url) {
      const githubValue = profileData.github_url.replace('https://', '').replace('http://', '');
      info.push({
        icon: 'code',
        title: 'GitHub',
        value: githubValue,
        link: profileData.github_url,
        color: 'from-[#181717]/20 to-[#333]/20'
      });
    }

    if (profileData.linkedin_url) {
      const linkedinValue = profileData.linkedin_url.replace('https://', '').replace('http://', '');
      info.push({
        icon: 'business',
        title: 'LinkedIn',
        value: linkedinValue,
        link: profileData.linkedin_url,
        color: 'from-[#0077B5]/20 to-[#00A0DC]/20'
      });
    }

    if (profileData.twitter_url) {
      const twitterValue = profileData.twitter_url.replace('https://', '').replace('http://', '');
      info.push({
        icon: 'alternate_email',
        title: 'Twitter',
        value: twitterValue,
        link: profileData.twitter_url,
        color: 'from-[#1DA1F2]/20 to-[#0C85D0]/20'
      });
    }

    return info;
  });

  contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit() {
    this.apiService.getProfile().subscribe();
  }

  submitForm() {
    if (this.contactForm.valid) {
      this.submitting.set(true);
      this.submitSuccess.set(false);
      this.submitError.set(null);

      this.apiService.sendContactMessage(this.contactForm.value as any).subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.contactForm.reset();
          this.submitting.set(false);

          setTimeout(() => {
            this.submitSuccess.set(false);
          }, 5000);
        },
        error: () => {
          this.submitError.set('Failed to send message. Please try again or contact me directly via email.');
          this.submitting.set(false);
        }
      });
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.contactForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return `${fieldName} is required`;
      if (field.errors?.['email']) return 'Please enter a valid email';
      if (field.errors?.['minlength']) return `${fieldName} is too short`;
    }
    return null;
  }
}
