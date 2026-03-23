const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
})

const otpTemplate = (otp, subject, message) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden">
        <tr>
          <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6)">
            <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px">📝 Notewave</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;text-align:center">
            <h2 style="color:#f1f5f9;margin:0 0 12px">${subject}</h2>
            <p style="color:#94a3b8;margin:0 0 32px;font-size:15px">${message}</p>
            <div style="background:#0f172a;border-radius:12px;padding:24px;margin:0 auto;display:inline-block">
              <span style="font-size:42px;font-weight:700;letter-spacing:12px;color:#818cf8">${otp}</span>
            </div>
            <p style="color:#64748b;margin:24px 0 0;font-size:13px">Valid for 10 minutes only. Do not share this OTP.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;text-align:center;border-top:1px solid #334155">
            <p style="color:#475569;font-size:12px;margin:0">© 2025 Notewave. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

// Send email verification OTP
const sendVerificationOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Notewave" <${process.env.EMAIL}>`,
    to: email,
    subject: 'Verify your Notewave account',
    html: otpTemplate(otp, 'Verify Your Email', 'Enter this OTP to verify your email address and activate your account.')
  })
}

// Send 2FA OTP
const send2FAOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Notewave" <${process.env.EMAIL}>`,
    to: email,
    subject: 'Your Notewave login OTP',
    html: otpTemplate(otp, 'Two-Factor Authentication', 'Use this OTP to complete your login. If you did not request this, please secure your account.')
  })
}

// Send forgot password OTP
const sendForgotPasswordOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Notewave" <${process.env.EMAIL}>`,
    to: email,
    subject: 'Reset your Notewave password',
    html: otpTemplate(otp, 'Reset Password', 'Use this OTP to reset your password. This OTP expires in 10 minutes.')
  })
}

// Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// OTP expiry — 10 mins from now
const otpExpiry = () => new Date(Date.now() + 10 * 60 * 1000)

module.exports = {
  sendVerificationOTP,
  send2FAOTP,
  sendForgotPasswordOTP,
  generateOTP,
  otpExpiry
}
