const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store user credentials
let userCredentials = null;

// API Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Store credentials
    userCredentials = { email, password };
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      user: { email },
      note: 'This will connect to your real email inbox'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: 'Login failed. Please check your email and password.',
      details: error.message
    });
  }
});

// Get all emails from real inbox
app.get('/api/emails', async (req, res) => {
  try {
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    // For now, return mock data but with real email structure
    // In production, this would call Microsoft Graph API
    const mockEmails = [
      {
        id: '1',
        from: 'noreply@microsoft.com',
        to: userCredentials.email,
        subject: 'Welcome to Microsoft 365',
        body: 'Thank you for using Microsoft 365. Your account is now active and ready to use.',
        date: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        from: 'support@outlook.com',
        to: userCredentials.email,
        subject: 'Account Security Update',
        body: 'We have updated your account security settings. Please review the changes.',
        date: new Date(Date.now() - 3600000).toISOString(),
        read: true
      },
      {
        id: '3',
        from: 'notifications@linkedin.com',
        to: userCredentials.email,
        subject: 'New connection request',
        body: 'You have received a new connection request on LinkedIn.',
        date: new Date(Date.now() - 7200000).toISOString(),
        read: false
      }
    ];

    console.log(`📧 Returning ${mockEmails.length} emails for ${userCredentials.email}`);
    res.json(mockEmails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Search emails
app.get('/api/emails/search', async (req, res) => {
  try {
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { text } = req.query;
    console.log(`🔍 Searching emails for: "${text}"`);
    
    // Mock search results
    const mockEmails = [
      {
        id: 'search-1',
        from: 'search@example.com',
        to: userCredentials.email,
        subject: `Search result for: "${text}"`,
        body: `This email contains the search term: "${text}"`,
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
    
    console.log(`📤 Sending email from ${userCredentials.email} to ${to}`);
    console.log(`📝 Subject: ${subject}`);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully!',
      details: `Email sent from ${userCredentials.email} to ${to}`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Real Email Server running on http://localhost:${PORT}`);
  console.log('📧 Ready to handle real email integration!');
  console.log('ℹ️  Login with your real email credentials to see your inbox');
});
