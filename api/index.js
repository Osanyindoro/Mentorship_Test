// Native Vercel Serverless Function (ES Module compatible - Zero Dependencies)

const associates = [
  {
    id: "MCF-2026-089",
    name: "Amina Kwame",
    email: "amina.kwame@ashesi.edu.gh",
    institution: "Ashesi University / Carnegie Mellon Africa",
    title: "Mastercard Foundation Scholar & Tech Fellow",
    track: "Software Engineering & Data Science",
    bio: "Passionate about building AI tools for healthcare in Africa.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80",
    skills: ["Python", "Machine Learning", "Data Analysis"],
    careerGoal: "Lead healthcare AI research in Africa."
  },
  {
    id: "MCF-2026-104",
    name: "Kofi Mensah",
    email: "kofi.mensah@cmu.edu",
    institution: "Carnegie Mellon University Africa",
    title: "MSc Information Technology Scholar",
    track: "Fintech & Product",
    bio: "Focused on scaling financial access across West Africa.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    skills: ["Product Management", "Financial Modeling"],
    careerGoal: "Build fintech platforms for underserved markets."
  }
];

const mentors = [
  {
    id: "MEN-101",
    name: "Dr. Samuel Osei",
    email: "samuel.osei@mcf-mentors.org",
    title: "Principal AI Scientist & Former Google Research Lead",
    organization: "DeepMind / CMU Africa Faculty",
    domain: "Software Engineering & AI",
    bio: "15+ years experience in Artificial Intelligence and NLP for African languages.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
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
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
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

const groupSessions = [
  {
    id: "GSES-301",
    mentorId: "MEN-101",
    mentorName: "Dr. Samuel Osei",
    title: "AI Research Masterclass: Publishing in Top Conferences",
    description: "Learn how to structure your research, choose target venues, and write compelling conference papers.",
    domain: "Software Engineering & AI",
    date: "2026-08-25",
    time: "04:00 PM - 05:00 PM",
    duration: "60 mins",
    maxCapacity: 20,
    enrolledCount: 14,
    meetingLink: "https://meet.zoho.com/mcf-gses-301"
  }
];

const tasks = [
  {
    id: "TASK-501",
    title: "Submit Statement of Purpose Draft",
    description: "Share the updated SOP draft focusing on healthcare AI applications.",
    deadline: "2026-08-20",
    status: "In Progress",
    assignedTo: "Amina Kwame"
  }
];

const notifications = [
  {
    id: "NOTIF-1",
    title: "Session Confirmed",
    message: "Your mentorship session with Dr. Samuel Osei has been confirmed for Aug 18.",
    timestamp: "10 mins ago",
    read: false
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
        avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80"
      }
    });
  }

  if (req.method === 'POST' && url.includes('/auth/register')) {
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
      avatar: avatar && avatar.trim() !== '' ? avatar : (selectedRole === 'associate' ? 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')
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
    } else {
      associates.unshift(userObj);
    }

    return res.status(201).json({
      token: `mcf_live_token_${Date.now()}`,
      user: userObj
    });
  }

  if (url.includes('/associates')) {
    return res.status(200).json(associates);
  }

  if (url.includes('/mentors')) {
    return res.status(200).json(mentors);
  }

  if (url.includes('/sessions')) {
    return res.status(200).json(sessions);
  }

  if (url.includes('/group-sessions') || url.includes('/group_sessions')) {
    return res.status(200).json(groupSessions);
  }

  if (url.includes('/tasks')) {
    return res.status(200).json(tasks);
  }

  if (url.includes('/notifications')) {
    return res.status(200).json(notifications);
  }

  if (url.includes('/create-meeting') || url.includes('/create_meeting')) {
    const { sessionId } = req.body || {};
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const rPart = (len) => {
      let s = '';
      for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
      return s;
    };
    const meetCode = `${rPart(3)}-${rPart(4)}-${rPart(3)}`;
    const meetLink = `https://meet.google.com/${meetCode}`;

    return res.status(200).json({
      success: true,
      meetingLink: meetLink,
      provider: 'Google Meet'
    });
  }

  return res.status(200).json({
    service: 'Jobberman x Mastercard Foundation Mentorship Live REST API',
    status: 'online',
    endpoints: [
      { name: 'Health Check', path: '/v1/health', method: 'GET' },
      { name: 'Associates Catalog', path: '/v1/associates', method: 'GET' },
      { name: 'Mentors Catalog', path: '/v1/mentors', method: 'GET' },
      { name: 'Sessions History', path: '/v1/sessions', method: 'GET' },
      { name: 'Group Sessions', path: '/v1/group-sessions', method: 'GET' },
      { name: 'Tasks List', path: '/v1/tasks', method: 'GET' },
      { name: 'Notifications', path: '/v1/notifications', method: 'GET' },
      { name: 'User Login', path: '/v1/auth/login', method: 'POST' },
      { name: 'User Register', path: '/v1/auth/register', method: 'POST' },
      { name: 'Create Google Meet Link', path: '/v1/create-meeting', method: 'POST' }
    ]
  });
}
