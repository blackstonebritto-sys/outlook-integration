import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ImapService {
  private readonly baseUrl = 'http://localhost:3000/api'; // Your backend server

  constructor(private http: HttpClient) {}

  // Get all emails
  async getEmails(): Promise<EmailMessage[]> {
    const result = await this.http.get<EmailMessage[]>(`${this.baseUrl}/emails`).toPromise();
    return result || [];
  }

  // Get emails with text filter
  async getEmailsByText(searchText: string): Promise<EmailMessage[]> {
    const result = await this.http.get<EmailMessage[]>(`${this.baseUrl}/emails/search?text=${encodeURIComponent(searchText)}`).toPromise();
    return result || [];
  }

  // Get emails by sender
  async getEmailsBySender(sender: string): Promise<EmailMessage[]> {
    const result = await this.http.get<EmailMessage[]>(`${this.baseUrl}/emails/sender?from=${encodeURIComponent(sender)}`).toPromise();
    return result || [];
  }

  // Get unread emails
  async getUnreadEmails(): Promise<EmailMessage[]> {
    const result = await this.http.get<EmailMessage[]>(`${this.baseUrl}/emails/unread`).toPromise();
    return result || [];
  }

  // Send reply
  async sendReply(to: string, subject: string, body: string, inReplyTo?: string): Promise<void> {
    const payload = {
      to,
      subject,
      body,
      inReplyTo
    };
    
    await this.http.post(`${this.baseUrl}/emails/send`, payload).toPromise();
  }

  // Mark as read
  async markAsRead(emailId: string): Promise<void> {
    await this.http.post(`${this.baseUrl}/emails/${emailId}/read`, {}).toPromise();
  }

  // Mark as unread
  async markAsUnread(emailId: string): Promise<void> {
    await this.http.post(`${this.baseUrl}/emails/${emailId}/unread`, {}).toPromise();
  }
}
