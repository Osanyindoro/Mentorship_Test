// Native Vercel Serverless Function (ES Module compatible)

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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  if (url.includes('/health')) {
    return res.status(200).json({ status: 'healthy', service: 'Mastercard Foundation x Jobberman Live API', timestamp: new Date().toISOString() });
  }

  if (req.method === 'POST' && url.includes('/auth/login')) {
    const { role, email } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    return res.status(200).json({
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
  }

  if (req.method === 'POST' && url.includes('/auth/register')) {
    const { role, name, email, institutionOrOrg, title, trackOrDomain, bio } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const selectedRole = role || 'associate';
    const newId = selectedRole === 'associate' ? `MCF-2026-REG-${Math.floor(100 + Math.random() * 900)}` : `MEN-REG-${Math.floor(100 + Math.random() * 900)}`;

    return res.status(201).json({
      token: `mcf_live_token_${Date.now()}`,
      user: {
        id: newId,
        role: selectedRole,
        name: name || "Registered User",
        email: cleanEmail,
        institution: institutionOrOrg || "Ashesi University / Carnegie Mellon Africa",
        organization: institutionOrOrg || "Jobberman Partner Network",
        title: title || "Mastercard Foundation Scholar / Mentor",
        track: trackOrDomain || "Software Engineering & AI",
        bio: bio || "",
        avatar: selectedRole === 'associate' ? '/assets/assoc_amina.jpg' : '/assets/mentor_samuel.jpg'
      }
    });
  }

  if (url.includes('/mentors')) {
    return res.status(200).json(mentors);
  }

  if (url.includes('/sessions')) {
    return res.status(200).json(sessions);
  }

  return res.status(200).json({
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
}
