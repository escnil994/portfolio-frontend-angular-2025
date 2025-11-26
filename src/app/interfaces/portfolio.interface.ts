import { ImageResponse } from './user.interface';

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

export interface CommentCreate {
  name: string;
  email: string;
  content: string;
  project_id?: number;
  blog_post_id?: number;
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
  images: ImageResponse[];
}

export interface ProjectWithDetails extends Project {
  comments: Comment[];
  videos: Video[];
}

export interface ProjectFormData {
  title: string;
  description: string;
  content?: string;
  technologies: string;
  slug: string;
  tags?: string;
  github_url?: string;
  demo_url?: string;
  featured: boolean;
}
export interface ProjectVideo {
  id?: number;
  url: string;
  source: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: Author;
  tags: string | null;
  image_url: string | null;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  images?: ImageResponse[];
}

export interface Author {
  email: string;
  full_name: string;
  id: number;
  is_active: boolean;
  username: string;
}


export interface BlogPostWithDetails extends BlogPost {
  comments: Comment[];
  videos: Video[];
  reactions?: Reaction[];
}

export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags?: string;
  published: boolean;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface MessageResponse {
  message: string;
  detail?: string;
}

export interface MessageStats {
  total_messages: number;
  unread_count: number;
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
  content?: string;
  demoUrl?: string;
  videoUrl?: string;
  category?: string;
  comments?: Comment[];
  comments_count?: number;
  reactions?: ReactionSummary;
}

export interface BlogPostUI extends Omit<BlogPost, 'images'> {
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


export interface Skill {
  id: number | null;
  name: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  proficiency: number;
  yearsOfExperience: number;
}

export interface SkillsData {
  skills: Skill[];
}
