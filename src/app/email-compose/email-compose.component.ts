import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImapService, EmailMessage } from '../imap.service';

@Component({
  selector: 'app-email-compose',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="compose-container" *ngIf="isVisible">
      <div class="compose-overlay" (click)="onClose()"></div>
      
      <div class="compose-modal">
        <div class="compose-header">
          <h3>{{ isReply ? '↩️ Reply to Email' : '✉️ Compose New Email' }}</h3>
          <button (click)="onClose()" class="close-btn">✕</button>
        </div>
        
        <form (ngSubmit)="onSend()" class="compose-form">
          <div class="form-group">
            <label for="to">To</label>
            <input 
              type="email" 
              id="to" 
              [(ngModel)]="emailData.to" 
              name="to"
              placeholder="recipient@example.com"
              required
              [disabled]="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="subject">Subject</label>
            <input 
              type="text" 
              id="subject" 
              [(ngModel)]="emailData.subject" 
              name="subject"
              placeholder="Email subject"
              required
              [disabled]="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="body">Message</label>
            <textarea 
              id="body" 
              [(ngModel)]="emailData.body" 
              name="body"
              placeholder="Type your message here..."
              rows="10"
              required
              [disabled]="isLoading"
            ></textarea>
          </div>
          
          <div class="compose-actions">
            <button 
              type="button" 
              (click)="onClose()" 
              class="btn btn-secondary"
              [disabled]="isLoading"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="isLoading || !emailData.to || !emailData.subject || !emailData.body"
            >
              <span *ngIf="isLoading">🔄 Sending...</span>
              <span *ngIf="!isLoading">{{ isReply ? 'Send Reply' : 'Send Email' }}</span>
            </button>
          </div>
        </form>
        
        <div *ngIf="errorMessage" class="error-message">
          ❌ {{ errorMessage }}
        </div>
        
        <div *ngIf="successMessage" class="success-message">
          ✅ {{ successMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .compose-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .compose-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
    }
    
    .compose-modal {
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .compose-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e1e5e9;
    }
    
    .compose-header h3 {
      margin: 0;
      color: #333;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 5px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .close-btn:hover {
      background-color: #f5f5f5;
    }
    
    .compose-form {
      padding: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #333;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.3s;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .form-group input:disabled,
    .form-group textarea:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
    
    .form-group textarea {
      resize: vertical;
      min-height: 120px;
    }
    
    .compose-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 20px;
      border-top: 1px solid #e1e5e9;
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
    
    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .error-message {
      background-color: #fee;
      color: #c33;
      padding: 12px;
      border-radius: 8px;
      margin: 20px;
      border-left: 4px solid #c33;
    }
    
    .success-message {
      background-color: #efe;
      color: #3c3;
      padding: 12px;
      border-radius: 8px;
      margin: 20px;
      border-left: 4px solid #3c3;
    }
  `]
})
export class EmailComposeComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() replyToEmail: EmailMessage | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() emailSent = new EventEmitter<void>();

  emailData = {
    to: '',
    subject: '',
    body: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private imapService: ImapService) {}

  get isReply(): boolean {
    return this.replyToEmail !== null;
  }

  ngOnInit() {
    if (this.replyToEmail) {
      this.setupReply();
    }
  }

  ngOnChanges() {
    if (this.replyToEmail) {
      this.setupReply();
    } else {
      this.resetForm();
    }
  }

  setupReply() {
    if (this.replyToEmail) {
      this.emailData.to = this.replyToEmail.from;
      this.emailData.subject = this.replyToEmail.subject.startsWith('Re: ') 
        ? this.replyToEmail.subject 
        : `Re: ${this.replyToEmail.subject}`;
      this.emailData.body = `\n\n--- Original Message ---\nFrom: ${this.replyToEmail.from}\nDate: ${this.formatDate(this.replyToEmail.date)}\nSubject: ${this.replyToEmail.subject}\n\n${this.replyToEmail.body}`;
    }
  }

  resetForm() {
    this.emailData = {
      to: '',
      subject: '',
      body: ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  async onSend() {
    if (!this.emailData.to || !this.emailData.subject || !this.emailData.body) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      let result;
      
      if (this.isReply) {
        result = await this.imapService.sendReply(
          this.emailData.to,
          this.emailData.subject,
          this.emailData.body,
          this.replyToEmail?.id
        );
      } else {
        result = await this.imapService.sendEmail(
          this.emailData.to,
          this.emailData.subject,
          this.emailData.body
        );
      }

      if (result.success) {
        this.successMessage = result.message || 'Email sent successfully!';
        setTimeout(() => {
          this.onClose();
          this.emailSent.emit();
        }, 1500);
      } else {
        this.errorMessage = result.message || 'Failed to send email';
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      this.errorMessage = error.message || 'Failed to send email';
    } finally {
      this.isLoading = false;
    }
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
