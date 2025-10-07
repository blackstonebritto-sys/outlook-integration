import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImapService, EmailMessage } from '../imap.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-email-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="header-left">
          <h2>📧 Your Emails</h2>
          <p *ngIf="currentUser">Logged in as: {{ currentUser.email }}</p>
        </div>
        <div class="header-right">
          <button (click)="refreshEmails()" [disabled]="isLoading" class="btn btn-primary">
            <span *ngIf="isLoading">🔄 Loading...</span>
            <span *ngIf="!isLoading">🔄 Refresh</span>
          </button>
          <button (click)="loadEmails()" class="btn btn-outline">
            📧 Load Emails
          </button>
          <button (click)="onLogout()" class="btn btn-secondary">
            🚪 Logout
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="email-controls">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchText" 
            (input)="onSearch()"
            placeholder="Search emails..."
            class="search-input"
          >
          <button (click)="clearSearch()" *ngIf="searchText" class="clear-btn">✕</button>
        </div>
        
        <div class="filter-buttons">
          <button 
            (click)="filterBySender()" 
            [class.active]="filterBy === 'sender'"
            class="filter-btn"
          >
            👤 By Sender
          </button>
          <button 
            (click)="filterBySubject()" 
            [class.active]="filterBy === 'subject'"
            class="filter-btn"
          >
            📝 By Subject
          </button>
          <button 
            (click)="showAllEmails()" 
            [class.active]="filterBy === 'all'"
            class="filter-btn"
          >
            📋 All Emails
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading emails...</p>
        <p>Debug: isLoading = {{ isLoading }}, emails.length = {{ emails.length }}</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="error-state">
        <p>❌ {{ errorMessage }}</p>
        <button (click)="refreshEmails()" class="btn btn-primary">Try Again</button>
      </div>

      <!-- Email List -->
      <div *ngIf="!isLoading && !errorMessage" class="email-list">
        <div class="debug-info" style="background: #f0f0f0; padding: 10px; margin: 10px; border-radius: 4px; font-size: 12px;">
          <strong>Debug Info:</strong> isLoading={{ isLoading }}, errorMessage="{{ errorMessage }}", emails.length={{ emails.length }}
        </div>
        
        <div *ngIf="emails.length === 0" class="empty-state">
          <p>📭 No emails found</p>
          <p *ngIf="searchText">Try adjusting your search terms</p>
          <p>Debug: emails array is empty</p>
        </div>
        
        <div 
          *ngFor="let email of emails; trackBy: trackByEmailId" 
          class="email-item"
          [class.unread]="!email.read"
          (click)="selectEmail(email)"
        >
          <div class="email-preview">
            <div class="email-from">
              <strong>{{ email.from }}</strong>
              <span class="email-date">{{ formatDate(email.date) }}</span>
            </div>
            <div class="email-subject">{{ email.subject }}</div>
            <div class="email-body-preview">{{ getBodyPreview(email.body) }}</div>
          </div>
          
          <div class="email-actions">
            <button (click)="replyToEmail(email)" class="action-btn reply-btn">
              ↩️ Reply
            </button>
            <button (click)="markAsRead(email)" *ngIf="!email.read" class="action-btn read-btn">
              ✓ Mark Read
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="emails.length > 0" class="pagination">
        <button 
          (click)="loadMoreEmails()" 
          [disabled]="isLoading"
          class="btn btn-outline"
        >
          Load More Emails
        </button>
      </div>
    </div>
  `,
  styles: [`
    .email-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f8f9fa;
      min-height: 100vh;
    }
    
    .email-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .header-left h2 {
      margin: 0 0 5px 0;
      color: #333;
    }
    
    .header-left p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .header-right {
      display: flex;
      gap: 10px;
    }
    
    .email-controls {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .search-box {
      position: relative;
      margin-bottom: 15px;
    }
    
    .search-input {
      width: 100%;
      padding: 12px 40px 12px 12px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
    }
    
    .search-input:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .clear-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: #999;
    }
    
    .filter-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .filter-btn {
      padding: 8px 16px;
      border: 2px solid #e1e5e9;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .filter-btn:hover {
      border-color: #667eea;
    }
    
    .filter-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
    
    .loading-state, .error-state, .empty-state {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .email-list {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .email-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e1e5e9;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .email-item:hover {
      background-color: #f8f9fa;
    }
    
    .email-item.unread {
      background-color: #f0f8ff;
      border-left: 4px solid #667eea;
    }
    
    .email-preview {
      flex: 1;
      margin-right: 20px;
    }
    
    .email-from {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .email-date {
      color: #666;
      font-size: 12px;
    }
    
    .email-subject {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }
    
    .email-body-preview {
      color: #666;
      font-size: 14px;
      line-height: 1.4;
      max-height: 2.8em;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .email-actions {
      display: flex;
      gap: 10px;
    }
    
    .action-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }
    
    .reply-btn {
      background: #28a745;
      color: white;
    }
    
    .reply-btn:hover {
      background: #218838;
    }
    
    .read-btn {
      background: #6c757d;
      color: white;
    }
    
    .read-btn:hover {
      background: #5a6268;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #5a6fd8;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #5a6268;
    }
    
    .btn-outline {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    
    .btn-outline:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .pagination {
      text-align: center;
      margin-top: 20px;
    }
  `]
})
export class EmailListComponent implements OnInit, OnDestroy {
  @Output() replyToEmailEvent = new EventEmitter<EmailMessage>();
  @Output() logout = new EventEmitter<void>();
  
  emails: EmailMessage[] = [];
  currentUser: any = null;
  isLoading = false;
  errorMessage = '';
  searchText = '';
  filterBy = 'all';
  private destroy$ = new Subject<void>();

  constructor(private imapService: ImapService) {}

  ngOnInit() {
    console.log('🚀 EmailListComponent initialized');
    this.currentUser = this.imapService.getCurrentUser();
    console.log('👤 Current user:', this.currentUser);
    
    // Add a small delay to ensure everything is ready
    setTimeout(() => {
      this.loadEmails();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadEmails() {
    console.log('🔄 Starting to load emails...');
    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('📡 Calling imapService.getEmails()...');
      const emails = await this.imapService.getEmails();
      console.log('✅ Emails received from API:', emails);
      
      this.emails = emails || [];
      console.log('📧 Emails assigned to component:', this.emails);
      
      if (this.emails.length === 0) {
        console.log('⚠️ No emails received from API');
      }
    } catch (error: any) {
      console.error('❌ Error loading emails:', error);
      this.errorMessage = error.message || 'Failed to load emails';
      this.emails = []; // Ensure emails array is empty on error
    } finally {
      console.log('🏁 Loading completed, setting isLoading to false');
      this.isLoading = false;
    }
  }

  async refreshEmails() {
    await this.loadEmails();
  }

  onSearch() {
    if (this.searchText.trim()) {
      this.performSearch();
    } else {
      this.loadEmails();
    }
  }

  async performSearch() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.emails = await this.imapService.searchEmails(this.searchText);
    } catch (error: any) {
      console.error('Error searching emails:', error);
      this.errorMessage = error.message || 'Search failed';
    } finally {
      this.isLoading = false;
    }
  }

  clearSearch() {
    this.searchText = '';
    this.loadEmails();
  }

  filterBySender() {
    this.filterBy = 'sender';
    // Implement sender filtering
  }

  filterBySubject() {
    this.filterBy = 'subject';
    // Implement subject filtering
  }

  showAllEmails() {
    this.filterBy = 'all';
    this.loadEmails();
  }

  selectEmail(email: EmailMessage) {
    console.log('Selected email:', email);
    // Implement email selection logic
  }

  replyToEmail(email: EmailMessage) {
    this.replyToEmailEvent.emit(email);
  }

  async markAsRead(email: EmailMessage) {
    try {
      email.read = true;
      // Implement mark as read functionality
      console.log('Marked as read:', email.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  loadMoreEmails() {
    // Implement pagination
    console.log('Load more emails');
  }

  onLogout() {
    this.imapService.logout();
    this.logout.emit();
  }

  trackByEmailId(index: number, email: EmailMessage): string {
    return email.id;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const emailDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - emailDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return emailDate.toLocaleDateString();
    }
  }

  getBodyPreview(body: string): string {
    if (!body) return 'No content';
    return body.length > 100 ? body.substring(0, 100) + '...' : body;
  }
}
