# Email Setup Guide

This application uses Nodemailer to send emails for user registrations and issue status updates.

## Gmail Setup (Recommended for Development)

Gmail requires an **App Password** instead of your regular password for SMTP authentication.

### Steps:

1. **Enable 2-Step Verification** on your Google account:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "Civic Platform" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Update your `.env` file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM="Civic Connect <your-email@gmail.com>"
   ```

4. **Restart your backend server**

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM="Civic Connect <your-email@outlook.com>"
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="Civic Connect <noreply@yourdomain.com>"
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM="Civic Connect <noreply@yourdomain.com>"
```

## Testing

If SMTP credentials are not configured, emails will be logged to the console instead of being sent. This is useful for development.

## Troubleshooting

### "Invalid login" or "BadCredentials" Error

- **For Gmail**: Make sure you're using an App Password, not your regular password
- **For other providers**: Verify your username and password are correct
- Check that `SMTP_USER` contains your full email address

### Connection Timeout

- Check your firewall settings
- Verify the SMTP port (usually 587 for TLS, 465 for SSL)
- Try setting `SMTP_SECURE=true` for port 465

### Emails Not Sending

- Check the server logs for error messages
- Verify all environment variables are set correctly
- Test the SMTP connection using a tool like `telnet` or an email client

