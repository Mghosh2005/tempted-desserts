// utils/email.js — Nodemailer email service
const nodemailer = require('nodemailer');

// Create transporter using Gmail
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your normal password)
    },
  });
}

// ── EMAIL TO OWNER: New order received ──
async function sendOwnerNotification(order) {
  const transporter = createTransporter();

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0;padding:0;background:#f5ede0;font-family:'Georgia',serif;">
    <div style="max-width:580px;margin:0 auto;background:#fff;">

      <!-- Header -->
      <div style="background:#3b2a1a;padding:2rem;text-align:center;">
        <h1 style="color:#c9a84c;font-size:2rem;font-weight:300;letter-spacing:.2em;margin:0;">
          Tempted
        </h1>
        <p style="color:rgba(232,213,163,.6);font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;margin:.4rem 0 0;">
          Desserts
        </p>
      </div>

      <!-- Alert bar -->
      <div style="background:#c9a84c;padding:.8rem;text-align:center;">
        <p style="margin:0;color:#3b2a1a;font-size:.85rem;letter-spacing:.15em;text-transform:uppercase;font-weight:600;">
          🎂 New Order Received!
        </p>
      </div>

      <!-- Body -->
      <div style="padding:2rem 2.5rem;">
        <p style="color:#7a6350;font-size:.9rem;line-height:1.8;margin-bottom:1.5rem;">
          You have a new order on <strong style="color:#3b2a1a;">Tempted Desserts</strong>. Here are the details:
        </p>

        <!-- Order details table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
          <tr style="border-bottom:1px solid #e2d5c3;">
            <td style="padding:.75rem 0;color:#a07830;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;width:35%;">Customer</td>
            <td style="padding:.75rem 0;color:#2c1f12;font-size:.95rem;font-weight:600;">${order.customer_name}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2d5c3;">
            <td style="padding:.75rem 0;color:#a07830;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;">Phone</td>
            <td style="padding:.75rem 0;color:#2c1f12;font-size:.95rem;">
              <a href="tel:${order.phone}" style="color:#c9a84c;text-decoration:none;">${order.phone}</a>
            </td>
          </tr>
          ${order.email ? `
          <tr style="border-bottom:1px solid #e2d5c3;">
            <td style="padding:.75rem 0;color:#a07830;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;">Email</td>
            <td style="padding:.75rem 0;color:#2c1f12;font-size:.95rem;">
              <a href="mailto:${order.email}" style="color:#c9a84c;text-decoration:none;">${order.email}</a>
            </td>
          </tr>` : ''}
          <tr style="border-bottom:1px solid #e2d5c3;">
            <td style="padding:.75rem 0;color:#a07830;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;">Order</td>
            <td style="padding:.75rem 0;color:#2c1f12;font-size:1.1rem;font-weight:700;">${order.item_name}</td>
          </tr>
          ${order.notes ? `
          <tr style="border-bottom:1px solid #e2d5c3;">
            <td style="padding:.75rem 0;color:#a07830;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;">Notes</td>
            <td style="padding:.75rem 0;color:#2c1f12;font-size:.9rem;">${order.notes}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:.75rem 0;color:#a07830;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;">Time</td>
            <td style="padding:.75rem 0;color:#7a6350;font-size:.85rem;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
          </tr>
        </table>

        <!-- WhatsApp quick reply button -->
        <div style="text-align:center;margin:1.5rem 0;">
          <a href="https://wa.me/91${order.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${order.customer_name}! 🎂 Thank you for your order of *${order.item_name}* at Tempted Desserts. We've received your order and will confirm the details shortly!`)}"
            style="display:inline-block;background:#25D366;color:#fff;padding:.85rem 2rem;text-decoration:none;font-size:.8rem;letter-spacing:.15em;text-transform:uppercase;font-family:sans-serif;">
            💬 Reply on WhatsApp
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background:#faf6f0;padding:1.2rem;text-align:center;border-top:1px solid #e2d5c3;">
        <p style="margin:0;color:#a09080;font-size:.72rem;letter-spacing:.1em;">
          Tempted Desserts · ghoshmohona8@gmail.com · +91 75858 20244
        </p>
      </div>

    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from:    `"Tempted Desserts" <${process.env.GMAIL_USER}>`,
    to:      process.env.OWNER_EMAIL,
    subject: `🎂 New Order: ${order.item_name} — ${order.customer_name}`,
    html,
  });

  console.log(`📧 Owner notification sent for order by ${order.customer_name}`);
}

// ── EMAIL TO CUSTOMER: Order confirmation ──
async function sendCustomerConfirmation(order) {
  if (!order.email) return; // Only send if customer provided email

  const transporter = createTransporter();

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0;padding:0;background:#f5ede0;font-family:'Georgia',serif;">
    <div style="max-width:580px;margin:0 auto;background:#fff;">

      <!-- Header -->
      <div style="background:#3b2a1a;padding:2rem;text-align:center;">
        <h1 style="color:#c9a84c;font-size:2rem;font-weight:300;letter-spacing:.2em;margin:0;">
          Tempted
        </h1>
        <p style="color:rgba(232,213,163,.6);font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;margin:.4rem 0 0;">
          Desserts
        </p>
      </div>

      <!-- Alert bar -->
      <div style="background:#c9a84c;padding:.8rem;text-align:center;">
        <p style="margin:0;color:#3b2a1a;font-size:.85rem;letter-spacing:.15em;text-transform:uppercase;font-weight:600;">
          ✨ Order Received — Thank You!
        </p>
      </div>

      <!-- Body -->
      <div style="padding:2rem 2.5rem;">

        <p style="color:#2c1f12;font-size:1.1rem;line-height:1.8;margin-bottom:.5rem;">
          Dear <strong>${order.customer_name}</strong>,
        </p>
        <p style="color:#7a6350;font-size:.9rem;line-height:1.9;margin-bottom:1.5rem;">
          Thank you for your order! We've received it and will reach out shortly on WhatsApp or phone to confirm everything. We're so excited to bake for you! 🎂
        </p>

        <!-- Order Summary Box -->
        <div style="background:#faf6f0;border:1px solid #e2d5c3;padding:1.5rem;margin-bottom:1.5rem;">
          <p style="margin:0 0 1rem;color:#a07830;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;">Order Summary</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #e2d5c3;">
              <td style="padding:.6rem 0;color:#7a6350;font-size:.82rem;">Item Ordered</td>
              <td style="padding:.6rem 0;color:#2c1f12;font-size:.95rem;font-weight:600;text-align:right;">${order.item_name}</td>
            </tr>
            ${order.notes ? `
            <tr style="border-bottom:1px solid #e2d5c3;">
              <td style="padding:.6rem 0;color:#7a6350;font-size:.82rem;">Special Notes</td>
              <td style="padding:.6rem 0;color:#2c1f12;font-size:.85rem;text-align:right;">${order.notes}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:.6rem 0;color:#7a6350;font-size:.82rem;">Status</td>
              <td style="padding:.6rem 0;text-align:right;">
                <span style="background:#c9a84c;color:#3b2a1a;padding:.2rem .8rem;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;">Received</span>
              </td>
            </tr>
          </table>
        </div>

        <p style="color:#7a6350;font-size:.88rem;line-height:1.9;">
          We'll confirm your order and discuss details via <strong style="color:#3b2a1a;">WhatsApp (+91 75858 20244)</strong> or phone soon. If you have any questions, feel free to reach out!
        </p>

        <!-- Contact -->
        <div style="margin:1.5rem 0;display:flex;gap:1rem;">
          <a href="https://wa.me/917585820244"
            style="display:inline-block;background:#25D366;color:#fff;padding:.7rem 1.5rem;text-decoration:none;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;font-family:sans-serif;margin-right:.8rem;">
            💬 WhatsApp Us
          </a>
          <a href="mailto:ghoshmohona8@gmail.com"
            style="display:inline-block;background:#3b2a1a;color:#e8d5a3;padding:.7rem 1.5rem;text-decoration:none;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;font-family:sans-serif;">
            ✉️ Email Us
          </a>
        </div>

      </div>

      <!-- Divider quote -->
      <div style="background:#faf6f0;border-top:1px solid #e2d5c3;border-bottom:1px solid #e2d5c3;padding:1.2rem 2.5rem;text-align:center;">
        <p style="margin:0;color:#a07830;font-style:italic;font-size:1rem;">
          "Every bite tells a story of care and love."
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#3b2a1a;padding:1.2rem;text-align:center;">
        <p style="margin:0;color:rgba(232,213,163,.5);font-size:.7rem;letter-spacing:.1em;">
          © 2025 Tempted Desserts · Made with ♡
        </p>
      </div>

    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from:    `"Tempted Desserts" <${process.env.GMAIL_USER}>`,
    to:      order.email,
    subject: `✨ Your order at Tempted Desserts is confirmed!`,
    html,
  });

  console.log(`📧 Customer confirmation sent to ${order.email}`);
}

// ── EMAIL TO CUSTOMER: Status update ──
async function sendStatusUpdate(order) {
  if (!order.email) return;

  const transporter = createTransporter();

  const statusMessages = {
    confirmed:  { emoji: '✅', text: 'Your order has been confirmed! We\'re getting ready to bake.' },
    preparing:  { emoji: '👩‍🍳', text: 'We\'re currently baking your order. It\'s going to be delicious!' },
    ready:      { emoji: '🎉', text: 'Your order is ready! Please arrange pickup or we\'ll be in touch for delivery.' },
    delivered:  { emoji: '🎂', text: 'Your order has been delivered. We hope you love every bite!' },
    cancelled:  { emoji: '❌', text: 'Your order has been cancelled. Please contact us if you have any questions.' },
  };

  const info = statusMessages[order.status];
  if (!info) return;

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f5ede0;font-family:'Georgia',serif;">
    <div style="max-width:580px;margin:0 auto;background:#fff;">
      <div style="background:#3b2a1a;padding:1.5rem;text-align:center;">
        <h1 style="color:#c9a84c;font-size:1.8rem;font-weight:300;letter-spacing:.2em;margin:0;">Tempted</h1>
        <p style="color:rgba(232,213,163,.6);font-size:.7rem;letter-spacing:.25em;text-transform:uppercase;margin:.3rem 0 0;">Desserts</p>
      </div>
      <div style="background:#c9a84c;padding:.7rem;text-align:center;">
        <p style="margin:0;color:#3b2a1a;font-size:.82rem;letter-spacing:.15em;text-transform:uppercase;font-weight:600;">
          ${info.emoji} Order Update
        </p>
      </div>
      <div style="padding:2rem 2.5rem;">
        <p style="color:#2c1f12;font-size:1rem;">Dear <strong>${order.customer_name}</strong>,</p>
        <p style="color:#7a6350;font-size:.92rem;line-height:1.9;">${info.text}</p>
        <div style="background:#faf6f0;border:1px solid #e2d5c3;padding:1rem 1.5rem;margin:1.5rem 0;">
          <p style="margin:0;color:#7a6350;font-size:.8rem;">Your order: <strong style="color:#2c1f12;">${order.item_name}</strong></p>
          <p style="margin:.4rem 0 0;color:#7a6350;font-size:.8rem;">Status: <strong style="color:#c9a84c;text-transform:uppercase;letter-spacing:.1em;">${order.status}</strong></p>
        </div>
        <p style="color:#7a6350;font-size:.85rem;">Questions? WhatsApp us at <a href="https://wa.me/917585820244" style="color:#c9a84c;">+91 75858 20244</a></p>
      </div>
      <div style="background:#3b2a1a;padding:1rem;text-align:center;">
        <p style="margin:0;color:rgba(232,213,163,.4);font-size:.68rem;">© 2025 Tempted Desserts · Made with ♡</p>
      </div>
    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from:    `"Tempted Desserts" <${process.env.GMAIL_USER}>`,
    to:      order.email,
    subject: `${info.emoji} Order Update — ${order.item_name}`,
    html,
  });

  console.log(`📧 Status update sent to ${order.email}: ${order.status}`);
}

module.exports = { sendOwnerNotification, sendCustomerConfirmation, sendStatusUpdate };
