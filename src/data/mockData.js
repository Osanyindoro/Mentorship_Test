// Mently Mentorship Platform - Domain & Mock Data Layer

export const INITIAL_ASSOCIATES = [
  {
    id: "MCF-STAFF-001",
    password: "password123",
    name: "Bolaji Akinjole",
    email: "bakinjole@jobberman.com",
    gender: "Male",
    phone: "+234 801 000 0001",
    title: "M&E Specialist",
    institution: "Jobberman Nigeria",
    organization: "Jobberman Nigeria",
    cohort: "2024-2026 Cohort",
    track: "Monitoring & Evaluation",
    bio: "Monitoring and Evaluation Specialist at Jobberman, leading programme performance measurement and learning for the Mastercard Foundation initiative.",
    skills: ["Monitoring & Evaluation", "Data Collection", "Programme Management", "KPI Reporting", "Stakeholder Engagement"],
    careerGoal: "Lead M&E strategy and impact reporting for youth employment programmes across West Africa.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "MCF-STAFF-002",
    password: "password123",
    name: "Victor Osanyindoro",
    email: "vosanyindoro@jobberman.com",
    gender: "Male",
    phone: "+234 801 000 0002",
    title: "MERL Officer",
    institution: "Jobberman Nigeria",
    organization: "Jobberman Nigeria",
    cohort: "2024-2026 Cohort",
    track: "Monitoring Evaluation Research & Learning",
    bio: "MERL Officer at Jobberman, responsible for monitoring, evaluation, research and learning across the Mastercard Foundation Mentorship Programme.",
    skills: ["MERL", "Research Design", "Data Analysis", "Programme Evaluation", "Learning Agendas"],
    careerGoal: "Drive evidence-based decision making and programme learning across all MCF cohorts.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "MCF-STAFF-003",
    password: "password123",
    name: "Oluwasegun Ogunnusi",
    email: "oogunnusi@jobberman.com",
    gender: "Male",
    phone: "+234 801 000 0003",
    title: "Data Analyst",
    institution: "Jobberman Nigeria",
    organization: "Jobberman Nigeria",
    cohort: "2024-2026 Cohort",
    track: "Data Analytics & Visualisation",
    bio: "Data Analyst at Jobberman, transforming raw programme data into actionable insights to support the Mastercard Foundation mentorship initiative.",
    skills: ["Data Analysis", "SQL", "Python", "Power BI", "Tableau", "Data Visualisation", "Statistical Analysis"],
    careerGoal: "Build robust data pipelines and dashboards that drive strategic programme decisions at Jobberman and the MCF network.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80"
  }
];

export const INITIAL_MENTORS = [
  {
    id: "MEN-101",
    googleEmail: "samuel.osei@gmail.com",
    name: "Dr. Samuel Osei",
    email: "samuel.osei@mcf-mentors.org",
    phone: "+234 80 918 2736",
    title: "Principal AI Scientist & Former Google Research Lead",
    organization: "DeepMind / CMU Africa Faculty",
    domain: "Software Engineering & AI",
    bio: "15+ years experience in Artificial Intelligence, NLP for African languages, and mentoring Mastercard Foundation scholars into global PhD programs and top tech firms.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    totalSessions: 42,
    monthlyCap: 15,
    sessionsUsedThisMonth: 12,
    status: "Active",
    expertise: ["AI / Machine Learning", "PhD Application Advice", "Tech Career Roadmap", "Research Publication"],
    interests: ["Deep Learning for Healthcare", "Ethical AI Policy"],
    socialLinks: { linkedin: "https://linkedin.com/in/samuelosei", github: "https://github.com/samuelosei" },
    schedule: [
      { date: "2026-08-14", time: "10:00 AM", isBooked: false },
      { date: "2026-08-14", time: "02:30 PM", isBooked: true, bookedBy: "Amina Kwame" },
      { date: "2026-08-16", time: "11:00 AM", isBooked: false },
      { date: "2026-08-18", time: "04:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-102",
    googleEmail: "nia.temilade@gmail.com",
    name: "Nia Temilade",
    email: "nia.temilade@mcf-mentors.org",
    phone: "+234 81 234 5678",
    title: "VP of Product Management & Venture Partner",
    organization: "Paystack / Flutterwave Mentor Network",
    domain: "Fintech & Product",
    bio: "Product strategist who scaled payments infrastructure across 6 African countries. Specializes in product management mock interviews, resume strategy, and startup pitching.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    rating: 5.0,
    totalSessions: 38,
    monthlyCap: 12,
    sessionsUsedThisMonth: 8,
    status: "Active",
    expertise: ["Product Strategy", "Fintech Leadership", "Interview Prep", "Venture Capital"],
    interests: ["Cross-border Payments", "Growth Hacking"],
    socialLinks: { linkedin: "https://linkedin.com/in/niatemilade" },
    schedule: [
      { date: "2026-08-15", time: "09:00 AM", isBooked: false },
      { date: "2026-08-15", time: "01:00 PM", isBooked: true, bookedBy: "Kofi Mensah" },
      { date: "2026-08-19", time: "04:30 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-103",
    googleEmail: "kenneth.kiprono@gmail.com",
    name: "Prof. Kenneth Kiprono",
    email: "kenneth.kiprono@mcf-mentors.org",
    phone: "+254 71 890 1234",
    title: "Global Health Policy Director & WHO Consultant",
    organization: "African CDC Liaison / Oxford Fellow",
    domain: "Public Health & Social Impact",
    bio: "Dedicated mentor guiding Mastercard Foundation Associates into public sector advisory, global development fellowships, and impactful community health programs.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    rating: 4.85,
    totalSessions: 29,
    monthlyCap: 10,
    sessionsUsedThisMonth: 6,
    status: "Active",
    expertise: ["Public Health Policy", "Grant Writing", "Global Development", "Leadership"],
    interests: ["Health Systems Strengthening", "Epidemiology"],
    socialLinks: { linkedin: "https://linkedin.com/in/kennethkiprono" },
    schedule: [
      { date: "2026-08-16", time: "11:00 AM", isBooked: false },
      { date: "2026-08-20", time: "03:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-104",
    googleEmail: "fatima.el@gmail.com",
    name: "Fatima El-Mansouri",
    email: "fatima.el@mcf-mentors.org",
    phone: "+212 66 123 4567",
    title: "Head of Data Engineering & Cloud Architecture",
    organization: "Microsoft Africa Development Centre",
    domain: "Software Engineering & Data",
    bio: "Cloud solutions expert passionate about building technical capacity across Africa. Mentors on system design, distributed data pipelines, and navigating corporate tech roles.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    rating: 4.95,
    totalSessions: 51,
    monthlyCap: 20,
    sessionsUsedThisMonth: 14,
    status: "Active",
    expertise: ["Cloud Architecture", "Data Engineering", "Technical System Design", "Women in Tech"],
    interests: ["Big Data Analytics", "Distributed Systems"],
    socialLinks: { linkedin: "https://linkedin.com/in/fatimaelmansouri", github: "https://github.com/fatimael" },
    schedule: [
      { date: "2026-08-17", time: "08:30 AM", isBooked: false },
      { date: "2026-08-21", time: "03:30 PM", isBooked: false }
    ]
  }
];

export const INITIAL_SESSIONS = [
  {
    id: "SES-8801",
    associateId: "MCF-2026-089",
    associateName: "Amina Kwame",
    mentorId: "MEN-101",
    mentorName: "Dr. Samuel Osei",
    mentorDomain: "Software Engineering & AI",
    date: "2026-08-14",
    time: "02:30 PM",
    duration: "1 Hour",
    type: "1-on-1",
    objective: "Review my PhD statement of purpose for Machine Learning programs and get guidance on structuring my publication draft.",
    consentToRecord: true,
    status: "Accepted",
    meetingLink: "https://meet.zoho.com/mently-ses-8801",
    recordingUrl: "https://mently.com/recordings/ses-8801.mp4",
    attendance: { joined: true, startTime: "02:30 PM", endTime: "03:30 PM", durationMinutes: 60 },
    createdAt: "2026-08-02",
    associateRating: {
      performance: 5,
      objectiveAlignment: 5,
      feedback: "Dr. Samuel provided invaluable line-by-line feedback on my research statement!"
    },
    mentorRating: {
      engagement: 5,
      preparedness: 5,
      notes: "Amina was thoroughly prepared with clear questions and draft materials."
    }
  },
  {
    id: "SES-8802",
    associateId: "MCF-2026-042",
    associateName: "Kofi Mensah",
    mentorId: "MEN-102",
    mentorName: "Nia Temilade",
    mentorDomain: "Fintech & Product",
    date: "2026-08-15",
    time: "01:00 PM",
    duration: "1 Hour",
    type: "1-on-1",
    objective: "Discuss product roadmap validation for cross-border payment platform for SMEs.",
    consentToRecord: false,
    status: "Pending",
    meetingLink: null,
    recordingUrl: null,
    attendance: null,
    createdAt: "2026-08-03",
    associateRating: null,
    mentorRating: null
  }
];

export const INITIAL_GROUP_SESSIONS = [
  {
    id: "GRP-901",
    mentorId: "MEN-101",
    mentorName: "Dr. Samuel Osei",
    mentorTitle: "Principal AI Scientist",
    mentorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    title: "Navigating AI & Machine Learning Graduate Applications",
    description: "An intensive masterclass covering statement of purpose strategy, finding research advisors, securing full funding, and standing out in global tech fellowships.",
    domain: "Software Engineering & AI",
    date: "2026-08-22",
    startTime: "04:00 PM",
    endTime: "05:00 PM",
    duration: "60 mins",
    maxCapacity: 20,
    enrolledMentees: ["Amina Kwame", "Zainab Hassan", "Kofi Mensah"],
    meetingLink: "https://meet.zoho.com/mently-grp-901",
    materials: "SOP Template & Research Proposal Checklist.pdf"
  },
  {
    id: "GRP-902",
    mentorId: "MEN-102",
    mentorName: "Nia Temilade",
    mentorTitle: "VP of Product Management",
    mentorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    title: "Product Strategy & Technical Interview Masterclass",
    description: "Break down product design cases, metric estimation questions, and resume optimization for top African fintech and international tech companies.",
    domain: "Fintech & Product",
    date: "2026-08-25",
    startTime: "05:30 PM",
    endTime: "06:45 PM",
    duration: "75 mins",
    maxCapacity: 20,
    enrolledMentees: ["Kofi Mensah"],
    meetingLink: "https://meet.zoho.com/mently-grp-902",
    materials: "PM Case Framework Guide 2026.pdf"
  }
];

export const INITIAL_TASKS = [
  {
    id: "TSK-301",
    mentorId: "MEN-101",
    mentorName: "Dr. Samuel Osei",
    associateId: "MCF-2026-089",
    associateName: "Amina Kwame",
    title: "Draft Revised Statement of Purpose (SOP)",
    description: "Incorporate line-by-line feedback on research contributions and align career goals with CMU Africa faculty interests.",
    deadline: "2026-08-18",
    status: "In Progress",
    submissionNotes: ""
  },
  {
    id: "TSK-302",
    mentorId: "MEN-102",
    mentorName: "Nia Temilade",
    associateId: "MCF-2026-042",
    associateName: "Kofi Mensah",
    title: "Product Teardown & SME User Interview Questions",
    description: "Draft 5 core questions to validate merchant pain points regarding cross-border transaction fees.",
    deadline: "2026-08-20",
    status: "Pending",
    submissionNotes: ""
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "NOTIF-101",
    userId: "MCF-2026-089",
    title: "Session Accepted!",
    message: "Dr. Samuel Osei accepted your 1-on-1 mentorship session scheduled for Aug 14, 02:30 PM.",
    timestamp: "10 mins ago",
    type: "booking",
    read: false
  },
  {
    id: "NOTIF-102",
    userId: "MCF-2026-089",
    title: "New Task Assigned",
    message: "Dr. Samuel Osei assigned you a task: 'Draft Revised Statement of Purpose (SOP)'.",
    timestamp: "1 hour ago",
    type: "task",
    read: false
  }
];

// LocalStorage Keys
const STORAGE_KEY_SESSIONS = "mently_sessions_v5";
const STORAGE_KEY_GROUP_SESSIONS = "mently_group_sessions_v5";
const STORAGE_KEY_TASKS = "mently_tasks_v5";
const STORAGE_KEY_NOTIFICATIONS = "mently_notifications_v5";
const STORAGE_KEY_ASSOCIATES = "mently_associates_v5";
const STORAGE_KEY_MENTORS = "mently_mentors_v5";
const STORAGE_KEY_THEME = "mently_theme_v5";

export function getStoredSessions() {
  const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    return INITIAL_SESSIONS;
  }
  return JSON.parse(data);
}

export function saveStoredSessions(sessions) {
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
}

export function getStoredGroupSessions() {
  const data = localStorage.getItem(STORAGE_KEY_GROUP_SESSIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_GROUP_SESSIONS, JSON.stringify(INITIAL_GROUP_SESSIONS));
    return INITIAL_GROUP_SESSIONS;
  }
  return JSON.parse(data);
}

export function saveStoredGroupSessions(groupSessions) {
  localStorage.setItem(STORAGE_KEY_GROUP_SESSIONS, JSON.stringify(groupSessions));
}

export function getStoredTasks() {
  const data = localStorage.getItem(STORAGE_KEY_TASKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
    return INITIAL_TASKS;
  }
  return JSON.parse(data);
}

export function saveStoredTasks(tasks) {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

export function getStoredNotifications() {
  const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
  return JSON.parse(data);
}

export function saveStoredNotifications(notifications) {
  localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
}

export function getStoredAssociates() {
  const data = localStorage.getItem(STORAGE_KEY_ASSOCIATES);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_ASSOCIATES, JSON.stringify(INITIAL_ASSOCIATES));
    return INITIAL_ASSOCIATES;
  }
  return JSON.parse(data);
}

export function saveStoredAssociates(associates) {
  localStorage.setItem(STORAGE_KEY_ASSOCIATES, JSON.stringify(associates));
}

export function getStoredMentors() {
  const data = localStorage.getItem(STORAGE_KEY_MENTORS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_MENTORS, JSON.stringify(INITIAL_MENTORS));
    return INITIAL_MENTORS;
  }
  return JSON.parse(data);
}

export function saveStoredMentors(mentors) {
  localStorage.setItem(STORAGE_KEY_MENTORS, JSON.stringify(mentors));
}

export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY_THEME) || 'light';
}

export function saveStoredTheme(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}
