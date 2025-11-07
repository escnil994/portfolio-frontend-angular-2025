import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProjectFormData, BlogPostFormData, ProjectVideo } from '../interfaces/portfolio.interface';

type EntityType = 'projects' | 'blog';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== GENERIC CRUD ====================

  private create<T>(entity: EntityType, data: T, isAdmin = true): Observable<any> {
    const path = isAdmin ? `${entity}/admin` : entity;
    return this.http.post(`${this.apiUrl}/${path}`, data);
  }

  private update<T>(entity: EntityType, id: number, data: T, isAdmin = true): Observable<any> {
    const path = isAdmin ? `${entity}/admin/${id}` : `${entity}/${id}`;
    return this.http.put(`${this.apiUrl}/${path}`, data);
  }

  private delete(entity: EntityType, id: number, isAdmin = true): Observable<void> {
    const path = isAdmin ? `${entity}/admin/${id}` : `${entity}/${id}`;
    return this.http.delete<void>(`${this.apiUrl}/${path}`);
  }

  private getForEdit(entity: EntityType, identifier: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${entity}/${identifier}`);
  }

  // ==================== PROJECTS ====================

  createProject(projectData: ProjectFormData): Observable<any> {
    return this.create('projects', projectData);
  }

  updateProject(projectId: number, projectData: ProjectFormData): Observable<any> {
    return this.update('projects', projectId, projectData);
  }

  deleteProject(projectId: number): Observable<void> {
    return this.delete('projects', projectId);
  }

  getProjectForEdit(projectId: number): Observable<any> {
    return this.getForEdit('projects', projectId);
  }

  // ==================== BLOG POSTS ====================

  createPost(postData: BlogPostFormData): Observable<any> {
    return this.create('blog', postData, false);
  }

  updatePost(postId: number, postData: BlogPostFormData): Observable<any> {
    return this.update('blog', postId, postData, false);
  }

  deletePost(postId: number): Observable<void> {
    return this.delete('blog', postId, false);
  }

  getPostForEdit(slug: string): Observable<any> {
    return this.getForEdit('blog', slug);
  }

  // ==================== IMAGES (GENERIC) ====================

  uploadImage(entity: EntityType, entityId: number, file: File, imageOrder: number, altText?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image_order', imageOrder.toString());
    if (altText) formData.append('alt_text', altText);

    const path = entity === 'projects'
      ? `${entity}/admin/${entityId}/images/upload`
      : `${entity}/${entityId}/images/upload`;

    return this.http.post(`${this.apiUrl}/${path}`, formData);
  }

  updateImageMetadata(entity: EntityType, entityId: number, imageId: number, imageOrder: number, altText?: string): Observable<any> {
    const path = entity === 'projects'
      ? `${entity}/admin/${entityId}/images/${imageId}`
      : `${entity}/${entityId}/images/${imageId}`;

    return this.http.put(`${this.apiUrl}/${path}`, { image_order: imageOrder, alt_text: altText });
  }

  replaceImage(entity: EntityType, entityId: number, imageId: number, file: File, imageOrder?: number, altText?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (imageOrder) formData.append('image_order', imageOrder.toString());
    if (altText) formData.append('alt_text', altText);

    const path = entity === 'projects'
      ? `${entity}/admin/${entityId}/images/${imageId}/replace`
      : `${entity}/${entityId}/images/${imageId}/replace`;

    return this.http.put(`${this.apiUrl}/${path}`, formData);
  }

  deleteImage(entity: EntityType, entityId: number, imageId: number): Observable<void> {
    const path = entity === 'projects'
      ? `${entity}/admin/${entityId}/images/${imageId}`
      : `${entity}/${entityId}/images/${imageId}`;

    return this.http.delete<void>(`${this.apiUrl}/${path}`);
  }

  // ==================== VIDEOS (GENERIC) ====================

  addVideo(entity: EntityType, entityId: number, videoData: any): Observable<ProjectVideo> {
    const path = entity === 'projects'
      ? `${entity}/admin/${entityId}/videos`
      : `${entity}/${entityId}/videos`;

    return this.http.post<ProjectVideo>(`${this.apiUrl}/${path}`, videoData);
  }

  deleteVideo(entity: EntityType, entityId: number, videoId: number): Observable<void> {
    const path = entity === 'projects'
      ? `${entity}/admin/${entityId}/videos/${videoId}`
      : `${entity}/${entityId}/videos/${videoId}`;

    return this.http.delete<void>(`${this.apiUrl}/${path}`);
  }

  // ==================== LEGACY METHODS (Para compatibilidad) ====================

  uploadProjectImage(projectId: number, file: File, imageOrder: number, altText?: string): Observable<any> {
    return this.uploadImage('projects', projectId, file, imageOrder, altText);
  }

  uploadPostImage(postId: number, file: File, imageOrder: number, altText?: string): Observable<any> {
    return this.uploadImage('blog', postId, file, imageOrder, altText);
  }

  deleteProjectImage(projectId: number, imageId: number): Observable<void> {
    return this.deleteImage('projects', projectId, imageId);
  }

  deletePostImage(postId: number, imageId: number): Observable<void> {
    return this.deleteImage('blog', postId, imageId);
  }

  addProjectVideo(projectId: number, videoData: any): Observable<ProjectVideo> {
    return this.addVideo('projects', projectId, videoData);
  }

  addPostVideo(postId: number, videoData: any): Observable<ProjectVideo> {
    return this.addVideo('blog', postId, videoData);
  }
}
