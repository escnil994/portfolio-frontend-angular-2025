import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comment, CommentCreate } from '../interfaces/portfolio.interface';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class.mb-6]="showCommentsList()">
      <form (ngSubmit)="submitComment()" #commentForm="ngForm">
        <div class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              [(ngModel)]="newComment.name"
              name="name"
              placeholder="Your name"
              required
              class="form-input">

            <input
              type="email"
              [(ngModel)]="newComment.email"
              name="email"
              placeholder="Your email"
              required
              class="form-input">
          </div>

          <textarea
            [(ngModel)]="newComment.content"
            name="content"
            placeholder="Share your thoughts..."
            required
            rows="3"
            class="form-input"></textarea>

          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="!commentForm.valid"
              class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#133550] to-[#0ea5e9] rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              <span class="material-icons text-base">send</span>
              Post Comment
            </button>
          </div>
        </div>
      </form>
    </div>

    @if (showCommentsList() && comments().length > 0) {
      <div class="divider">Comments</div>
      <div class="space-y-4">
        @for (comment of comments(); track comment.id) {
          <div class="flex gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-10 h-10">
                <span class="text-sm">{{ comment.name.charAt(0) }}</span>
              </div>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-sm">{{ comment.name }}</span>
                <span class="text-xs text-base-content/60">
                  {{ comment.created_at | date: 'MMM d, yyyy' }}
                </span>
              </div>
              <p class="text-sm text-base-content/80">{{ comment.content }}</p>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class CommentSectionComponent {
  comments = input.required<Comment[]>();
  showCommentsList = input(true);
  onCommentSubmit = output<CommentCreate>();

  newComment: CommentCreate = {
    name: '',
    email: '',
    content: ''
  };

  submitComment() {
    if (this.newComment.name && this.newComment.email && this.newComment.content) {
      this.onCommentSubmit.emit({ ...this.newComment });
      this.newComment = { name: '', email: '', content: '' };
    }
  }
}
