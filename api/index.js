import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.get(['/v1/health', '/api/health', '/health'], (req, res) => {
  res.json({ status: 'healthy', service: 'Mastercard Foundation x Jobberman Live API', timestamp: new Date().toISOString() });
});

// Auth Login
app.post(['/v1/auth/login', '/api/auth/login', '/auth/login'], (req, res) => {
  const { role, email } = req.body || {};
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

// Auth Register
app.post(['/v1/auth/register', '/api/auth/register', '/auth/register'], (req, res) => {
  const { role, name, email, institutionOrOrg, title, trackOrDomain, bio, avatar } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const selectedRole = role || 'associate';
  const newId = selectedRole === 'associate' ? `MCF-2026-REG-${Math.floor(100 + Math.random() * 900)}` : `MEN-REG-${Math.floor(100 + Math.random() * 900)}`;

  const userObj = {
    id: newId,
    role: selectedRole,
    name: name || "New Member",
    email: cleanEmail,
    institution: institutionOrOrg || (selectedRole === 'associate' ? 'Mastercard Foundation Partner' : 'Jobberman Partner Network'),
    organization: institutionOrOrg || 'Jobberman Partner Network',
    title: title || (selectedRole === 'associate' ? 'Mastercard Foundation Scholar' : 'Executive Mentor'),
    track: trackOrDomain || 'Software Engineering & AI',
    domain: trackOrDomain || 'Software Engineering & AI',
    bio: bio || 'Active Mastercard Foundation portal member.',
    avatar: avatar && avatar.trim() !== '' ? avatar : (selectedRole === 'associate' ? '/assets/assoc_amina.jpg' : '/assets/mentor_samuel.jpg')
  };

  if (selectedRole === 'mentor') {
    mentors.unshift({
      ...userObj,
      rating: 5.0,
      totalSessions: 0,
      expertise: [trackOrDomain || 'Software Engineering & AI', 'Mentorship'],
      schedule: [
        { id: Date.now(), date: '2026-08-22', time: '10:00 AM', isBooked: false, bookedBy: null }
      ]
    });
  }

  res.status(201).json({
    token: `mcf_live_token_${Date.now()}`,
    user: userObj
  });
});

// Get Mentors
app.get(['/v1/mentors', '/api/mentors', '/mentors'], (req, res) => {
  res.json(mentors);
});

// Get Sessions
app.get(['/v1/sessions', '/api/sessions', '/sessions'], (req, res) => {
  res.json(sessions);
});

// Root API Index
app.all('*', (req, res) => {
  res.json({
    service: 'Jobberman x Mastercard Foundation Mentorship Live REST API',
    status: 'online',
    endpoints: [
      { name: 'Health Check', path: '/v1/health', method: 'GET' },
      { name: 'Mentors Catalog', path: '/v1/mentors', method: 'GET' },
      { name: 'Sessions History', path: '/v1/sessions', method: 'GET' },
      { name: 'User Login', path: '/v1/auth/login', method: 'POST' },
      { name: 'User Register', path: '/v1/auth/register', method: 'POST' }
    ]
  });
});

export default app;
