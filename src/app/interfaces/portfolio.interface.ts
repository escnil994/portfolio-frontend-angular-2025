export interface Image {
  id: number;
  entity_id: number;
  entity_type: string;
  image_url: string;
  image_order: number;
}

export interface Video {
  id: number;
  title: string;
  url: string;
  source: 'youtube' | 'blob_storage';
  thumbnail_url: string | null;
  created_at: string;
  project_id: number | null;
  blog_post_id: number | null;
}

export interface Comment {
  id: number;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  created_at: string;
  project_id: number | null;
  blog_post_id: number | null;
}

export interface Reaction {
  id: number;
  type: 'love';
  user_email: string;
  user_name: string;
  created_at: string;
  blog_post_id?: number;
  project_id?: number;
}

export interface ReactionSummary {
  total_reactions: number;
  like_count: number;
  love_count: number;
  congratulations_count: number;
  user_reaction: 'like' | 'love' | 'congratulations' | null;
}

export interface Skill {
  id: number;
  name: string;
  icon: string;
  color: string;
  category: 'database' | 'cloud' | 'programming' | 'framework' | 'devops' | 'os' | 'tools' | 'iac' | 'runtime' | 'monitoring' | 'networking' | 'scripting';
  proficiency: number;
  yearsOfExperience: number;
}

export interface SkillsData {
  skills: Skill[];
}

export interface Profile {
  id: number;
  name: string;
  last_name: string;
  display_name: string;
  username: string;
  title: string;
  bio: string | null;
  email: string;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  profile_image_url: string | null;
  skills: SkillsData | string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  content: string | null;
  technologies: string | null;
  github_url: string | null;
  demo_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  images: Image[];
}

export interface ProjectWithDetails extends Project {
  comments: Comment[];
  videos: Video[];
}



export interface ProjectUI {
  id: number;
  title: string;
  description: string;
  image: string;
  images: string[];
  featured: boolean;
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  category?: string;
  comments?: Comment[];
  comments_count?: number;
  reactions?: ReactionSummary;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string | null;
  image_url: string | null;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostWithDetails extends BlogPost {
  comments: Comment[];
  videos: Video[];
  reactions?: Reaction[];
}

export interface BlogPostUI extends BlogPost {
  image: string;
  images?: string[];
  category: string;
  date: string;
  readTime: string;
  videoUrl?: string;
  reactions: ReactionSummary;
  comments_count: number;
  comments: Comment[];
}

export interface CommentCreate {
  name: string;
  email: string;
  content: string;
  project_id?: number;
  blog_post_id?: number;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface MessageResponse {
  message: string;
  detail?: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  technologies: string;
  tags?: string;
  github_url?: string;
  demo_url?: string;
  featured: boolean;
}

export interface ProjectImage {
  id?: number;
  image_url: string;
  image_order: number;
}

export interface ProjectVideo {
  id?: number;
  url: string;
  source: string;
}


export interface PostFormData {
  title: string;
  description: string;
  technologies: string;
  tags?: string;
  github_url?: string;
  demo_url?: string;
  featured: boolean;
}


export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags?: string;
  published: boolean;
}
