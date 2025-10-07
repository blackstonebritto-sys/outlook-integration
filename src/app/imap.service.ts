import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  attachments?: any[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImapService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Login with email credentials
  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const response = await this.http.post<{ success: boolean; message: string; user: User }>(`${this.baseUrl}/login`, credentials).toPromise();
      
      if (response?.success) {
        this.currentUserSubject.next(response.user);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
      }
      
      return response || { success: false, message: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.error?.error || 'Login failed. Please check your credentials.' 
      };
    }
  }

  // Logout
  logout(): void {
    this.currentUserSubject.next(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('currentUser');
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Get all emails
  async getEmails(): Promise<EmailMessage[]> {
    try {
      console.log('🌐 Making API call to:', `${this.baseUrl}/emails`);
      const response = await this.http.get<EmailMessage[]>(`${this.baseUrl}/emails`).toPromise();
      console.log('📡 API Response received:', response);
      
      if (!response) {
        console.log('⚠️ API returned null/undefined response');
        return [];
      }
      
      if (!Array.isArray(response)) {
        console.log('⚠️ API response is not an array:', typeof response);
        return [];
      }
      
      console.log('✅ Returning emails array with', response.length, 'items');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching emails:', error);
      throw new Error(error.error?.error || 'Failed to fetch emails');
    }
  }

  // Get email by ID
  async getEmailById(id: string): Promise<EmailMessage> {
    try {
      const response = await this.http.get<EmailMessage>(`${this.baseUrl}/emails/${id}`).toPromise();
      if (!response) {
        throw new Error('Email not found');
      }
      return response;
    } catch (error: any) {
      console.error('Error fetching email:', error);
      throw new Error(error.error?.error || 'Failed to fetch email');
    }
  }

  // Search emails by text
  async searchEmails(searchText: string): Promise<EmailMessage[]> {
    try {
      const response = await this.http.get<EmailMessage[]>(`${this.baseUrl}/emails/search?text=${encodeURIComponent(searchText)}`).toPromise();
      return response || [];
    } catch (error: any) {
      console.error('Error searching emails:', error);
      throw new Error(error.error?.error || 'Failed to search emails');
    }
  }

  // Get emails by sender
  async getEmailsBySender(sender: string): Promise<EmailMessage[]> {
    try {
      const response = await this.http.get<EmailMessage[]>(`${this.baseUrl}/emails/sender?from=${encodeURIComponent(sender)}`).toPromise();
      return response || [];
    } catch (error: any) {
      console.error('Error filtering by sender:', error);
      throw new Error(error.error?.error || 'Failed to filter emails');
    }
  }

  // Send email
  async sendEmail(to: string, subject: string, body: string, inReplyTo?: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        to,
        subject,
        body,
        inReplyTo
      };
      
      const response = await this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/emails/send`, payload).toPromise();
      return response || { success: false, message: 'Failed to send email' };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { 
        success: false, 
        message: error.error?.error || 'Failed to send email' 
      };
    }
  }

  // Send reply
  async sendReply(to: string, subject: string, body: string, inReplyTo?: string): Promise<{ success: boolean; message: string }> {
    // Add "Re: " prefix if not already present
    const replySubject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;
    return this.sendEmail(to, replySubject, body, inReplyTo);
  }

  // Initialize service (check for stored user)
  initialize(): void {
    // Check if we're in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  }
}
