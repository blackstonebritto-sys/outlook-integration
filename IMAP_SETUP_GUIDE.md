# 📧 Outlook IMAP Integration Setup Guide

## 🎯 **What This Does:**
- ✅ **Login with your company email** (no special permissions needed)
- ✅ **View all your emails** from Outlook
- ✅ **Search emails** by text, sender, or subject
- ✅ **Send new emails** and **reply to existing ones**
- ✅ **Filter emails** by various criteria
- ✅ **Works with any Outlook account** (personal or work)

## 🚀 **Quick Setup (5 minutes):**

### **Step 1: Install Backend Dependencies**
```bash
# Navigate to the backend folder
cd imap-backend

# Install dependencies
npm install
```

### **Step 2: Start the Backend Server**
```bash
# Start the server
npm start

# You should see:
# 🚀 IMAP Email Server running on http://localhost:3000
# 📧 Ready to handle Outlook email integration!
```

### **Step 3: Update Angular App**
```bash
# In your Angular project root
ng serve

# Your app will run on http://localhost:4200
```

### **Step 4: Test the Integration**
1. **Open** http://localhost:4200
2. **Login** with your company email credentials
3. **View your emails** - they should load automatically
4. **Try searching** for specific emails
5. **Send a test email** or reply to an existing one

## 🔧 **Detailed Setup:**

### **Backend Server (Node.js)**
The backend server handles all IMAP communication:

**Files Created:**
- `imap-backend/server.js` - Main server file
- `imap-backend/package.json` - Dependencies

**Features:**
- IMAP connection to Outlook
- Email fetching and searching
- Email sending via SMTP
- REST API endpoints

### **Frontend (Angular)**
The Angular app provides the user interface:

**Files Created:**
- `src/app/imap.service.ts` - Service for API calls
- `src/app/login/login.component.ts` - Login interface
- `src/app/email-list/email-list.component.ts` - Email list view
- `src/app/email-compose/email-compose.component.ts` - Compose/reply interface
- `src/app/app.ts` - Main app component

## 📋 **API Endpoints:**

### **Authentication**
- `POST /api/login` - Login with email credentials
- `GET /api/emails` - Get all emails
- `GET /api/emails/search?text=query` - Search emails
- `GET /api/emails/sender?from=sender` - Filter by sender
- `POST /api/emails/send` - Send email
- `GET /api/emails/:id` - Get specific email

## 🎨 **Features:**

### **Email Viewing**
- ✅ **List all emails** with sender, subject, date
- ✅ **Search by text** in subject or body
- ✅ **Filter by sender**
- ✅ **Mark as read/unread**
- ✅ **Email preview** with truncated body

### **Email Composing**
- ✅ **Send new emails**
- ✅ **Reply to existing emails**
- ✅ **Rich text formatting**
- ✅ **Email validation**

### **User Experience**
- ✅ **Responsive design** works on mobile/desktop
- ✅ **Loading states** and error handling
- ✅ **Modern UI** with smooth animations
- ✅ **Real-time updates**

## 🔒 **Security Notes:**

### **Credentials Storage**
- **Backend:** Credentials stored in memory (session only)
- **Frontend:** User info stored in localStorage
- **No permanent storage** of passwords

### **IMAP/SMTP Settings**
- **IMAP Server:** outlook.office365.com:993 (SSL)
- **SMTP Server:** smtp-mail.outlook.com:587 (TLS)
- **Authentication:** Username/password

## 🚨 **Troubleshooting:**

### **Common Issues:**

#### **1. "Login failed" Error**
- ✅ Check email and password are correct
- ✅ Ensure IMAP is enabled in your Outlook settings
- ✅ Try with a different email account

#### **2. "Connection refused" Error**
- ✅ Make sure backend server is running on port 3000
- ✅ Check if port 3000 is available
- ✅ Restart the backend server

#### **3. "No emails found"**
- ✅ Check if your inbox has emails
- ✅ Try refreshing the page
- ✅ Check console for error messages

#### **4. "Failed to send email"**
- ✅ Verify SMTP settings are correct
- ✅ Check if your account allows sending emails
- ✅ Ensure recipient email is valid

### **Debug Steps:**
1. **Check backend logs** in terminal
2. **Check browser console** for errors
3. **Verify network requests** in DevTools
4. **Test with different email account**

## 🎯 **Next Steps:**

### **Production Deployment:**
1. **Deploy backend** to a cloud service (Heroku, AWS, etc.)
2. **Update API URLs** in Angular service
3. **Add proper error handling**
4. **Implement user sessions**

### **Additional Features:**
1. **Email attachments** support
2. **Email folders** navigation
3. **Email templates**
4. **Bulk operations**
5. **Email scheduling**

## 📞 **Support:**

If you encounter any issues:
1. **Check the console** for error messages
2. **Verify all dependencies** are installed
3. **Ensure both servers** are running
4. **Test with a simple email account** first

## 🎉 **Success!**

Once everything is working, you'll have:
- ✅ **Full Outlook email integration**
- ✅ **No special permissions needed**
- ✅ **Works with any email account**
- ✅ **Modern, responsive interface**
- ✅ **All basic email features**

**Enjoy your new Outlook integration!** 🚀📧
