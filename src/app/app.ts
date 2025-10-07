import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImapService } from './imap.service';
import { LoginComponent } from './login/login.component';
import { EmailListComponent } from './email-list/email-list.component';
import { EmailComposeComponent } from './email-compose/email-compose.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, EmailListComponent, EmailComposeComponent],
  template: `
    <div class="app-container">
      <!-- Login Screen -->
      <app-login 
        *ngIf="!isLoggedIn" 
        (loginSuccess)="onLoginSuccess()"
      ></app-login>
      
      <!-- Email Interface -->
      <div *ngIf="isLoggedIn" class="email-interface">
        <app-email-list 
          (replyToEmailEvent)="onReplyToEmail($event)"
          (logout)="onLogout()"
        ></app-email-list>
      </div>
      
      <!-- Email Compose Modal -->
      <app-email-compose
        [isVisible]="showComposeModal"
        [replyToEmail]="selectedEmailForReply"
        (close)="onCloseCompose()"
        (emailSent)="onEmailSent()"
      ></app-email-compose>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #f8f9fa;
    }
    
    .email-interface {
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  showComposeModal = false;
  selectedEmailForReply: any = null;

  constructor(private imapService: ImapService) {}

  ngOnInit() {
    // Initialize the IMAP service
    this.imapService.initialize();
    
    // Check if user is already logged in
    this.isLoggedIn = this.imapService.isLoggedIn();
    
    // Subscribe to login state changes
    this.imapService.currentUser$.subscribe(user => {
      this.isLoggedIn = user !== null;
    });
  }

  onLoginSuccess() {
    this.isLoggedIn = true;
  }

  onLogout() {
    this.imapService.logout();
    this.isLoggedIn = false;
  }

  onReplyToEmail(email: any) {
    this.selectedEmailForReply = email;
    this.showComposeModal = true;
  }

  onCloseCompose() {
    this.showComposeModal = false;
    this.selectedEmailForReply = null;
  }

  onEmailSent() {
    this.showComposeModal = false;
    this.selectedEmailForReply = null;
    // Optionally refresh the email list
  }
}