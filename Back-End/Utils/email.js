const { google } = require("googleapis");
const dotenv = require("dotenv");
const mime = require("mime-types");

// Load environment variables
dotenv.config({ path: "./config.env" });

// OAuth2 setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// Helper to encode message + attachments
function makeRawMessage({ from, to, subject, htmlContent, attachments = [] }) {
  const boundary = "boundary-example-" + Date.now();

  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    htmlContent,
  ];

  // Add attachments kung meron
  for (const file of attachments) {
    const fileName = file.filename || "attachment";
    const fileType =
      file.contentType || mime.lookup(fileName) || "application/octet-stream";
    const fileContent = Buffer.isBuffer(file.content)
      ? file.content.toString("base64")
      : Buffer.from(file.content).toString("base64");

    messageParts.push(
      "",
      `--${boundary}`,
      `Content-Type: ${fileType}; name="${fileName}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${fileName}"`,
      "",
      fileContent
    );
  }

  messageParts.push("", `--${boundary}--`);

  return Buffer.from(messageParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Main send email function
const sendEmail = async ({ email, subject, text, attachments }) => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const from = `Government Archiving System <${
      process.env.SENDER_EMAIL || "appuse12300@gmail.com"
    }>`;
    
    // FIX: declare htmlContent properly
    const htmlContent = `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8fbfe;
                    color: #2d3748;
                }
                
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                    border: 1px solid #e2e8f0;
                }
                
                .header {
                    background: linear-gradient(135deg, #1d4e89, #0c3a6e);
                    padding: 30px 20px;
                    text-align: center;
                    position: relative;
                }
                
                .agency-name {
                    color: white;
                    font-size: 26px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    margin: 10px 0 5px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                
                .system-name {
                    color: rgba(255,255,255,0.9);
                    font-size: 18px;
                    margin: 5px 0 0;
                    font-weight: 400;
                }
                
                .archive-icon {
                    font-size: 42px;
                    display: inline-block;
                    margin-bottom: 10px;
                }
                
                .content {
                    padding: 35px;
                    background: white;
                    line-height: 1.6;
                }
                
                .greeting {
                    color: #1e293b;
                    font-size: 22px;
                    margin-top: 0;
                    margin-bottom: 25px;
                    font-weight: 500;
                }
                
                .message {
                    font-size: 16px;
                    margin-bottom: 30px;
                    color: #475569;
                    line-height: 1.7;
                }
                
                .info-card {
                    background: #f1f5f9;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 25px 0;
                    border-left: 4px solid #1d4e89;
                }
                
                .info-label {
                    font-weight: 600;
                    color: #1e40af;
                    display: block;
                    margin-bottom: 5px;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                
                .info-value {
                    font-size: 18px;
                    color: #1e293b;
                    font-weight: 500;
                }
                
                .action-container {
                    text-align: center;
                    margin: 35px 0 25px;
                }
                
                .action-btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #1d4e89, #0c3a6e);
                    color: white !important;
                    padding: 12px 32px;
                    border-radius: 4px;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }
                
                .action-btn:hover {
                    background: linear-gradient(135deg, #0c3a6e, #1d4e89);
                }
                
                .contact-info {
                    text-align: center;
                    margin-top: 30px;
                    color: #64748b;
                    font-size: 15px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }
                
                .footer {
                    background: #f1f5f9;
                    padding: 25px;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                    line-height: 1.6;
                }
                
                .auto-msg {
                    display: block;
                    margin-top: 8px;
                    font-size: 12px;
                }
                
                @media (max-width: 600px) {
                    .content {
                        padding: 25px 20px;
                    }
                    .greeting {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="archive-icon">🏛️</div>
                    <h1 class="agency-name">Government File Archives System</h1>
                    <p class="system-name">Document Archiving and Management System</p>
                </div>
                
                <div class="content">
                    <h2 class="greeting">Greetings,</h2>
                    <div class="message">
                        ${text}
                    </div>
                    
                    <div class="info-card">
                        <span class="info-label">Document Reference</span>
                        <span class="info-value">${subject}</span>
                    </div>
                    
                    <p class="message">
                        This is an automated notification regarding your document submission or request.
                        For inquiries, please contact our support during office hours.
                    </p>
                    
                    <div class="action-container">
                        <a href="https://bp-sangguniangpanlalawigan.com" class="action-btn">Access Archive Portal</a>
                    </div>
                    
                    <div class="contact-info">
                        📍 Biliran Province Philippines<br>
                    </div>
                </div>
                
                <div class="footer">
                    <span class="auto-msg">© ${new Date().getFullYear()} Government File Archiving Management System. All rights reserved.</span>
                </div>
            </div>
        </body>
        </html>
        `;

    const raw = makeRawMessage({
      from,
      to: email,
      subject,
      htmlContent,
      attachments: attachments || [],
    });

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    console.log(`✅ Email sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Error sending email via Gmail API:", error);
  }
};

module.exports = sendEmail;
