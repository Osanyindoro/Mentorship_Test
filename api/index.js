const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Cloud Data Store for Vercel Serverless
const mentors = [
  {
    id: "MEN-101",
    name: "Dr. Samuel Osei",
    email: "samuel.osei@mcf-mentors.org",
    title: "Principal AI Scientist & Former Google Research Lead",
    organization: "DeepMind / CMU Africa Faculty",
    domain: "Software Engineering & AI",
    bio: "15+ years experience in Artificial Intelligence and NLP for African languages.",
    avatar: "/assets/mentor_samuel.jpg",
    rating: 4.9,
    totalSessions: 42,
    expertise: ["AI / Machine Learning", "PhD Advice", "Tech Career Roadmap"],
    schedule: [
      { id: 1, date: "2026-08-18", time: "10:00 AM", isBooked: false, bookedBy: null },
      { id: 2, date: "2026-08-18", time: "02:30 PM", isBooked: true, bookedBy: "Amina Kwame" }
    ]
  },
  {
    id: "MEN-102",
    name: "Nia Temilade",
    email: "nia.temilade@mcf-mentors.org",
    title: "VP of Product Management & Venture Partner",
    organization: "Paystack / Flutterwave Mentor Network",
    domain: "Fintech & Product",
    bio: "Product strategist who scaled payments infrastructure across 6 African countries.",
    avatar: "/assets/mentor_nia.jpg",
    rating: 5.0,
    totalSessions: 38,
    expertise: ["Product Strategy", "Fintech Leadership", "Interview Prep"],
    schedule: [
      { id: 3, date: "2026-08-19", time: "09:00 AM", isBooked: false, bookedBy: null }
    ]
  }
];

const sessions = [
  {
    id: "SES-8801",
    associateId: "MCF-2026-089",
    associateName: "Amina Kwame",
    mentorId: "MEN-101",
    mentorName: "Dr. Samuel Osei",
    mentorDomain: "Software Engineering & AI",
    date: "2026-08-18",
    time: "02:30 PM",
    duration: "1 Hour",
    objective: "Review PhD statement of purpose for AI programs.",
    consentToRecord: true,
    status: "Accepted",
    meetingLink: "https://meet.zoho.com/mcf-mentorship-ses-8801"
  }
];

// Health Check
app.get('/v1/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Mastercard Foundation x Jobberman Live API', timestamp: new Date().toISOString() });
});

// Root Index
app.get('/v1', (req, res) => {
  res.json({
    service: 'Jobberman x Mastercard Foundation Mentorship Live REST API',
    status: 'online',
    endpoints: [
      { name: 'Health Check', path: '/v1/health', method: 'GET' },
      { name: 'Mentors Catalog', path: '/v1/mentors', method: 'GET' },
      { name: 'Sessions History', path: '/v1/sessions', method: 'GET' },
      { name: 'User Login', path: '/v1/auth/login', method: 'POST' },
      { name: 'Forgot Password', path: '/v1/auth/forgot-password', method: 'POST' }
    ]
  });
});

// Auth Login
app.post('/v1/auth/login', (req, res) => {
  const { role, email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  res.json({
    token: `mcf_live_token_${Date.now()}`,
    user: {
      id: "MCF-2026-089",
      role: role || "associate",
      name: "Amina Kwame",
      email: cleanEmail || "amina.kwame@ashesi.edu.gh",
      institution: "Ashesi University / Carnegie Mellon Africa",
      organization: "Ashesi University / Carnegie Mellon Africa",
      title: "Mastercard Foundation Scholar & Tech Fellow",
      track: "Software Engineering & Data Science",
      bio: "Passionate about building AI tools for healthcare in Africa.",
      avatar: "/assets/assoc_amina.jpg"
    }
  });
});

// Auth Register (Candidate / Associate or Mentor)
app.post('/v1/auth/register', (req, res) => {
  const { role, name, email, institutionOrOrg, title, trackOrDomain, bio } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const selectedRole = role || 'associate';
  const newId = selectedRole === 'associate' ? `MCF-2026-REG-${Math.floor(100 + Math.random() * 900)}` : `MEN-REG-${Math.floor(100 + Math.random() * 900)}`;

  if (selectedRole === 'mentor') {
    mentors.unshift({
      id: newId,
      name: name || 'New Mentor',
      email: cleanEmail,
      title: title || 'Executive Mentor',
      organization: institutionOrOrg || 'Jobberman Partner Network',
      domain: trackOrDomain || 'Software Engineering & AI',
      bio: bio || 'Verified mentor empowering scholars.',
      avatar: '/assets/mentor_samuel.jpg',
      rating: 5.0,
      totalSessions: 0,
      expertise: ['Mentorship', 'Career Growth'],
      schedule: [
        { id: Date.now(), date: '2026-08-22', time: '10:00 AM', isBooked: false, bookedBy: null }
      ]
    });
  }

  res.status(201).json({
    token: `mcf_live_token_${Date.now()}`,
    user: {
      id: newId,
      role: selectedRole,
      name: name || 'New Registered User',
      email: cleanEmail,
      institution: institutionOrOrg || 'Mastercard Foundation Partner Network',
      organization: institutionOrOrg || 'Jobberman Partner Network',
      title: title || 'Mastercard Foundation Scholar / Mentor',
      track: trackOrDomain || 'Software Engineering & AI',
      bio: bio || '',
      avatar: selectedRole === 'associate' ? '/assets/assoc_amina.jpg' : '/assets/mentor_samuel.jpg'
    }
  });
});

// Forgot Password
app.post('/v1/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const token = Math.random().toString(36).substring(2);
  const resetLink = `https://mentorship-jobberman.vercel.app/reset-password?token=${token}`;

  res.json({
    message: "If your email is registered, a password reset link has been dispatched.",
    resetLinkDemo: resetLink
  });
});

// Get Mentors
app.get('/v1/mentors', (req, res) => {
  res.json(mentors);
});

// Get Sessions
app.get('/v1/sessions', (req, res) => {
  res.json(sessions);
});

// Create Booking
app.post('/v1/sessions', (req, res) => {
  const { associateId, associateName, mentorId, date, time, objective, consentToRecord } = req.body;
  const mentor = mentors.find(m => m.id === mentorId) || mentors[0];
  const sessionId = `SES-${Math.floor(1000 + Math.random() * 9000)}`;

  const newSession = {
    id: sessionId,
    associateId: associateId || "MCF-2026-089",
    associateName: associateName || "Amina Kwame",
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorDomain: mentor.domain,
    date,
    time,
    duration: "1 Hour",
    objective: objective || "1-Hour Strategic Session",
    consentToRecord: Boolean(consentToRecord),
    status: "Pending",
    meetingLink: null
  };

  sessions.unshift(newSession);
  res.status(201).json({ message: "Session booked! Slot locked.", sessionId, status: "Pending" });
});

module.exports = app;
