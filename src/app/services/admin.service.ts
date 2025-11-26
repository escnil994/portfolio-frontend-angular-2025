import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ProjectFormData,
  BlogPostFormData,
  ProjectVideo,
  ContactMessage,
  MessageStats,
} from '../interfaces/portfolio.interface';
import { ImageResponse, ProfileResponse, ProfileUpdate } from '../interfaces/user.interface';

type EntityType = 'projects' | 'blog';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private request<T>(method: 'post' | 'put' | 'delete' | 'get' | 'patch', path: string, body?: any, params?: any): Observable<T> {
    return this.http.request<T>(method, `${this.apiUrl}/${path}`, { body, params });
  }

  createProject(data: ProjectFormData) { return this.request('post', 'projects/admin', data); }
  updateProject(id: number, data: ProjectFormData) { return this.request('put', `projects/admin/${id}`, data); }
  deleteProject(id: number) { return this.request<void>('delete', `projects/admin/${id}`); }
  getProjectForEdit(id: number) { return this.request('get', `projects/${id}`); }

  createPost(data: BlogPostFormData) { return this.request('post', 'blog', data); }
  updatePost(id: number, data: BlogPostFormData) { return this.request('put', `blog/${id}`, data); }
  deletePost(id: number) { return this.request<void>('delete', `blog/${id}`); }
  getPostForEdit(slug: string) { return this.request('get', `blog/${slug}`); }

  uploadImage(entity: EntityType, id: number, file: File, order: number, altText?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image_order', order.toString());
    if (altText) formData.append('alt_text', altText);

    const basePath = entity === 'projects' ? 'projects/admin' : 'blog';
    return this.request('post', `${basePath}/${id}/images/upload`, formData);
  }

  uploadProjectImage(id: number, file: File, order: number, alt?: string) { return this.uploadImage('projects', id, file, order, alt); }
  uploadPostImage(id: number, file: File, order: number, alt?: string) { return this.uploadImage('blog', id, file, order, alt); }

  deleteImage(entity: EntityType, entityId: number, imageId: number) {
    const basePath = entity === 'projects' ? 'projects/admin' : 'blog';
    return this.request<void>('delete', `${basePath}/${entityId}/images/${imageId}`);
  }

  deleteProjectImage(pid: number, imgId: number) { return this.deleteImage('projects', pid, imgId); }
  deletePostImage(pid: number, imgId: number) { return this.deleteImage('blog', pid, imgId); }

  addVideo(entity: EntityType, id: number, videoData: any) {
    const basePath = entity === 'projects' ? 'projects/admin' : 'blog';
    return this.request<ProjectVideo>('post', `${basePath}/${id}/videos`, videoData);
  }

  addProjectVideo(id: number, data: any) { return this.addVideo('projects', id, data); }
  addPostVideo(id: number, data: any) { return this.addVideo('blog', id, data); }

  getProfile() { return this.request<ProfileResponse>('get', 'profiles/'); }
  updateProfile(id: number, data: ProfileUpdate) { return this.request<ProfileResponse>('put', `profiles/${id}`, data); }

  uploadProfileImage(id: number, file: File, altText: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', altText);
    formData.append('image_order', '1');
    return this.request<{ message: string; image: ImageResponse }>('post', `profiles/${id}/images/upload`, formData);
  }

  deleteProfileImage(pid: number, imgId: number) { return this.request<void>('delete', `profiles/${pid}/images/${imgId}`); }

  getMessages(filter: 'all' | 'read' | 'unread') {
    let params = new HttpParams();
    if (filter !== 'all') params = params.set('read', String(filter === 'read'));
    return this.request<ContactMessage[]>('get', 'messages', null, params);
  }

  getMessageStats() { return this.request<MessageStats>('get', 'messages/stats'); }
  updateMessageStatus(id: number, read: boolean) { return this.request<ContactMessage>('patch', `messages/${id}`, { read }); }
  deleteMessage(id: number) { return this.request<void>('delete', `messages/${id}`); }
}
