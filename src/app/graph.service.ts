import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { graph } from './auth.config';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class GraphService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);


  async getMe(): Promise<any> {
    // Test with the working /me endpoint first
    const token = await this.auth.acquireGraphToken();
    if (!token) {
      throw new Error('Failed to acquire access token');
    }
    
    console.log('Testing with /me endpoint...');
    const url = 'https://graph.microsoft.com/v1.0/me';
    
    return this.http.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).toPromise();
  }

  async checkTokenInfo(): Promise<void> {
    const token = await this.auth.acquireGraphToken();
    if (!token) {
      console.error('No token available');
      return;
    }

    console.log('=== TOKEN INFORMATION ===');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 100) + '...');
    
    try {
      const decoded = jwtDecode(token) as any;
      console.log('Token type: JWT (decodable)');
      console.log('Token expires at:', new Date(decoded.exp * 1000));
      console.log('Token issued at:', new Date(decoded.iat * 1000));
      console.log('Token scopes:', decoded.scp || decoded.scope);
      console.log('Audience:', decoded.aud);
      console.log('Issuer:', decoded.iss);
      console.log('Subject (User ID):', decoded.sub);
      console.log('App ID:', decoded.appid);
      console.log('Tenant ID:', decoded.tid);
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        console.error('❌ TOKEN IS EXPIRED!');
      } else {
        console.log('✅ Token is valid');
      }
      
      // Check required scopes
      const tokenScopes = (decoded.scp || decoded.scope || '').split(' ');
      const requiredScopes = ['User.Read', 'Mail.Read', 'Mail.Send'];
      const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
      
      console.log('🔍 Token scopes found:', tokenScopes);
      console.log('🔍 Required scopes:', requiredScopes);
      
      if (missingScopes.length > 0) {
        console.error('❌ Missing scopes:', missingScopes);
        console.error('❌ This is why mail endpoints are failing!');
      } else {
        console.log('✅ All required scopes present');
      }
      
      // Check specifically for Mail.Read
      if (tokenScopes.includes('Mail.Read')) {
        console.log('✅ Mail.Read scope is present - mail should work');
      } else {
        console.error('❌ Mail.Read scope is MISSING - this is the problem!');
        console.error('❌ Go to Azure Portal → API Permissions → Grant admin consent for Mail.Read');
      }

      // Determine account type
      this.determineAccountType(decoded);
      
    } catch (error) {
      console.log('Token type: Microsoft Graph Access Token (not JWT)');
      console.log('This is normal for Microsoft Graph tokens');
      console.log('Token appears to be valid (length:', token.length, 'characters)');
      console.log('Will test endpoints to determine account type');
    }
    
    console.log('========================');
  }

  private determineAccountType(decoded: any): void {
    console.log('=== ACCOUNT TYPE ANALYSIS ===');
    
    // Check issuer to determine account type
    const issuer = decoded.iss || '';
    const tenantId = decoded.tid || '';
    
    if (issuer.includes('consumers')) {
      console.log('🏠 PERSONAL MICROSOFT ACCOUNT DETECTED');
      console.log('✅ Use /me/mailFolders/Inbox/messages endpoint');
      console.log('⚠️  /me/messages may not work for personal accounts');
    } else if (issuer.includes('organizations') || issuer.includes('common')) {
      console.log('🏢 WORK/SCHOOL ACCOUNT DETECTED');
      console.log('✅ Both /me/messages and /me/mailFolders/Inbox/messages should work');
    } else {
      console.log('❓ UNKNOWN ACCOUNT TYPE');
      console.log('Issuer:', issuer);
    }
    
    // Check if it's a multi-tenant token
    if (tenantId === '9188040d-6c67-4c5b-b112-36a304b66dad') {
      console.log('🏠 Personal Microsoft Account (Consumer tenant)');
    } else if (tenantId === 'common' || tenantId === 'organizations') {
      console.log('🏢 Multi-tenant token (could be work/school or personal)');
    } else {
      console.log('🏢 Single-tenant token (work/school account)');
    }
    
    console.log('=============================');
  }

  async checkMailboxAccess(): Promise<boolean> {
    const token = await this.auth.acquireGraphToken();
    if (!token) {
      throw new Error('Failed to acquire access token');
    }

    try {
      // Try to access mail folders first
      const response = await this.http.get('https://graph.microsoft.com/v1.0/me/mailFolders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).toPromise();
      
      console.log('Mailbox access confirmed:', response);
      return true;
    } catch (error) {
      console.log('No mailbox access:', error);
      return false;
    }
  }

  async getInbox(top: number = 10): Promise<any> {
    // Ensure token is acquired before making the request
    const token = await this.auth.acquireGraphToken();
    if (!token) {
      throw new Error('Failed to acquire access token');
    }
    
    // Debug token format
    console.log('Raw token length:', token.length);
    console.log('Token parts count:', token.split('.').length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Try to decode the token, but don't fail if it's not a JWT
    let decoded: any = null;
    let isPersonalAccount = false;
    
    try {
      decoded = jwtDecode(token);
      console.log('Token decoded successfully:', decoded);
      isPersonalAccount = this.isPersonalAccount(decoded);
    } catch (decodeError) {
      console.log('Token is not a JWT (this is normal for Microsoft Graph tokens)');
      console.log('Using default endpoint selection for Microsoft Graph token');
      // For non-JWT tokens, we'll try both endpoints
      isPersonalAccount = false; // Default to work/school account behavior
    }
    
    let endpoints: string[];
    if (isPersonalAccount) {
      console.log('🏠 Using personal account endpoints');
      endpoints = [
        'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=' + top,
        'https://graph.microsoft.com/v1.0/me/mailFolders',
        'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox'
      ];
    } else {
      console.log('🏢 Using work/school account endpoints (or trying both)');
      endpoints = [
        'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=' + top, // This works for both
        'https://graph.microsoft.com/v1.0/me/messages?$top=' + top, // This works for work/school
        'https://graph.microsoft.com/v1.0/me/mailFolders',
        'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox'
      ];
    }
    
    for (const url of endpoints) {
      try {
        console.log('Trying endpoint:', url);
        const response = await this.http.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).toPromise();
        
        console.log('Success with endpoint:', url);
        return response;
      } catch (error) {
        console.log('Failed with endpoint:', url, error);
        continue;
      }
    }
    
    throw new Error('All mail endpoints failed. Your account may not have mailbox access.');
  }

  private isPersonalAccount(decoded: any): boolean {
    const issuer = decoded.iss || '';
    const tenantId = decoded.tid || '';
    
    // Check for personal account indicators
    return (
      issuer.includes('consumers') ||
      tenantId === '9188040d-6c67-4c5b-b112-36a304b66dad' ||
      (issuer.includes('common') && !issuer.includes('organizations'))
    );
  }

  async getSent(top: number = 10): Promise<any> {
    // Ensure token is acquired before making the request
    const token = await this.auth.acquireGraphToken();
    if (!token) {
      throw new Error('Failed to acquire access token');
    }
    
    console.log('Token acquired successfully for getSent:', jwtDecode(token));
    const url = 'https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$select=from,sender,subject,receivedDateTime,bodyPreview,webLink&$orderby=receivedDateTime desc&$top=' + top;
    
    console.log('Making request to:', url);
    console.log('With token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Manually attach token since interceptor might not be working
    return this.http.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).toPromise();
  }

  async sendMail(toEmail: string, subject: string, bodyHtml: string): Promise<void> {
    // Ensure token is acquired before making the request
    const token = await this.auth.acquireGraphToken();
    if (!token) {
      throw new Error('Failed to acquire access token');
    }
    
    console.log('Token acquired successfully for sendMail:', jwtDecode(token));
    const url = 'https://graph.microsoft.com/v1.0/me/sendMail';
    const payload = {
      message: {
        subject,
        body: { contentType: 'HTML', content: bodyHtml },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
      saveToSentItems: true,
    };
    
    console.log('Making POST request to:', url);
    console.log('With token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Manually attach token since interceptor might not be working
    await this.http.post(url, payload, { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      } 
    }).toPromise();
  }

  async testAllEndpoints(): Promise<void> {
    console.log('🧪 TESTING ALL MAIL ENDPOINTS');
    console.log('=============================');
    
    const token = await this.auth.acquireGraphToken();
    if (!token) {
      console.error('❌ No token available for testing');
      return;
    }

    const decoded = jwtDecode(token) as any;
    const isPersonalAccount = this.isPersonalAccount(decoded);
    
    console.log('Account type:', isPersonalAccount ? 'Personal' : 'Work/School');
    console.log('Token scopes:', decoded.scp || decoded.scope);
    console.log('');

    const testEndpoints = [
      { name: 'User Profile', url: 'https://graph.microsoft.com/v1.0/me' },
      { name: 'Mail Folders', url: 'https://graph.microsoft.com/v1.0/me/mailFolders' },
      { name: 'Inbox Folder', url: 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox' },
      { name: 'Messages (short)', url: 'https://graph.microsoft.com/v1.0/me/messages?$top=5' },
      { name: 'Inbox Messages', url: 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=5' },
      { name: 'Sent Items', url: 'https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=5' }
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing ${endpoint.name}...`);
        const response = await this.http.get(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).toPromise();
        
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        if (endpoint.name.includes('Messages') && response) {
          console.log(`   Found ${(response as any).value?.length || 0} messages`);
        }
      } catch (error: any) {
        console.log(`❌ ${endpoint.name}: FAILED`);
        console.log(`   Status: ${error.status || 'Unknown'}`);
        console.log(`   Error: ${error.message || error.error?.message || 'Unknown error'}`);
      }
      console.log('');
    }
    
    console.log('=============================');
    console.log('🏁 ENDPOINT TESTING COMPLETE');
  }
}


