const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mcf_jobberman_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API Log] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// -------------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------------

// POST /v1/auth/login
app.post('/v1/auth/login', (req, res) => {
  const { role, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  db.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database query error.' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        institution: user.institution_or_org,
        organization: user.institution_or_org,
        title: user.title,
        track: user.track_or_domain,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  });
});

// POST /v1/auth/forgot-password
app.post('/v1/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const cleanEmail = email.trim().toLowerCase();

  db.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail], (err, user) => {
    if (err || !user) {
      // Return success to avoid email enumeration attack
      return res.json({ message: 'If your email is registered, a password reset link has been dispatched.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    db.run('INSERT OR REPLACE INTO password_resets (token, email, expires_at) VALUES (?, ?, ?)', [token, cleanEmail, expiresAt], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to generate reset token.' });

      const resetLink = `https://mentorship-jobberman.vercel.app/reset-password?token=${token}`;
      console.log(`[Email Service Mock] Password reset link sent to ${cleanEmail}: ${resetLink}`);

      res.json({
        message: 'If your email is registered, a password reset link has been dispatched.',
        resetLinkDemo: resetLink
      });
    });
  });
});

// POST /v1/auth/reset-password
app.post('/v1/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' });

  db.get('SELECT * FROM password_resets WHERE token = ?', [token], (err, resetRecord) => {
    if (err || !resetRecord) return res.status(400).json({ error: 'Invalid or expired password reset token.' });

    if (Date.now() > resetRecord.expires_at) {
      db.run('DELETE FROM password_resets WHERE token = ?', [token]);
      return res.status(400).json({ error: 'Password reset token has expired. Please request a new one.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    db.run('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?', [newHash, resetRecord.email], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update password.' });

      // Invalidate token
      db.run('DELETE FROM password_resets WHERE token = ?', [token]);
      res.json({ message: 'Password updated successfully! You can now log in.' });
    });
  });
});

// -------------------------------------------------------------------
// 2. MENTORS & CATALOG ENDPOINTS
// -------------------------------------------------------------------

// GET /v1/mentors
app.get('/v1/mentors', (req, res) => {
  db.all('SELECT * FROM mentors', [], (err, mentors) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch mentors.' });

    db.all('SELECT * FROM schedule_slots', [], (err, slots) => {
      const formattedMentors = mentors.map(m => {
        const mentorSlots = slots
          .filter(s => s.mentor_id === m.id)
          .map(s => ({
            id: s.id,
            date: s.date,
            time: s.time,
            isBooked: Boolean(s.is_booked),
            bookedBy: s.booked_by_associate_id
          }));

        return {
          id: m.id,
          name: m.name,
          email: m.email,
          title: m.title,
          organization: m.organization,
          domain: m.domain,
          bio: m.bio,
          avatar: m.avatar,
          rating: m.rating,
          totalSessions: m.total_sessions,
          expertise: JSON.parse(m.expertise_json || '[]'),
          schedule: mentorSlots
        };
      });

      res.json(formattedMentors);
    });
  });
});

// -------------------------------------------------------------------
// 3. SESSIONS & BOOKING ENDPOINTS
// -------------------------------------------------------------------

// GET /v1/sessions
app.get('/v1/sessions', (req, res) => {
  db.all('SELECT * FROM sessions ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch sessions.' });

    const formattedSessions = rows.map(r => ({
      id: r.id,
      associateId: r.associate_id,
      associateName: r.associate_name,
      mentorId: r.mentor_id,
      mentorName: r.mentor_name,
      mentorDomain: r.mentor_domain,
      date: r.date,
      time: r.time,
      duration: r.duration,
      objective: r.objective,
      consentToRecord: Boolean(r.consent_to_record),
      status: r.status,
      meetingLink: r.meeting_link,
      createdAt: r.created_at,
      associateRating: r.associate_rating_json ? JSON.parse(r.associate_rating_json) : null,
      mentorRating: r.mentor_rating_json ? JSON.parse(r.mentor_rating_json) : null
    }));

    res.json(formattedSessions);
  });
});

// POST /v1/sessions (Create 1-Hour Booking & Lock Slot)
app.post('/v1/sessions', (req, res) => {
  const { associateId, associateName, mentorId, date, time, objective, consentToRecord } = req.body;

  if (!associateId || !mentorId || !date || !time) {
    return res.status(400).json({ error: 'Missing required booking details.' });
  }

  db.get('SELECT * FROM mentors WHERE id = ?', [mentorId], (err, mentor) => {
    if (err || !mentor) return res.status(404).json({ error: 'Mentor not found.' });

    const sessionId = `SES-${Math.floor(1000 + Math.random() * 9000)}`;

    db.run(`
      INSERT INTO sessions (id, associate_id, associate_name, mentor_id, mentor_name, mentor_domain, date, time, duration, objective, consent_to_record, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1 Hour', ?, ?, 'Pending')
    `, [sessionId, associateId, associateName || 'Associate Scholar', mentor.id, mentor.name, mentor.domain, date, time, objective || '1-Hour Strategic Mentorship', consentToRecord ? 1 : 0], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save session booking.' });

      // Lock Slot
      db.run('UPDATE schedule_slots SET is_booked = 1, booked_by_associate_id = ? WHERE mentor_id = ? AND date = ? AND time = ?', [associateId, mentorId, date, time]);

      res.status(201).json({
        message: '1-Hour Session booked successfully! Slot locked.',
        sessionId,
        status: 'Pending'
      });
    });
  });
});

// POST /v1/sessions/:id/accept (Mentor Confirmation & Auto Zoho Link Generation)
app.post('/v1/sessions/:id/accept', (req, res) => {
  const sessionId = req.params.id;
  const meetingLink = `https://meet.zoho.com/mcf-mentorship-${sessionId.toLowerCase()}`;

  db.run('UPDATE sessions SET status = "Accepted", meeting_link = ? WHERE id = ?', [meetingLink, sessionId], function(err) {
    if (err || this.changes === 0) return res.status(404).json({ error: 'Session not found.' });

    res.json({
      message: 'Session accepted!',
      sessionId,
      status: 'Accepted',
      meetingLink
    });
  });
});

// Health check endpoint
app.get('/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'MCF Mentorship API' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[MCF Mentorship Backend] REST API Server running on port ${PORT}`);
  console.log(`[MCF Mentorship Backend] Base URL: http://localhost:${PORT}/v1`);
});
