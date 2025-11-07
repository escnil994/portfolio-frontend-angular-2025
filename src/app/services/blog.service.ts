import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  BlogPostUI,
  BlogPostWithDetails,
  Comment,
  CommentCreate,
  ReactionSummary,
  Image,
} from '../interfaces/portfolio.interface';
import { environment } from '../../environments/environment';
import { ReactionType } from '../enums/reaction-type.enum';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/blog`;

  private reactionsCache = new Map<string, Observable<ReactionSummary>>();

  getPosts(
    skip: number = 0,
    limit: number = 100,
    published: boolean = true
  ): Observable<BlogPostUI[]> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString())
      .set('published', published.toString());

    return this.http
      .get<any[]>(this.apiUrl, { params })
      .pipe(map((posts) => posts.map((post) => this.mapPostToUI(post))));
  }

  getPostBySlug(slug: string): Observable<BlogPostWithDetails> {
    return this.http.get<any>(`${this.apiUrl}/${slug}`);
  }

  addComment(postId: number, comment: CommentCreate): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, comment);
  }

  toggleReaction(
    postId: number,
    userName: string,
    userEmail: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${postId}/reactions`, {
      user_name: userName,
      user_email: userEmail,
    });
  }

  getReactions(postId: number, userEmail?: string): Observable<ReactionSummary> {
    const cacheKey = `${postId}-${userEmail || 'anonymous'}`;

    if (this.reactionsCache.has(cacheKey)) {
      return this.reactionsCache.get(cacheKey)!;
    }

    let params = new HttpParams();
    if (userEmail) {
      params = params.set('user_email', userEmail);
    }

    const request$ = this.http
      .get<ReactionSummary>(`${environment.apiUrl}/reactions/blog_post/${postId}/summary`, {
        params,
      })
      .pipe(
        shareReplay(1),
        tap(() => {
          setTimeout(() => {
            this.reactionsCache.delete(cacheKey);
          }, 2000);
        })
      );

    this.reactionsCache.set(cacheKey, request$);
    return request$;
  }


  invalidateReactionsCache(postId: number, userEmail?: string): void {
    const cacheKey = `${postId}-${userEmail || 'anonymous'}`;
    this.reactionsCache.delete(cacheKey);
  }

  deleteReaction(postId: number, email: string): Observable<void> {
    this.invalidateReactionsCache(postId, email);

    return this.http.delete<void>(`${environment.apiUrl}/reactions/blog_post/${postId}`, {
      params: { email },
    });
  }

  getComments(postSlug: string): Observable<Comment[]> {
    return this.http
      .get<any>(`${this.apiUrl}/${postSlug}`)
      .pipe(map((post) => post.comments || []));
  }

  private mapPostToUI(post: any): BlogPostUI {
    const images = post.images?.map((img: Image) => img.image_url) || [];
    const tags = post.tags ? post.tags.split(',').map((t: string) => t.trim()) : [];

    return {
      ...post,
      image: images[0] || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
      images:
        images.length > 0
          ? images
          : [
              post.image_url ||
                'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
            ],
      category: this.extractCategory(tags),
      date: post.created_at,
      readTime: this.calculateReadTime(post.content),
      reactions: {
        total_reactions: 0,
        like_count: 0,
        love_count: 0,
        congratulations_count: 0,
        user_reaction: null,
      },
      comments_count: 0,
      comments: [],
    };
  }

  private extractCategory(tags: string[]): string {
    const categories = ['devops', 'cloud', 'development', 'tutorials'];
    const tag = tags.find((t) => categories.includes(t.toLowerCase()));
    return tag ? tag.toLowerCase() : 'development';
  }

  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }


  addReaction(
    postId: number,
    reactionData: { email: string; name: string; reaction_type: ReactionType }
  ): Observable<any> {
    this.invalidateReactionsCache(postId, reactionData.email);

    return this.http
      .post(`${environment.apiUrl}/reactions/blog_post/${postId}`, reactionData)
      .pipe(
        tap(() => {
          this.invalidateReactionsCache(postId, reactionData.email);
        })
      );
  }
}
