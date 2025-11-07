import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactionSummary } from '../interfaces/portfolio.interface';
import { ReactionType } from '../enums/reaction-type.enum';
@Component({
  selector: 'app-reaction-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-t border-base-300">
      <!-- Reaction Summary Bar -->
      @if (reactions().total_reactions > 0 || commentsCount() > 0) {
      <div class="flex items-center justify-between px-4 py-2 text-sm text-base-content/60">
        <!-- Left: Reaction Icons + Count -->
        <div class="flex items-center gap-2">
          @if (reactions().total_reactions > 0) {
          <div class="flex items-center -space-x-1">
            @if (reactions().love_count > 0) {
            <div
              class="w-5 h-5 rounded-full bg-error flex items-center justify-center border border-base-100"
            >
              <span class="text-xs">❤️</span>
            </div>
            } @if (reactions().like_count > 0) {
            <div
              class="w-5 h-5 rounded-full bg-primary flex items-center justify-center border border-base-100"
            >
              <span class="text-xs">👍</span>
            </div>
            } @if (reactions().congratulations_count > 0) {
            <div
              class="w-5 h-5 rounded-full bg-warning flex items-center justify-center border border-base-100"
            >
              <span class="text-xs">🎉</span>
            </div>
            }
          </div>
          <span class="hover:underline cursor-pointer">
            {{ reactions().total_reactions }}
          </span>
          }
        </div>

        <!-- Right: Comments Count (Clickable to view comments) -->
        <div class="flex items-center gap-3">
          @if (commentsCount() > 0) {
          <button
            (click)="onViewComments.emit()"
            class="hover:underline cursor-pointer text-base-content/60 hover:text-base-content"
          >
            {{ commentsCount() }} {{ commentsCount() === 1 ? 'comment' : 'comments' }}
          </button>
          }
        </div>
      </div>
      }

      <!-- Action Buttons -->
      <div class="flex items-center border-t border-base-300">
        <!-- Reaction Button -->
        <div class="flex-1 relative reaction-container">
          <button
            class="w-full py-2 px-4 flex items-center justify-center gap-2 hover:bg-base-200 transition-colors rounded-none"
            [class.text-error]="reactions().user_reaction === 'love'"
            [class.text-primary]="reactions().user_reaction === 'like'"
            [class.text-warning]="reactions().user_reaction === 'congratulations'"
            [class.font-semibold]="reactions().user_reaction"
          >
            <span class="material-icons text-xl">
              {{ reactions().user_reaction ? 'favorite' : 'favorite_border' }}
            </span>
            <span class="text-sm">{{ getReactionLabel() }}</span>
          </button>

          <!-- Reaction Picker -->

          <div
            class="reaction-picker absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-base-100 shadow-2xl rounded-full p-3 flex gap-2 opacity-0 invisible transition-all duration-300 border border-base-300"
          >
            @for (reaction of availableReactions; track reaction.type) {
            <button
              (click)="onReaction.emit(reaction.type)"
              class="reaction-item flex flex-col items-center gap-1 hover:scale-125 transition-transform relative group"
            >
              <span class="text-3xl">{{ reaction.icon }}</span>


              <div
                class="absolute -bottom-8 px-2 py-1 bg-base-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
              >
                {{ reaction.label }}
              </div>
            </button>
            }
          </div>
        </div>

        <!-- Comment Button -->
        <button
          (click)="onToggleComments.emit()"
          class="flex-1 py-2 px-4 flex items-center justify-center gap-2 hover:bg-base-200 transition-colors border-l border-base-300"
        >
          <span class="material-icons text-xl">comment</span>
          <span class="text-sm">Comment</span>
        </button>

        <!-- Share Button -->
        <button
          (click)="onShare.emit()"
          class="flex-1 py-2 px-4 flex items-center justify-center gap-2 hover:bg-base-200 transition-colors border-l border-base-300"
        >
          <span class="material-icons text-xl">share</span>
          <span class="text-sm">Share</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .reaction-container:hover .reaction-picker {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-8px);
      }

      .reaction-picker {
        z-index: 50;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      }

      .reaction-item {
        position: relative;
        padding: 8px;
        border-radius: 50%;
        cursor: pointer;
      }

      .reaction-item:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      .reaction-item:active {
        transform: scale(1.1);
      }

      /* Prevent picker from closing when moving mouse to it */
      .reaction-container::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30px;
        z-index: 49;
      }

      /* Animation for reaction icons */
      @keyframes popIn {
        0% {
          opacity: 0;
          transform: scale(0) translateY(20px);
        }
        50% {
          transform: scale(1.1) translateY(-5px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .reaction-picker:not(.opacity-0) .reaction-item:nth-child(1) {
        animation: popIn 0.3s ease-out 0.05s backwards;
      }
      .reaction-picker:not(.opacity-0) .reaction-item:nth-child(2) {
        animation: popIn 0.3s ease-out 0.1s backwards;
      }
      .reaction-picker:not(.opacity-0) .reaction-item:nth-child(3) {
        animation: popIn 0.3s ease-out 0.15s backwards;
      }
    `,
  ],
})
export class ReactionBarComponent {
  reactions = input.required<ReactionSummary>();
  commentsCount = input.required<number>();
  onReaction = output<ReactionType>();
  onToggleComments = output<void>();
  onShare = output<void>();

  availableReactions = [
    { type: ReactionType.Like, icon: '👍', label: 'Like' },
    { type: ReactionType.Love, icon: '❤️', label: 'Love' },
    { type: ReactionType.Congratulations, icon: '🎉', label: 'Congratulations' },
  ];

  onViewComments = output<void>();

  getReactionLabel(): string {
    const userReaction = this.reactions().user_reaction;
    if (!userReaction) return 'Like';

    const reaction = this.availableReactions.find((r) => r.type === userReaction);
    return reaction?.label || 'Like';
  }

  getReactionCount(type: ReactionType): number {
    switch (type) {
      case ReactionType.Like:
        return this.reactions().like_count;
      case ReactionType.Love:
        return this.reactions().love_count;
      case ReactionType.Congratulations:
        return this.reactions().congratulations_count;
      default:
        return 0;
    }
  }
}
