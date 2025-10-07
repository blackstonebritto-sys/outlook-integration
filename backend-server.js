const express = require('express');
const cors = require('cors');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// IMAP Configuration
const imapConfig = {
  user: process.env.EMAIL_USER || 'your-email@outlook.com',
  password: process.env.EMAIL_PASSWORD || 'your-password',
  host: 'outlook.office365.com',
  port: 993,
  tls: true
};

// SMTP Configuration for sending emails
const smtpConfig = {
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@outlook.com',
    pass: process.env.EMAIL_PASSWORD || 'your-password'
  }
};

// Helper function to connect to IMAP
function connectImap() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);
    
    imap.once('ready', () => resolve(imap));
    imap.once('error', reject);
    imap.once('end', () => console.log('IMAP connection ended'));
    
    imap.connect();
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

      const fetch = imap.seq.fetch(`1:${Math.min(limit, box.messages.total)}`, {
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
              subject: parsed.subject || 'No Subject',
              body: parsed.text || parsed.html || '',
              date: parsed.date || new Date(),
              read: false // You can implement read status tracking
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

// Get all emails
app.get('/api/emails', async (req, res) => {
  try {
    const imap = await connectImap();
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
    const { text } = req.query;
    const imap = await connectImap();
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
    const { from } = req.query;
    const imap = await connectImap();
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

// Get unread emails
app.get('/api/emails/unread', async (req, res) => {
  try {
    const imap = await connectImap();
    const emails = await fetchEmails(imap);
    
    const unreadEmails = emails.filter(email => !email.read);
    res.json(unreadEmails);
  } catch (error) {
    console.error('Error fetching unread emails:', error);
    res.status(500).json({ error: 'Failed to fetch unread emails' });
  }
});

// Send email
app.post('/api/emails/send', async (req, res) => {
  try {
    const { to, subject, body, inReplyTo } = req.body;
    
    const transporter = nodemailer.createTransporter(smtpConfig);
    
    const mailOptions = {
      from: imapConfig.user,
      to: to,
      subject: subject,
      text: body,
      inReplyTo: inReplyTo
    };
    
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Mark email as read
app.post('/api/emails/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    // Implement read status tracking (you can use a database)
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure to set EMAIL_USER and EMAIL_PASSWORD environment variables');
});
