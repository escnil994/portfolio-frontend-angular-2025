export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  email_2fa_enabled: boolean;
  totp_enabled: boolean;
  last_login?: string;
  profile?: Profile;
}

export interface ImageResponse {
  id: number;
  entity_id: number;
  entity_type: string;
  image_url: string;
  blob_name: string | null;
  image_order: number;
  alt_text: string | null;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedSkill {
  name: string;
  icon: string;
  color?: string;
  category?: string;
  proficiency?: number;
  yearsOfExperience?: number;
}

export interface ParsedExperience {
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  period: string;
  description: string;
}

export interface ParsedCertification {
  name: string;
  issuer: string;
  year: string;
  url: string;
}

export interface ParsedAchievement {
  title: string;
  description: string;
  date: string;
}

export interface ProfileResponse {
  id: number;
  user_id: number;
  name: string;
  last_name: string | null;
  display_name: string | null;
  title: string;
  bio: string | null;
  email: string;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  resume_url: string | null;

  skills: string | null;
  experience: string | null;
  education: string | null;
  certifications: string | null;
  achievements: string | null;

  images: ImageResponse[];
  created_at: string;
  updated_at: string;

  profile_image_url?: string;
}

export interface Profile extends ProfileResponse {}

export interface ProfileUpdate {
  name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  title?: string | null;
  bio?: string | null;
  email?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  resume_url?: string | null;

  skills?: string | null;
  experience?: string | null;
  education?: string | null;
  certifications?: string | null;
  achievements?: string | null;
}
