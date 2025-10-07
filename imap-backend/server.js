const express = require('express');
const cors = require('cors');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store user credentials (in production, use proper session management)
let userCredentials = null;

// IMAP Configuration
function getImapConfig(credentials) {
  // Try different IMAP servers based on email domain
  let host = 'outlook.office365.com';
  let port = 993;
  
  if (credentials.email.includes('@outlook.com') || credentials.email.includes('@hotmail.com')) {
    host = 'outlook.office365.com';
    port = 993;
  } else if (credentials.email.includes('@gmail.com')) {
    host = 'imap.gmail.com';
    port = 993;
  }
  
  return {
    user: credentials.email,
    password: credentials.password,
    host: host,
    port: port,
    tls: true,
    tlsOptions: { 
      rejectUnauthorized: false,
      ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA'
    },
    connTimeout: 60000, // 60 seconds
    authTimeout: 30000, // 30 seconds
    keepalive: {
      interval: 10000,
      idleInterval: 300000,
      forceNoop: true
    },
    debug: console.log, // Enable debug logging
    // Try different authentication methods
    authTimeout: 30000,
    // Add additional options for Outlook
    xoauth2: false, // Disable OAuth2 for now
    // Try with different user format
    user: credentials.email,
    // Add connection retry
    retryDelay: 2000,
    maxRetries: 3
  };
}

// SMTP Configuration for sending emails
function getSmtpConfig(credentials) {
  return {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: credentials.email,
      pass: credentials.password
    }
  };
}

// Helper function to connect to IMAP
function connectImap(credentials) {
  return new Promise((resolve, reject) => {
    const config = getImapConfig(credentials);
    console.log('Attempting IMAP connection with config:', {
      host: config.host,
      port: config.port,
      user: config.user,
      tls: config.tls
    });
    
    const imap = new Imap(config);
    
    imap.once('ready', () => {
      console.log('IMAP connection successful!');
      resolve(imap);
    });
    
    imap.once('error', (err) => {
      console.error('IMAP connection error:', err);
      reject(new Error(`IMAP connection failed: ${err.message}`));
    });
    
    imap.once('end', () => console.log('IMAP connection ended'));
    
    imap.once('close', (hadError) => {
      if (hadError) {
        console.error('IMAP connection closed with error');
      } else {
        console.log('IMAP connection closed normally');
      }
    });
    
    try {
      imap.connect();
    } catch (err) {
      console.error('Failed to initiate IMAP connection:', err);
      reject(new Error(`Failed to connect to IMAP server: ${err.message}`));
    }
  });
}

// Helper function to fetch emails
async function fetchEmails(imap, boxName = 'INBOX', limit = 50) {
  return new Promise((resolve, reject) => {
    imap.openBox(boxName, true, (err, box) => {
      if (err) {
        reject(err);
        return;
      }

      const totalMessages = box.messages.total;
      const startSeq = Math.max(1, totalMessages - limit + 1);
      const endSeq = totalMessages;

      if (totalMessages === 0) {
        imap.end();
        resolve([]);
        return;
      }

      const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
        bodies: '',
        struct: true
      });

      const emails = [];

      fetch.on('message', (msg, seqno) => {
        let buffer = '';
        
        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('end', () => {
          simpleParser(buffer, (err, parsed) => {
            if (err) {
              console.error('Error parsing email:', err);
              return;
            }

            emails.push({
              id: seqno,
              from: parsed.from?.text || 'Unknown',
              to: parsed.to?.text || '',
              subject: parsed.subject || 'No Subject',
              body: parsed.text || parsed.html || '',
              date: parsed.date || new Date(),
              read: false,
              attachments: parsed.attachments || []
            });
          });
        });
      });

      fetch.once('error', reject);
      fetch.once('end', () => {
        imap.end();
        resolve(emails.reverse()); // Most recent first
      });
    });
  });
}

// API Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Test IMAP connection
    const credentials = { email, password };
    const imap = await connectImap(credentials);
    
    // Store credentials for this session
    userCredentials = credentials;
    
    res.json({ 
      success: true, 
      message: 'Login successful',
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

    const imap = await connectImap(userCredentials);
    const emails = await fetchEmails(imap);
    res.json(emails);
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
    const imap = await connectImap(userCredentials);
    const emails = await fetchEmails(imap);
    
    const filteredEmails = emails.filter(email => 
      email.subject.toLowerCase().includes(text.toLowerCase()) ||
      email.body.toLowerCase().includes(text.toLowerCase()) ||
      email.from.toLowerCase().includes(text.toLowerCase())
    );
    
    res.json(filteredEmails);
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
    const imap = await connectImap(userCredentials);
    const emails = await fetchEmails(imap);
    
    const filteredEmails = emails.filter(email => 
      email.from.toLowerCase().includes(from.toLowerCase())
    );
    
    res.json(filteredEmails);
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

    const { to, subject, body, inReplyTo } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }
    
    const transporter = nodemailer.createTransporter(getSmtpConfig(userCredentials));
    
    const mailOptions = {
      from: userCredentials.email,
      to: to,
      subject: subject,
      text: body,
      inReplyTo: inReplyTo
    };
    
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully' });
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
    const imap = await connectImap(userCredentials);
    const emails = await fetchEmails(imap);
    
    const email = emails.find(e => e.id == id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json(email);
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
  console.log(`🚀 IMAP Email Server running on http://localhost:${PORT}`);
  console.log('📧 Ready to handle Outlook email integration!');
});
