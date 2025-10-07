import { BrowserCacheLocation, LogLevel, PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';

// TODO: Replace placeholders with your actual Azure AD app registration values
export const azureAd = {
  clientId: '3634d0ce-e19d-4cfe-8968-ec174e032577',
  redirectUri: 'http://localhost:4200',
  authority: "https://login.microsoftonline.com/organizations", // Allows any organizational account (work/school accounts only)
};

export const graph = {
  endpoint: 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages',
  scopes: ['User.Read', 'Mail.Read', 'Mail.Send'],
};

export function createMsalInstance(): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: azureAd.clientId,
      authority: azureAd.authority,
      redirectUri: azureAd.redirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: true, // Better for personal accounts
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: LogLevel, message: string) => {
          if (level >= LogLevel.Error) {
            console.error(message);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });
}

export function createMsalInterceptorConfig(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map<string, Array<string>>([
      ['https://graph.microsoft.com/v1.0/', ['User.Read', 'Mail.Read', 'Mail.Send']],
      ['https://graph.microsoft.com', ['User.Read', 'Mail.Read', 'Mail.Send']],
    ]),
  } as MsalInterceptorConfiguration;
}

export function createMsalGuardConfig(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: graph.scopes,
      prompt: 'consent', // Force consent screen to appear
    },
  };
}

export function initializeMsal(instance: PublicClientApplication) {
  return () => instance.initialize();
}


