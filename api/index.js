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
    id: "MEN-2026-001",
    name: "Andre Garbutt",
    email: "andre.garbutt@mcf-mentors.org",
    title: "Founder & Lead Trainer | HR & Learning Consultant",
    organization: "Hands-On Excellence Academy / WAVE",
    domain: "Workforce Development, Talent Management & HR Strategy",
    bio: "HR Consultant, Learning & Development Professional, and Corporate Trainer with over a decade of experience.",
    avatar: "/assets/mentors/andre_garbutt.jpg",
    rating: 4.95,
    totalSessions: 24,
    expertise: ["Workforce Development", "Talent Management", "Employability Training"],
    schedule: [
      { id: 1, date: "2026-08-20", time: "10:00 AM", isBooked: false, bookedBy: null },
      { id: 2, date: "2026-08-22", time: "02:00 PM", isBooked: true, bookedBy: "Amina Kwame" }
    ]
  },
  {
    id: "MEN-2026-002",
    name: "Awele Elueze",
    email: "awele.elueze@mcf-mentors.org",
    title: "Group Head of Human Resources | CIPD (UK) Certified",
    organization: "Alerzo Limited (Ex-EY & Saroafrica International)",
    domain: "Strategic HR Transformation, Performance Management & Executive Leadership",
    bio: "Seasoned HR executive and CIPD-certified strategist currently serving as Group Head of HR at Alerzo Limited.",
    avatar: "/assets/mentors/awele_elueze.jpg",
    rating: 5.0,
    totalSessions: 32,
    expertise: ["HR Transformation", "Performance Management", "Executive Coaching"],
    schedule: [
      { id: 3, date: "2026-08-21", time: "11:00 AM", isBooked: false, bookedBy: null }
    ]
  }
];

const sessions = [
  {
    id: "SES-8801",
    associateId: "MCF-2026-089",
    associateName: "Amina Kwame",
    mentorId: "MEN-2026-001",
    mentorName: "Andre Garbutt",
    mentorDomain: "Workforce Development, Talent Management & HR Strategy",
    date: "2026-08-20",
    time: "02:00 PM",
    duration: "1 Hour",
    objective: "Review workforce development strategy and employability roadmap for African scholars.",
    consentToRecord: true,
    status: "Accepted",
    meetingLink: "https://meet.zoho.com/mcf-mentorship-ses-8801"
  }
];

const groupSessions = [
  {
    id: "GSES-301",
    mentorId: "MEN-2026-001",
    mentorName: "Andre Garbutt",
    title: "Workforce Readiness & Talent Strategy Masterclass",
    description: "An intensive masterclass covering employability skills, talent management, and standing out in competitive global career opportunities.",
    domain: "Workforce Development, Talent Management & HR Strategy",
    date: "2026-08-22",
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
    message: "Your mentorship session with Andre Garbutt has been confirmed for Aug 20.",
    timestamp: "10 mins ago",
    read: false
  }
];

async function getParsedBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const parsedBody = (req.method === 'POST' || req.method === 'PUT') ? await getParsedBody(req) : {};
  const url = req.url || '';

  if (url.includes('/health')) {
    return res.status(200).json({ status: 'healthy', service: 'Mastercard Foundation x Jobberman Live API', timestamp: new Date().toISOString() });
  }

  if (req.method === 'POST' && url.includes('/auth/login')) {
    const { role, email } = parsedBody || {};
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
    const { role, name, email, institutionOrOrg, title, trackOrDomain, bio, avatar } = parsedBody || {};
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

  if (url.includes('/send-email') || url.includes('/send_email')) {
    const { to, subject, html, replyTo } = parsedBody || {};
    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.warn('[Email Warning] RESEND_API_KEY environment variable is not configured on Vercel');
      return res.status(200).json({ success: false, warning: 'RESEND_API_KEY not configured on server' });
    }

    if (!to || !to.length) {
      return res.status(400).json({ success: false, error: 'Recipient email required' });
    }

    const primaryTo = Array.isArray(to) ? to : [to];

    try {
      let response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Mastercard Foundation Mentorship <onboarding@resend.dev>",
          to: primaryTo,
          reply_to: replyTo || "support@jobberman.com",
          subject: subject || "Mastercard Foundation Mentorship Notification",
          html: html
        })
      });

      let data = await response.json();

      // If Resend returns 403 sandbox restriction (unverified domain only allows sending to account owner email)
      if (response.status === 403 && data.message && data.message.includes('only send testing emails')) {
        console.warn('[Resend Sandbox Notice] Testing mode: delivering to verified account owner email.');
        const fallbackOwner = "akinjolebo.18@student.funaab.edu.ng";
        const sandboxNoticeHtml = `
          <div style="background:#fef3c7; border:1px solid #f59e0b; color:#92400e; padding:12px 16px; border-radius:8px; margin-bottom:16px; font-family:sans-serif; font-size:13px; line-height: 1.5;">
            <strong>ℹ️ Resend Testing Sandbox Notice:</strong> This notification was originally intended for <code>${primaryTo.join(', ')}</code>. Because the Resend account is currently in testing mode (unverified domain), it has been delivered to your verified owner email (<code>${fallbackOwner}</code>). Once a custom domain is verified at <a href="https://resend.com/domains" target="_blank" style="color:#b45309;font-weight:bold;">resend.com/domains</a>, emails will be delivered directly to all recipients.
          </div>
          ${html}
        `;

        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Mastercard Foundation Mentorship <onboarding@resend.dev>",
            to: [fallbackOwner],
            reply_to: replyTo || "support@jobberman.com",
            subject: `[TESTING: to ${primaryTo[0]}] ${subject}`,
            html: sandboxNoticeHtml
          })
        });
        data = await response.json();
      }

      return res.status(response.status).json(data);
    } catch (err) {
      console.error('[Resend Dispatch Error]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (url.includes('/create-meeting') || url.includes('/create_meeting')) {
    const { sessionId } = parsedBody || {};
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
