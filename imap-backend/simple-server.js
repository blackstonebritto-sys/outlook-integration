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

    // Store credentials and return success
    userCredentials = { email, password };
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      user: { email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: 'Login failed. Please check your email and password.',
      details: error.message
    });
  }
});

// Get all emails
app.get('/api/emails', async (req, res) => {
  try {
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    // Mock email data
    const mockEmails = [
      {
        id: '1',
        from: 'john.doe@example.com',
        to: userCredentials.email,
        subject: 'Welcome to Outlook Integration!',
        body: 'This is a test email to demonstrate the Outlook integration functionality. You can view, search, and reply to emails using this interface.',
        date: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        from: 'jane.smith@company.com',
        to: userCredentials.email,
        subject: 'Meeting Tomorrow at 2 PM',
        body: 'Hi, just a reminder about our meeting tomorrow at 2 PM. Please bring the quarterly reports and budget analysis.',
        date: new Date(Date.now() - 86400000).toISOString(),
        read: true
      },
      {
        id: '3',
        from: 'noreply@outlook.com',
        to: userCredentials.email,
        subject: 'Your Microsoft Account Security Alert',
        body: 'We noticed a new sign-in to your Microsoft account from a new device. If this was you, no action is needed.',
        date: new Date(Date.now() - 172800000).toISOString(),
        read: false
      },
      {
        id: '4',
        from: 'support@blackstoneshipping.com',
        to: userCredentials.email,
        subject: 'System Maintenance Scheduled',
        body: 'We will be performing scheduled maintenance on our systems this weekend. Some services may be temporarily unavailable.',
        date: new Date(Date.now() - 259200000).toISOString(),
        read: true
      },
      {
        id: '5',
        from: 'newsletter@techcrunch.com',
        to: userCredentials.email,
        subject: 'Weekly Tech News Roundup',
        body: 'Check out the latest tech news and updates from this week. Featured: AI developments, startup funding, and industry trends.',
        date: new Date(Date.now() - 345600000).toISOString(),
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
        id: 'search-1',
        from: 'search@example.com',
        to: userCredentials.email,
        subject: `Search result for: "${text}"`,
        body: `This email contains the search term: "${text}". This is a mock search result to demonstrate the search functionality.`,
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

// Get emails by sender
app.get('/api/emails/sender', async (req, res) => {
  try {
    if (!userCredentials) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { from } = req.query;
    
    // Mock filtered results
    const mockEmails = [
      {
        id: 'sender-1',
        from: from,
        to: userCredentials.email,
        subject: `Email from ${from}`,
        body: `This is a mock email from ${from} to demonstrate sender filtering.`,
        date: new Date().toISOString(),
        read: false
      }
    ];
    
    res.json(mockEmails);
  } catch (error) {
    console.error('Error filtering by sender:', error);
    res.status(500).json({ error: 'Failed to filter emails' });
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
    console.log(`📧 Mock: Sending email to ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Body: ${body.substring(0, 100)}...`);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully!',
      details: 'This is a mock response. In production, this would send a real email.'
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
      body: 'This is the full email body content for testing purposes. In a real implementation, this would contain the actual email content from your mailbox.',
      date: new Date().toISOString(),
      read: false,
      attachments: []
    };
    
    res.json(mockEmail);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Outlook Integration Mock Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .status { color: #28a745; font-weight: bold; }
            .info { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Outlook Integration Mock Server</h1>
            <p class="status">✅ Server is running successfully!</p>
            <div class="info">
                <h3>📧 Available Endpoints:</h3>
                <ul>
                    <li><strong>POST /api/login</strong> - Login with email credentials</li>
                    <li><strong>GET /api/emails</strong> - Get all emails</li>
                    <li><strong>GET /api/emails/search?text=query</strong> - Search emails</li>
                    <li><strong>POST /api/emails/send</strong> - Send email</li>
                </ul>
            </div>
            <p>This is a mock server for testing the Outlook integration. All email data is simulated.</p>
        </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Email Server running on http://localhost:${PORT}`);
  console.log('📧 Ready to handle Outlook email integration!');
  console.log('ℹ️  This is a MOCK server for testing purposes.');
  console.log('✅ All endpoints are working with simulated data.');
});
