const express = require('express');
const cors = require('cors');
const { Client } = require('@microsoft/microsoft-graph-client');
const { AuthenticationProvider } = require('@microsoft/microsoft-graph-client');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store user credentials (in production, use proper session management)
let userCredentials = null;

// Custom Authentication Provider
class CustomAuthProvider extends AuthenticationProvider {
  constructor(accessToken) {
    super();
    this.accessToken = accessToken;
  }

  async getAccessToken() {
    return this.accessToken;
  }
}

// Helper function to create Graph client
function createGraphClient(accessToken) {
  const authProvider = new CustomAuthProvider(accessToken);
  return Client.initWithMiddleware({ authProvider });
}

// API Routes

// Login endpoint (simplified for testing)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For now, just store credentials and return success
    // In production, you'd validate the credentials properly
    userCredentials = { email, password };
    
    res.json({ 
      success: true, 
      message: 'Login successful (OAuth2 mode)',
      user: { email },
      note: 'This is a simplified version. In production, you would use proper OAuth2 flow.'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: 'Login failed. Please check your email and password.',
      details: error.message
    });
  }
});

// Get all emails using Microsoft Graph API
app.get('/api/emails', async (req, res) => {
  try {
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    // Mock email data for testing
    const mockEmails = [
      {
        id: '1',
        from: 'john.doe@example.com',
        to: userCredentials.email,
        subject: 'Test Email 1',
        body: 'This is a test email body content.',
        date: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        from: 'jane.smith@company.com',
        to: userCredentials.email,
        subject: 'Meeting Tomorrow',
        body: 'Hi, just a reminder about our meeting tomorrow at 2 PM.',
        date: new Date(Date.now() - 86400000).toISOString(),
        read: true
      },
      {
        id: '3',
        from: 'noreply@outlook.com',
        to: userCredentials.email,
        subject: 'Your Microsoft Account Security',
        body: 'We noticed a new sign-in to your Microsoft account.',
        date: new Date(Date.now() - 172800000).toISOString(),
        read: false
      }
    ];

    res.json(mockEmails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Search emails by text
app.get('/api/emails/search', async (req, res) => {
  try {
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { text } = req.query;
    
    // Mock search results
    const mockEmails = [
      {
        id: '1',
        from: 'john.doe@example.com',
        to: userCredentials.email,
        subject: `Search result for: ${text}`,
        body: `This email contains the search term: ${text}`,
        date: new Date().toISOString(),
        read: false
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
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }
    
    // Mock email sending
    console.log(`Mock: Sending email to ${to} with subject: ${subject}`);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully (mock mode)',
      note: 'This is a mock response. In production, you would use Microsoft Graph API to send emails.'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Get email by ID
app.get('/api/emails/:id', async (req, res) => {
  try {
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { id } = req.params;
    
    // Mock email data
    const mockEmail = {
      id: id,
      from: 'sender@example.com',
      to: userCredentials.email,
      subject: 'Mock Email Details',
      body: 'This is the full email body content for testing purposes.',
      date: new Date().toISOString(),
      read: false
    };
    
    res.json(mockEmail);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OAuth2 Email Server running on http://localhost:${PORT}`);
  console.log('📧 Ready to handle Outlook email integration with OAuth2!');
  console.log('ℹ️  This is a mock version for testing. In production, use proper OAuth2 flow.');
});
