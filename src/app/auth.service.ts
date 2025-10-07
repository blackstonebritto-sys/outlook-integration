import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult, InteractionRequiredAuthError, IPublicClientApplication } from '@azure/msal-browser';
import { graph, azureAd } from './auth.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);

  get instance(): IPublicClientApplication {
    return this.msal.instance;
  }

  loginRedirect(): void {
    const active = this.msal.instance.getActiveAccount();
    const accounts = this.msal.instance.getAllAccounts();
    if (!active && accounts.length > 0) {
      this.msal.instance.setActiveAccount(accounts[0]);
      return;
    }
    if (!active) {
      this.msal.loginRedirect({ 
        scopes: graph.scopes,
        prompt: 'consent' // Force consent screen to appear
      });
    }
  }

  logoutRedirect(): void {
    this.msal.logoutRedirect();
  }

  clearCacheAndLogin(): void {
    // Clear all cached tokens and force fresh login
    this.msal.instance.clearCache();
    this.loginRedirect();
  }

  async forceFreshLogin(): Promise<void> {
    // Logout first to clear all tokens
    await this.msal.logoutRedirect();
    
    // Wait a moment then login with consent
    setTimeout(() => {
      this.msal.loginRedirect({ 
        scopes: graph.scopes,
        prompt: 'consent' // Force consent screen
      });
    }, 1000);
  }

  async acquireGraphToken(): Promise<string | null> {
    const instance = this.msal.instance;
    let account = instance.getActiveAccount();
    if (!account) {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
        account = accounts[0];
      } else {
        // No account, start interactive login
        this.loginRedirect();
        return null;
      }
    }
    
    console.log('Account found:', account?.username);
    console.log('Requesting scopes:', graph.scopes);
    
    try {
      // Try to get a fresh token with specific scopes
      const result = await instance.acquireTokenSilent({ 
        scopes: graph.scopes, 
        account,
        forceRefresh: true
      });
      
      console.log('Token acquisition successful');
      console.log('Token length:', result.accessToken.length);
      console.log('Token scopes:', result.scopes);
      
      (this as any).lastToken = result.accessToken;
      return result.accessToken;
    } catch (error) {
      console.error('Token acquisition failed:', error);
      if (error instanceof InteractionRequiredAuthError) {
        console.log('Interaction required, redirecting to login');
        this.loginRedirect();
        return null;
      }
      throw error; // Re-throw other errors so they can be handled by the caller
    }
  }

  decodeJwt(token: string | null): any | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload;
    } catch {
      return null;
    }
  }

  async handleRedirect(): Promise<void> {
    const result = await this.msal.instance.handleRedirectPromise();
    if (result?.account) {
      this.msal.instance.setActiveAccount(result.account);
    } else {
      const accounts = this.msal.instance.getAllAccounts();
      if (accounts.length > 0 && !this.msal.instance.getActiveAccount()) {
        this.msal.instance.setActiveAccount(accounts[0]);
      }
    }
  }
}


