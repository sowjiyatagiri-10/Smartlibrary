const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { getPool, createNotification } = require('../db');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function generateEmailHTML(name, title, author, dueDate, status) {
  const isOverdue = status === 'overdue';
  const isDueToday = status === 'due_today';
  const statusColor = isOverdue ? '#E74C3C' : isDueToday ? '#E67E22' : '#F0A500';
  const statusText = isOverdue ? 'OVERDUE' : isDueToday ? 'Due Today' : 'Due Soon';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#0D1B2A,#1B4F8A);padding:30px 40px;text-align:center;">
          <h1 style="color:#F0A500;margin:0;font-size:24px;">📚 SRKR Smart Library</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Smart Library Management System</p>
        </div>
        <div style="text-align:center;padding:20px 40px 0;">
          <span style="display:inline-block;background:${statusColor};color:#fff;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:bold;">${statusText}</span>
        </div>
        <div style="padding:20px 40px 30px;">
          <p style="color:#333;font-size:16px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Your book <strong>"${title}"</strong> by <em>${author}</em> is due on <strong>${dueDate}</strong>.
          </p>
          ${isOverdue ? '<p style="color:#E74C3C;font-size:15px;font-weight:bold;">⚠️ This book is overdue. Please return it immediately to avoid penalties.</p>' : ''}
          ${isDueToday ? '<p style="color:#E67E22;font-size:15px;font-weight:bold;">⏰ This book is due today. Please return it before the end of the day.</p>' : ''}
        </div>
        <div style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
          <p style="color:#888;font-size:12px;margin:0;">SRKR Engineering College — Smart Library</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendReminders() {
  try {
    const pool = getPool();
    const [records] = await pool.query(`
      SELECT
        br.id, br.due_date, br.status, br.user_id,
        u.email, u.name,
        b.title, b.author
      FROM borrow_records br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      WHERE br.status IN ('borrowed', 'overdue')
      AND br.due_date <= DATE('now', '+3 days')
    `);

    if (records.length === 0) {
      console.log('📬 No reminders to send today.');
      return;
    }

    let transporter = null;
    try {
      transporter = createTransporter();
    } catch (e) {
      console.log('📧 Email not configured, creating in-app notifications only.');
    }

    for (const record of records) {
      const dueDate = new Date(record.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      const dueDateFormatted = dueDate.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      let subject = '';
      let emailStatus = '';
      let notifType = '';
      let notifTitle = '';
      let notifMessage = '';

      if (diffDays < 0) {
        subject = `⚠️ OVERDUE: Return "${record.title}" immediately`;
        emailStatus = 'overdue';
        notifType = 'overdue';
        notifTitle = '⚠️ Book Overdue';
        notifMessage = `"${record.title}" is overdue by ${Math.abs(diffDays)} day(s). Please return it immediately.`;
        await pool.query("UPDATE borrow_records SET status = 'overdue' WHERE id = ?", [record.id]);
      } else if (diffDays === 0) {
        subject = `📚 Due Today: "${record.title}"`;
        emailStatus = 'due_today';
        notifType = 'due_soon';
        notifTitle = '⏰ Due Today';
        notifMessage = `"${record.title}" is due today. Please return it before end of day.`;
      } else {
        subject = `📚 Reminder: "${record.title}" due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        emailStatus = 'due_soon';
        notifType = 'due_soon';
        notifTitle = '📚 Due Soon';
        notifMessage = `"${record.title}" is due in ${diffDays} day(s) on ${dueDateFormatted}.`;
      }

      // Create in-app notification
      await createNotification(record.user_id, notifType, notifTitle, notifMessage, record.id);

      // Send email if configured
      if (transporter) {
        const html = generateEmailHTML(record.name, record.title, record.author, dueDateFormatted, emailStatus);
        try {
          await transporter.sendMail({
            from: `"SRKR Smart Library" <${process.env.EMAIL_USER}>`,
            to: record.email,
            subject: subject,
            html: html
          });
          console.log(`📧 Reminder sent to ${record.email} for "${record.title}"`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${record.email}:`, emailError.message);
        }
      }
    }

    console.log(`✅ Processed ${records.length} reminder(s).`);

  } catch (error) {
    console.error('❌ Reminder job error:', error.message);
  }
}

function startReminderScheduler() {
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Running daily reminder job...');
    sendReminders();
  });
  console.log('📅 Reminder scheduler started (daily at 9:00 AM)');
}

async function sendTestReminder() {
  console.log('🧪 Running test reminder...');
  await sendReminders();
}

module.exports = { startReminderScheduler, sendTestReminder };
