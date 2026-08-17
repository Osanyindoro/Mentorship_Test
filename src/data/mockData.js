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
    id: "MEN-2026-001",
    googleEmail: "andre.garbutt@gmail.com",
    name: "Andre Garbutt",
    email: "andre.garbutt@mcf-mentors.org",
    phone: "+234 802 111 0001",
    title: "Founder & Lead Trainer | HR & Learning Consultant",
    organization: "Hands-On Excellence Academy / WAVE",
    domain: "Workforce Development, Talent Management & HR Strategy",
    bio: "HR Consultant, Learning & Development Professional, and Corporate Trainer with over a decade of experience in workforce development, talent management, and employability training across West Africa. Has trained and mentored over 10,000 young professionals and 2,000 educators. Former Training & Curriculum Innovation Lead at West Africa Vocational Education (WAVE).",
    avatar: "",
    rating: 4.95,
    totalSessions: 24,
    monthlyCap: 15,
    sessionsUsedThisMonth: 6,
    status: "Active",
    expertise: ["Workforce Development", "Talent Management", "Employability Training", "HR Consulting", "Soft Skills Coaching"],
    interests: ["Youth Employability", "Outcome-Based Learning"],
    socialLinks: { linkedin: "https://linkedin.com/in/andregarbutt" },
    schedule: [
      { date: "2026-08-20", time: "10:00 AM", isBooked: false },
      { date: "2026-08-22", time: "02:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-002",
    googleEmail: "awele.elueze@gmail.com",
    name: "Awele Elueze",
    email: "awele.elueze@mcf-mentors.org",
    phone: "+234 803 222 0002",
    title: "Group Head of Human Resources | CIPD (UK) Certified",
    organization: "Alerzo Limited (Ex-EY & Saroafrica International)",
    domain: "Strategic HR Transformation, Performance Management & Executive Leadership",
    bio: "Seasoned HR executive and CIPD-certified strategist currently serving as Group Head of HR at Alerzo Limited. Formerly with EY and Saroafrica International. Holds a First Class B.Sc. in Political Science (UI) and M.Sc. in International Human Resource Management & Employee Relations (QMUL, UK). Expert in HR transformation, organizational design, and competency assessment.",
    avatar: "",
    rating: 5.0,
    totalSessions: 32,
    monthlyCap: 15,
    sessionsUsedThisMonth: 8,
    status: "Active",
    expertise: ["HR Transformation", "Performance Management", "Organizational Design", "Executive Coaching", "CIPD Strategy"],
    interests: ["Organizational Development", "Leadership Capability"],
    socialLinks: { linkedin: "https://linkedin.com/in/aweleelueze" },
    schedule: [
      { date: "2026-08-21", time: "11:00 AM", isBooked: false },
      { date: "2026-08-23", time: "03:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-003",
    googleEmail: "maxwell.beganim@gmail.com",
    name: "Maxwell Beganim",
    email: "maxwell.beganim@mcf-mentors.org",
    phone: "+233 24 333 0003",
    title: "Ecosystem Developer & Climate Negotiator | Shared Value Africa Council Member",
    organization: "Africa Change Lab / Shared Value Africa",
    domain: "Environmental Sustainability, Green Entrepreneurship & Public Policy",
    bio: "Ecosystem developer, thought leader, and Denis Goldberg Scholar with over 15 years of experience across education, technology, entrepreneurship, and environmental sustainability. Serves on the Council of 8 with Shared Value Africa and as a Just Transition Associate with Africa Change Lab. Convener of the Young Green and Sustainability Entrepreneurs Consortium.",
    avatar: "/assets/mentors/maxwell_beganim.jpg",
    rating: 4.9,
    totalSessions: 19,
    monthlyCap: 12,
    sessionsUsedThisMonth: 4,
    status: "Active",
    expertise: ["Climate Policy", "Sustainability", "Green Entrepreneurship", "Civic Leadership", "Youth Organizing"],
    interests: ["Renewable Energy", "Climate Justice"],
    socialLinks: { linkedin: "https://linkedin.com/in/maxwellbeganim" },
    schedule: [
      { date: "2026-08-20", time: "09:00 AM", isBooked: false },
      { date: "2026-08-24", time: "01:30 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-004",
    googleEmail: "confidence.mawusi@gmail.com",
    name: "Confidence Mawusi",
    email: "confidence.mawusi@mcf-mentors.org",
    phone: "+233 20 444 0004",
    title: "Community Engagement Manager | Tech & Legal Specialist (LLB)",
    organization: "QS ImpACT / Internet Society Ghana Chapter",
    domain: "Youth Development, Digital Rights & Social Impact",
    bio: "Community Engagement Manager at QS ImpACT leading youth development, digital safety, and stakeholder outreach across 120+ countries reaching over 300,000 community members. Holds a B.Sc. in ICT (UEW) and an LLB from University of Professional Studies, Accra. Expert in child online protection, digital literacy, and internet governance.",
    avatar: "/assets/mentors/confidence_mawusi.jpg",
    rating: 4.95,
    totalSessions: 28,
    monthlyCap: 15,
    sessionsUsedThisMonth: 7,
    status: "Active",
    expertise: ["Community Engagement", "Digital Safety & Rights", "Internet Governance", "Tech Law", "Youth Empowerment"],
    interests: ["Digital Policy", "Child Protection Online"],
    socialLinks: { linkedin: "https://linkedin.com/in/confidencemawusi" },
    schedule: [
      { date: "2026-08-21", time: "10:30 AM", isBooked: false },
      { date: "2026-08-25", time: "04:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-005",
    googleEmail: "dare.bakare@gmail.com",
    name: "Dare Bakare",
    email: "dare.bakare@mcf-mentors.org",
    phone: "+234 805 555 0005",
    title: "Strategy, Transformation & PMO Leader | MBA, PMP, ISO 9001",
    organization: "Ex-PwC Senior Consultant / Renmoney Corporate Transformation Manager",
    domain: "Corporate Transformation, Strategy Execution & Fintech Operations",
    bio: "Strategy and project leadership professional with over 10 years of cross-sector experience spanning PwC, Renmoney, and energy/fintech sectors. Led regulatory-ready launch of 4 Group entities in 90 days at Renmoney and managed a $17M acquisition integration at PwC. Holds an MBA from Quantic, B.Sc. in Mechanical Engineering (OAU), PMP certification, and McKinsey Forward Alumnus.",
    avatar: "/assets/mentors/dare_bakare.jpg",
    rating: 5.0,
    totalSessions: 35,
    monthlyCap: 15,
    sessionsUsedThisMonth: 9,
    status: "Active",
    expertise: ["Corporate Transformation", "Strategic PMO", "Fintech Scaling", "Business Analytics", "Change Management"],
    interests: ["Business Intelligence", "Operational Execution"],
    socialLinks: { linkedin: "https://linkedin.com/in/darebakare" },
    schedule: [
      { date: "2026-08-22", time: "09:30 AM", isBooked: false },
      { date: "2026-08-26", time: "02:30 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-006",
    googleEmail: "ijeoma.onwordi@gmail.com",
    name: "Ijeoma Nkiruka Onwordi",
    email: "ijeoma.onwordi@mcf-mentors.org",
    phone: "+234 806 666 0006",
    title: "Head of Human Resources | Forbes HR Council Member",
    organization: "Tetracore Energy Group",
    domain: "Corporate Governance, Human Capital & Strategic HR Leadership",
    bio: "Distinguished HR leader with over 20 years of experience driving HR transformation across Management Consulting, Energy, Non-Profit, and Manufacturing. Member of the Forbes HR Council and Society for Corporate Governance Nigeria. As Head of HR at Tetracore Energy Group, she led the firm to earn 'Great Place to Work 2025' certification and won Leader of the Year 2025.",
    avatar: "/assets/mentors/ijeoma_onwordi.jpeg",
    rating: 5.0,
    totalSessions: 40,
    monthlyCap: 15,
    sessionsUsedThisMonth: 10,
    status: "Active",
    expertise: ["Board Advisory", "Strategic Human Capital", "Corporate Governance", "Culture & Leadership", "Workforce Transformation"],
    interests: ["Employee Engagement", "Corporate Governance"],
    socialLinks: { linkedin: "https://linkedin.com/in/ijeomaonwordi" },
    schedule: [
      { date: "2026-08-20", time: "11:30 AM", isBooked: false },
      { date: "2026-08-24", time: "03:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-007",
    googleEmail: "john.madayese@gmail.com",
    name: "John Madayese (\"JM\")",
    email: "john.madayese@mcf-mentors.org",
    phone: "+234 807 777 0007",
    title: "Head of Digital Transformation | ISOC Global Youth Ambassador",
    organization: "Ex-KPMG & PwC Senior Consultant / MIT Professional Education Candidate",
    domain: "Digital Transformation, AI Strategy & Technology Governance",
    bio: "Corporate strategist and digital transformation leader with over a decade of experience delivering high-impact initiatives across financial services, telecom, and public sectors at KPMG and PwC. Currently Head of Digital Transformation at a multinational financial firm and MIT Professional Education candidate. Recognized as one of 30 global IGF Youth Ambassadors by the Internet Society.",
    avatar: "/assets/mentors/john_madayese.png",
    rating: 4.95,
    totalSessions: 37,
    monthlyCap: 15,
    sessionsUsedThisMonth: 8,
    status: "Active",
    expertise: ["Digital Transformation", "Core Systems Architecture", "AI & Tech Governance", "Corporate Strategy", "Operational Excellence"],
    interests: ["Internet Governance", "AI Strategy"],
    socialLinks: { linkedin: "https://linkedin.com/in/johnmadayese" },
    schedule: [
      { date: "2026-08-21", time: "01:00 PM", isBooked: false },
      { date: "2026-08-25", time: "05:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-008",
    googleEmail: "mark.addo@gmail.com",
    name: "Mark Yaw Addo",
    email: "mark.addo@mcf-mentors.org",
    phone: "+233 26 888 0008",
    title: "Certified AWS Professional Skills Instructor & Leadership Coach",
    organization: "AmaliTech / MAYADO Impact Consult",
    domain: "Cloud Technologies (AWS/Google), Employability Skills & Youth Coaching",
    bio: "AWS Professional Skills Instructor and Lead Consultant at MAYADO Impact Consult, specializing in turning early-career talent into job-ready professionals. Has delivered over 40 skills development seminars across Ghana, coached SAGE Ghana students, and serves as an elected Leadership Coach with the Adinkrahene Leadership Programme.",
    avatar: "/assets/mentors/mark_yaw_addo.png",
    rating: 4.9,
    totalSessions: 31,
    monthlyCap: 15,
    sessionsUsedThisMonth: 7,
    status: "Active",
    expertise: ["AWS Cloud Coaching", "Interview Readiness", "Talent Mentorship", "Technical Communication", "Career Preparation"],
    interests: ["Cloud Infrastructure", "Youth Talent Enablement"],
    socialLinks: { linkedin: "https://linkedin.com/in/markyawaddo" },
    schedule: [
      { date: "2026-08-22", time: "10:00 AM", isBooked: false },
      { date: "2026-08-26", time: "02:00 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-009",
    googleEmail: "chioma.anorue@gmail.com",
    name: "Dr. Chioma Ogochukwu Anorue",
    email: "chioma.anorue@mcf-mentors.org",
    phone: "+234 808 999 0009",
    title: "Senior Lecturer & Head of Department of Biology | Ph.D. Public Health Parasitologist",
    organization: "Alex Ekwueme Federal University Ndufu-Alike (AE-FUNAI) / OWSD",
    domain: "Global Health, Academic Mentorship & Epidemiological Research",
    bio: "Accomplished academic leader and Public Health Parasitologist with a Ph.D. from Nnamdi Azikiwe University. HOD of Biology at AE-FUNAI and South-East Coordinator for the Organization for Women in Science for the Developing World (OWSD). CEO of Awesome Touch Global Educational & Leadership Consults and recipient of the 2025 Excellence in Teaching Award.",
    avatar: "",
    rating: 4.88,
    totalSessions: 22,
    monthlyCap: 12,
    sessionsUsedThisMonth: 5,
    status: "Active",
    expertise: ["Public Health Research", "Academic Mentorship", "Epidemiology", "Grant Writing", "Women in Science Leadership"],
    interests: ["Neglected Tropical Diseases", "Community Health Advocacy"],
    socialLinks: { linkedin: "https://linkedin.com/in/chiomaanorue" },
    schedule: [
      { date: "2026-08-23", time: "11:00 AM", isBooked: false },
      { date: "2026-08-27", time: "03:30 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-010",
    googleEmail: "ochuko.ebiuwhe@gmail.com",
    name: "Ochuko Ebiuwhe",
    email: "ochuko.ebiuwhe@mcf-mentors.org",
    phone: "+234 809 101 0010",
    title: "Mindset & Career Development Coach / Executive Mentor",
    organization: "Ochuko Ebiuwhe Mentorship Consult",
    domain: "Career Transition, Transformational Mindset & Leadership Coaching",
    bio: "Internationally recognized mindset and career development coach known for empowering professionals, business schools, and executives across the globe. Combines transformational mindset coaching with practical career transition tools, goal-setting strategies, and leadership development.",
    avatar: "/assets/mentors/ochuko_ebiuwhe.jpg",
    rating: 4.95,
    totalSessions: 29,
    monthlyCap: 15,
    sessionsUsedThisMonth: 6,
    status: "Active",
    expertise: ["Career Transition", "Mindset Transformation", "Executive Coaching", "Leadership Potential", "Public Speaking"],
    interests: ["Personal Brand Development", "Goal Setting"],
    socialLinks: { linkedin: "https://linkedin.com/in/ochukoebiuwhe" },
    schedule: [
      { date: "2026-08-20", time: "02:00 PM", isBooked: false },
      { date: "2026-08-24", time: "04:30 PM", isBooked: false }
    ]
  },
  {
    id: "MEN-2026-011",
    googleEmail: "togbe.ganiyu@gmail.com",
    name: "Togbe Gbetayi Ganiyu",
    email: "togbe.ganiyu@mcf-mentors.org",
    phone: "+234 810 202 0011",
    title: "Principal Tutor & Microsoft Innovative Educator Expert (MIEE) | M.Ed.",
    organization: "Ogun State Universal Basic Education Board / NITDA Master Trainer",
    domain: "Educational Leadership, Digital Education & Teacher Development",
    bio: "Award-winning educator and instructional leader with over 20 years of experience in digital transformation, teacher capacity building, and school administration. Holds an M.Ed. in Educational Administration and was named Ogun State Overall Best Teacher in 2023. National Master Trainer with NITDA and OgunLearn Ambassador.",
    avatar: "/assets/mentors/togbe_ganiyu.png",
    rating: 4.92,
    totalSessions: 34,
    monthlyCap: 15,
    sessionsUsedThisMonth: 8,
    status: "Active",
    expertise: ["Digital Education", "Teacher Capacity Building", "Educational Technology", "School Administration", "Instructional Leadership"],
    interests: ["EdTech Infrastructure", "Data-Driven Education"],
    socialLinks: { linkedin: "https://linkedin.com/in/togbeganiyu" },
    schedule: [
      { date: "2026-08-21", time: "09:00 AM", isBooked: false },
      { date: "2026-08-25", time: "01:30 PM", isBooked: false }
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
const STORAGE_KEY_MENTORS = "mently_mentors_v6_real_profiles";
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
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length < 11 || parsed.some(m => m.id === 'MEN-101' || m.name === 'Dr. Samuel Osei')) {
      localStorage.setItem(STORAGE_KEY_MENTORS, JSON.stringify(INITIAL_MENTORS));
      return INITIAL_MENTORS;
    }
    return parsed;
  } catch (e) {
    localStorage.setItem(STORAGE_KEY_MENTORS, JSON.stringify(INITIAL_MENTORS));
    return INITIAL_MENTORS;
  }
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
