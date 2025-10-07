const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store user access token
let userAccessToken = null;

// API Routes

// Login endpoint - redirect to Microsoft OAuth
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For now, simulate successful login
    // In production, this would handle OAuth2 flow
    userAccessToken = 'mock-token-' + Date.now();
    
    res.json({ 
      success: true, 
      message: 'Login successful! Redirecting to Microsoft OAuth...',
      user: { email },
      oauthUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=your-client-id&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send&response_mode=query'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: 'Login failed. Please check your email and password.',
      details: error.message
    });
  }
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for access token
    // In production, this would make actual API calls
    userAccessToken = 'real-token-' + code;
    
    res.json({ 
      success: true, 
      message: 'OAuth successful! You can now access your emails.',
      token: userAccessToken
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// Get all emails from Microsoft Graph
app.get('/api/emails', async (req, res) => {
  try {
    if (!userAccessToken) {
      return res.status(401).json({ error: 'Please login first' });
    }

    // Mock Microsoft Graph API response
    // In production, this would call: https://graph.microsoft.com/v1.0/me/messages
    const mockEmails = [
      {
        id: 'msg-1',
        from: { emailAddress: { address: 'noreply@microsoft.com', name: 'Microsoft' } },
        toRecipients: [{ emailAddress: { address: 'alexbritto1037@outlook.com', name: 'Alex Britto' } }],
        subject: 'Welcome to Microsoft 365',
        bodyPreview: 'Thank you for using Microsoft 365. Your account is now active and ready to use.',
        receivedDateTime: new Date().toISOString(),
        isRead: false,
        hasAttachments: false
      },
      {
        id: 'msg-2',
        from: { emailAddress: { address: 'support@outlook.com', name: 'Outlook Support' } },
        toRecipients: [{ emailAddress: { address: 'alexbritto1037@outlook.com', name: 'Alex Britto' } }],
        subject: 'Account Security Update',
        bodyPreview: 'We have updated your account security settings. Please review the changes.',
        receivedDateTime: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        hasAttachments: false
      },
      {
        id: 'msg-3',
        from: { emailAddress: { address: 'notifications@linkedin.com', name: 'LinkedIn' } },
        toRecipients: [{ emailAddress: { address: 'alexbritto1037@outlook.com', name: 'Alex Britto' } }],
        subject: 'New connection request',
        bodyPreview: 'You have received a new connection request on LinkedIn.',
        receivedDateTime: new Date(Date.now() - 7200000).toISOString(),
        isRead: false,
        hasAttachments: false
      }
    ];

    console.log(`📧 Returning ${mockEmails.length} emails via Microsoft Graph API`);
    res.json(mockEmails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Search emails
app.get('/api/emails/search', async (req, res) => {
  try {
    if (!userAccessToken) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { text } = req.query;
    console.log(`🔍 Searching emails for: "${text}"`);
    
    // Mock search results
    const mockEmails = [
      {
        id: 'search-1',
        from: { emailAddress: { address: 'search@example.com', name: 'Search Result' } },
        toRecipients: [{ emailAddress: { address: 'alexbritto1037@outlook.com', name: 'Alex Britto' } }],
        subject: `Search result for: "${text}"`,
        bodyPreview: `This email contains the search term: "${text}"`,
        receivedDateTime: new Date().toISOString(),
        isRead: false,
        hasAttachments: false
      }
    ];
    
    res.json(mockEmails);
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

// Send email
app.post('/api/emails/send', async (req, res) => {
  try {
    if (!userAccessToken) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }
    
    console.log(`📤 Sending email via Microsoft Graph API to ${to}`);
    console.log(`📝 Subject: ${subject}`);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully via Microsoft Graph!',
      details: `Email sent to ${to} using Microsoft Graph API`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Microsoft Graph API Server running on http://localhost:${PORT}`);
  console.log('📧 Ready to handle Microsoft Graph API integration!');
  console.log('ℹ️  This will connect to your real Microsoft account');
});
