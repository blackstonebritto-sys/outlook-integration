import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { RouterOutlet } from '@angular/router';
import { GraphService } from './graph.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, CommonModule, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('outlook');
  protected readonly emails = signal<Array<any>>([]);
  protected readonly view = signal<'inbox' | 'sent'>('inbox');
  protected readonly loading = signal<boolean>(false);
  protected readonly interactionInProgress = signal<boolean>(false);
  protected to = signal<string>('');
  protected subject = signal<string>('');
  protected body = signal<string>('');

  constructor(private readonly auth: AuthService, private readonly graph: GraphService) {}

  async ngOnInit() {
    this.interactionInProgress.set(true);
    try {
      await this.auth.handleRedirect();
    } finally {
      this.interactionInProgress.set(false);
    }
  }

  login() {
    if (!this.auth.instance.getActiveAccount()) {
      this.auth.loginRedirect();
    }
  }

  logout() {
    this.auth.logoutRedirect();
  }

  clearCacheAndLogin() {
    this.auth.clearCacheAndLogin();
  }

  async loadInbox() {
    this.loading.set(true);
    try {
      const result = await this.graph.getInbox(10) as any;
      if (!result) return;
      this.emails.set(result?.value ?? []);
      this.view.set('inbox');
    } catch (error) {
      console.error('Failed to load inbox:', error);
      // You might want to show a user-friendly error message here
      alert('Failed to load inbox. Please try logging in again.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSent() {
    this.loading.set(true);
    try {
      const result = await this.graph.getSent(10) as any;
      if (!result) return;
      this.emails.set(result?.value ?? []);
      this.view.set('sent');
    } catch (error) {
      console.error('Failed to load sent emails:', error);
      alert('Failed to load sent emails. Please try logging in again.');
    } finally {
      this.loading.set(false);
    }
  }

  decodeToken() {
    const token = (this.auth as any).lastToken as string | undefined;
    return token ? (this.auth as any).decodeJwt(token) : null;
  }

  async sendEmail() {
    if (!this.to() || !this.subject()) return;
    this.loading.set(true);
    try {
      await this.graph.sendMail(this.to(), this.subject(), this.body());
      this.to.set('');
      this.subject.set('');
      this.body.set('');
      await this.loadSent();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async checkTokenInfo() {
    try {
      await this.graph.checkTokenInfo();
    } catch (error) {
      console.error('Failed to check token info:', error);
      alert('Failed to check token info. Please try logging in again.');
    }
  }

  async testTokenAcquisition() {
    this.loading.set(true);
    try {
      console.log('Testing token acquisition...');
      const token = await this.auth.acquireGraphToken();
      if (token) {
        console.log('Token acquired successfully!');
        console.log('Token length:', token.length);
        console.log('Token preview:', token.substring(0, 100) + '...');
        alert('Token acquired successfully! Check console for details.');
      } else {
        console.log('No token acquired');
        alert('No token acquired. Please log in first.');
      }
    } catch (error) {
      console.error('Token acquisition failed:', error);
      alert('Token acquisition failed: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  async testMe() {
    this.loading.set(true);
    try {
      const result = await this.graph.getMe() as any;
      console.log('User profile:', result);
      alert(`Success! User: ${result.displayName} (${result.mail || result.userPrincipalName})`);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      alert('Failed to get user profile. Please try logging in again.');
    } finally {
      this.loading.set(false);
    }
  }

  async checkMailboxAccess() {
    this.loading.set(true);
    try {
      const hasAccess = await this.graph.checkMailboxAccess();
      if (hasAccess) {
        alert('✅ Mailbox access is available! You can read emails.');
      } else {
        alert('❌ No mailbox access. Your account may not have Exchange Online mailbox.');
      }
    } catch (error) {
      console.error('Failed to check mailbox access:', error);
      alert('Failed to check mailbox access. Please try logging in again.');
    } finally {
      this.loading.set(false);
    }
  }
}
