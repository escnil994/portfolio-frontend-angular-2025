import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { ContactMessage, MessageStats } from '../../../interfaces/portfolio.interface';

type MessageFilter = 'all' | 'read' | 'unread';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './messages.component.html',
})
export class MessagesComponent implements OnInit {
  adminService = inject(AdminService);

  loading = signal(true);
  messages = signal<ContactMessage[]>([]);
  stats = signal<MessageStats>({ total_messages: 0, unread_count: 0 });
  currentFilter = signal<MessageFilter>('unread');

  ngOnInit(): void {
    this.loadStats();
    this.loadMessages();
  }

  loadStats(): void {
    this.adminService.getMessageStats().subscribe(data => this.stats.set(data));
  }

  loadMessages(): void {
    this.loading.set(true);
    this.adminService.getMessages(this.currentFilter()).subscribe(data => {
      this.messages.set(data);
      this.loading.set(false);
    });
  }

  changeFilter(filter: MessageFilter): void {
    this.currentFilter.set(filter);
    this.loadMessages();
  }

  onToggleRead(message: ContactMessage): void {
    const newStatus = !message.read;

    this.adminService.updateMessageStatus(message.id, newStatus).subscribe(updatedMessage => {
      this.messages.update(current =>
        current.map(m => m.id === message.id ? updatedMessage : m)
      );
      this.loadStats();
    });
  }

  onReply(message: ContactMessage): void {
    // 1. Abre el cliente de correo inmediatamente
    const subject = `RE: ${message.subject || 'Contact Form Inquiry'}`;
    window.location.href = `mailto:${message.email}?subject=${encodeURIComponent(subject)}`;

    // 2. Si no estaba leído, márcalo como leído en el backend
    if (!message.read) {
      this.adminService.updateMessageStatus(message.id, true).subscribe(updatedMessage => {
        this.messages.update(current =>
          current.map(m => m.id === message.id ? updatedMessage : m)
        );
        this.loadStats();
      });
    }
  }

  onDelete(message: ContactMessage): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.adminService.deleteMessage(message.id).subscribe(() => {
        this.messages.update(current =>
          current.filter(m => m.id !== message.id)
        );
        this.loadStats();
      });
    }
  }
}
