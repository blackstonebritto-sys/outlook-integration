import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { AuthService } from './auth.service';
import { RouterOutlet } from '@angular/router';
import { GraphService } from './graph.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { RichEditorComponent } from './rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, CommonModule, DatePipe, RichEditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None
})
export class App implements OnInit {
  protected readonly title = signal('outlook');
  protected readonly emails = signal<Array<any>>([]);
  protected readonly dummyEmails = signal<Array<any>>([]);
  protected readonly view = signal<'inbox' | 'sent'>('inbox');
  protected readonly loading = signal<boolean>(false);
  protected readonly interactionInProgress = signal<boolean>(false);
  protected to = signal<string>('');
  protected subject = signal<string>('');
  protected body = signal<string>('');
  protected readonly showCompose = signal<boolean>(false);
  protected readonly selectedEmail = signal<any>(null);

  constructor(protected readonly auth: AuthService, private readonly graph: GraphService) {
    this.initializeDummyEmails();
  }

  async ngOnInit() {
    console.log('App initializing...');
    this.interactionInProgress.set(true);
    
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Initialization timeout')), 5000); // 5 second timeout
    });
    
    try {
      console.log('Handling auth redirect...');
      await Promise.race([
        this.auth.handleRedirect(),
        timeoutPromise
      ]);
      console.log('Auth redirect handled');
    } catch (error) {
      console.error('Error during auth redirect:', error);
      if (error instanceof Error && error.message === 'Initialization timeout') {
        console.warn('Auth initialization timed out, continuing...');
      }
    } finally {
      this.interactionInProgress.set(false);
      console.log('App initialization complete');
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

  // Helper method to get loading status
  getLoadingStatus() {
    return {
      loading: this.loading(),
      interactionInProgress: this.interactionInProgress(),
      hasActiveAccount: !!this.auth.instance.getActiveAccount()
    };
  }

  // Toggle compose view
  toggleCompose() {
    this.showCompose.set(!this.showCompose());
  }

  // Get sender initial for avatar
  getSenderInitial(mail: any): string {
    const name = this.view() === 'inbox' 
      ? (mail.sender?.emailAddress?.name || mail.sender?.emailAddress?.address)
      : (mail.toRecipients?.[0]?.emailAddress?.name || mail.toRecipients?.[0]?.emailAddress?.address);
    return (name || 'U').charAt(0).toUpperCase();
  }

  // Track by function for performance
  trackByEmailId(index: number, mail: any): string {
    return mail.id || index.toString();
  }

  // Initialize dummy emails
  private initializeDummyEmails() {
    const dummyEmails = [
      {
        id: 'dummy-1',
        subject: 'RE: URGENT: RE: Cluster : Liner...',
        bodyPreview: 'Please find the updated cluster information attached. This is urgent and requires immediate attention.',
        body: {
          content: `
            <p>Dear Team,</p>
            <p>Please find the updated cluster information attached. This is urgent and requires immediate attention.</p>
            <p>The following changes have been made:</p>
            <ul>
              <li>Updated liner schedules for Q4</li>
              <li>Revised port allocations</li>
              <li>New container capacity limits</li>
            </ul>
            <p>Please review and confirm receipt by end of business today.</p>
            <p>Best regards,<br>Densingh Blackstone</p>
          `
        },
        receivedDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        sender: {
          emailAddress: {
            name: 'Densingh Blackstone',
            address: 'densingh@blackstone.com'
          }
        },
        toRecipients: [{
          emailAddress: {
            name: 'Angular Development Team',
            address: 'angular@blackstone.com'
          }
        }]
      },
      {
        id: 'dummy-2',
        subject: 'Status Changed Due D Task ID 27520',
        bodyPreview: 'Task status has been updated to In Progress. Please review and provide feedback.',
        body: {
          content: `
            <p>Task ID: 27520</p>
            <p>Subject: Delete buy rate entry on Job no: 2514033</p>
            <p>Status: In Progress</p>
            <p>Description: Dear Team, Kindly delete buy rate entry from BLISS for AAI charges, as the cheque request has already been sent by the CHA team for the same invoice. This is a duplicate entry mistakenly updated by me. Please delete and confirm.</p>
            <p>Last Followup: @karthick Removed. Kindly check and confirm</p>
            <p>Followup Updated By: Hariharan M</p>
          `
        },
        receivedDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        sender: {
          emailAddress: {
            name: 'Alert Blackstone Shipping',
            address: 'alerts@blackstone.com'
          }
        },
        toRecipients: [{
          emailAddress: {
            name: 'Development Team',
            address: 'dev@blackstone.com'
          }
        }]
      },
      {
        id: 'dummy-3',
        subject: 'Followup Added - Task ID: 27520',
        bodyPreview: 'A new followup has been added to the task. Please check the details and take necessary action.',
        body: {
          content: `
            <p>Hello Project Manager,</p>
            <p>A new followup has been added to Task ID: 27520. Please check the details and take necessary action.</p>
            <p><strong>Followup Details:</strong></p>
            <ul>
              <li>Added by: System Administrator</li>
              <li>Priority: High</li>
              <li>Due Date: End of this week</li>
            </ul>
            <p>Please log into the system to view complete details.</p>
            <p>Best regards,<br>Alert System</p>
          `
        },
        receivedDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        sender: {
          emailAddress: {
            name: 'Alert Blackstone Shipping',
            address: 'alerts@blackstone.com'
          }
        },
        toRecipients: [{
          emailAddress: {
            name: 'Project Manager',
            address: 'pm@blackstone.com'
          }
        }]
      },
      {
        id: 'dummy-4',
        subject: 'Status Changed Due D Task ID 27519',
        bodyPreview: 'Task status has been updated to Completed. All requirements have been fulfilled.',
        body: {
          content: `
            <p>Dear QA Team,</p>
            <p>Task status has been updated to Completed. All requirements have been fulfilled.</p>
            <p><strong>Task Summary:</strong></p>
            <ul>
              <li>Task ID: 27519</li>
              <li>Status: Completed</li>
              <li>Completion Date: Today</li>
              <li>Quality Score: 95%</li>
            </ul>
            <p>Please review and provide your feedback.</p>
            <p>Regards,<br>Development Team</p>
          `
        },
        receivedDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        sender: {
          emailAddress: {
            name: 'Alert Blackstone Shipping',
            address: 'alerts@blackstone.com'
          }
        },
        toRecipients: [{
          emailAddress: {
            name: 'Quality Assurance',
            address: 'qa@blackstone.com'
          }
        }]
      },
      {
        id: 'dummy-5',
        subject: 'Followup Added - Task ID : 27520',
        bodyPreview: 'Reminder: Please complete the pending task by end of week. Contact support if you need assistance.',
        body: {
          content: `
            <p>Hello Team Lead,</p>
            <p>This is a reminder that the following task needs to be completed by end of week:</p>
            <p><strong>Task Details:</strong></p>
            <ul>
              <li>Task ID: 27520</li>
              <li>Priority: High</li>
              <li>Due Date: Friday, End of Week</li>
              <li>Assigned to: Development Team</li>
            </ul>
            <p>Please contact support if you need any assistance or have questions.</p>
            <p>Thank you,<br>Project Management Office</p>
          `
        },
        receivedDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last week
        sender: {
          emailAddress: {
            name: 'Alert Blackstone Shipping',
            address: 'alerts@blackstone.com'
          }
        },
        toRecipients: [{
          emailAddress: {
            name: 'Team Lead',
            address: 'lead@blackstone.com'
          }
        }]
      }
    ];
    this.dummyEmails.set(dummyEmails);
  }

  // Get emails to display (real emails or dummy emails)
  getDisplayEmails() {
    const realEmails = this.emails();
    return realEmails.length > 0 ? realEmails : this.dummyEmails();
  }

  // Select email for preview
  selectEmail(email: any) {
    this.selectedEmail.set(email);
  }

  // Check if email is selected
  isEmailSelected(email: any): boolean {
    return this.selectedEmail()?.id === email.id;
  }

  // Get email body content (for preview)
  getEmailBody(email: any): string {
    if (email.body?.content) {
      return email.body.content;
    }
    return email.bodyPreview || 'No content available';
  }
}
