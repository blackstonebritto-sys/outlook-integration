import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImapService, LoginCredentials } from '../imap.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>📧 Outlook Email Login</h2>
          <p>Enter your company email credentials to access your emails</p>
        </div>
        
        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="credentials.email" 
              name="email"
              placeholder="your-email@company.com"
              required
              [disabled]="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              [(ngModel)]="credentials.password" 
              name="password"
              placeholder="Your email password"
              required
              [disabled]="isLoading"
            >
          </div>
          
          <button 
            type="submit" 
            class="login-btn"
            [disabled]="isLoading || !credentials.email || !credentials.password"
          >
            <span *ngIf="isLoading">🔄 Logging in...</span>
            <span *ngIf="!isLoading">🚀 Login to Outlook</span>
          </button>
        </form>
        
        <div *ngIf="errorMessage" class="error-message">
          ❌ {{ errorMessage }}
        </div>
        
        <div class="login-info">
          <h4>ℹ️ Important Notes:</h4>
          <ul>
            <li>Use your company email address</li>
            <li>Use your regular email password</li>
            <li>No special permissions needed from IT</li>
            <li>Works with any Outlook account</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .login-header h2 {
      color: #333;
      margin-bottom: 10px;
      font-size: 24px;
    }
    
    .login-header p {
      color: #666;
      font-size: 14px;
    }
    
    .login-form {
      margin-bottom: 20px;
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
    
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .form-group input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
    
    .login-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    
    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .error-message {
      background-color: #fee;
      color: #c33;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #c33;
    }
    
    .login-info {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .login-info h4 {
      margin: 0 0 10px 0;
      color: #333;
    }
    
    .login-info ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .login-info li {
      margin-bottom: 5px;
      color: #666;
      font-size: 14px;
    }
  `]
})
export class LoginComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();
  
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  errorMessage = '';

  constructor(private imapService: ImapService) {}

  ngOnInit() {
    // Check if user is already logged in
    if (this.imapService.isLoggedIn()) {
      // Redirect to email list or emit event
      console.log('User already logged in');
    }
  }

  async onLogin() {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await this.imapService.login(this.credentials);
      
      if (result.success) {
        console.log('Login successful:', result.user);
        // Emit event or navigate to email list
        this.onLoginSuccess();
      } else {
        this.errorMessage = result.message;
      }
    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage = 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  onLoginSuccess() {
    this.loginSuccess.emit();
    console.log('Login successful, redirecting to email list...');
  }
}
