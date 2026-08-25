const nodemailer = require("nodemailer");

const isSmtpConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

let transporter;

if (isSmtpConfigured) {
  const isGmail = process.env.SMTP_HOST.includes("gmail.com") || 
                  process.env.SMTP_HOST.includes("smtp.gmail.com");
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || (isGmail ? 587 : 587),
    secure: process.env.SMTP_SECURE === "true" || (isGmail ? false : false),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Gmail-specific settings
    ...(isGmail && {
      service: "gmail",
      tls: {
        rejectUnauthorized: false,
      },
    }),
  });
  
  // Test connection on startup (non-blocking)
  transporter.verify((error, success) => {
    if (error) {
      if (error.message.includes("Invalid login") || error.message.includes("BadCredentials")) {
        console.error("❌ Gmail SMTP Authentication Failed!");
        console.error("📧 For Gmail, you need to use an App Password, not your regular password.");
        console.error("   1. Enable 2-Step Verification on your Google account");
        console.error("   2. Go to: https://myaccount.google.com/apppasswords");
        console.error("   3. Generate an App Password for 'Mail'");
        console.error("   4. Use that App Password in SMTP_PASS environment variable");
        console.error("   5. Make sure SMTP_USER is your full Gmail address");
      } else {
        console.error("❌ SMTP connection failed:", error.message);
      }
    } else {
      console.log("✅ SMTP mailer configured and verified");
    }
  });
} else {
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  console.warn(
    "📭 SMTP credentials not found. Emails will be logged to console output instead."
  );
}

const defaultFrom =
  process.env.SMTP_FROM || 'Civic Connect <no-reply@civic-connect.local>';

async function sendMail({ to, subject, html, text }) {
  if (!to) {
    return;
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to];
  if (recipients.length === 0) return;

  const mailOptions = {
    from: defaultFrom,
    to: recipients.join(","),
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ""),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (!isSmtpConfigured) {
      console.info(
        "📨 Email (captured locally):",
        JSON.stringify({ ...mailOptions, transportMessageId: info.messageId }, null, 2)
      );
    } else {
      console.log(`✅ Email sent to ${recipients.join(", ")}`);
    }
    return info;
  } catch (error) {
    // Don't throw - just log the error so API calls don't fail
    const isGmailError = error.message.includes("Invalid login") || 
                         error.message.includes("BadCredentials") ||
                         error.message.includes("535-5.7.8");
    
    if (isGmailError) {
      console.error("❌ Email send failed (Gmail Auth Error):", error.message);
      console.error("💡 Tip: Use a Gmail App Password instead of your regular password.");
      console.error("   See: https://support.google.com/accounts/answer/185833");
    } else {
      console.error("❌ Email send failed:", error.message);
    }
    // Return null instead of throwing - allows API to continue
    return null;
  }
}

module.exports = {
  sendMail,
  isSmtpConfigured,
};

