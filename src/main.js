import './style.css';
import { getStoredTheme, saveStoredTheme } from './data/mockData.js';
import { apiService } from './services/api.js';

// Route Helper Functions
function getInitialRoute() {
  const path = window.location.pathname;
  if (path === '/login') return '/login';
  if (path === '/associate') return '/associate';
  if (path === '/mentor') return '/mentor';
  if (path === '/admin') return '/admin';
  return '/';
}

const initialUser = apiService.getCurrentUser();

// Application State
const state = {
  theme: getStoredTheme() || 'light',
  currentPath: getInitialRoute(),     // '/' | '/login' | '/associate' | '/mentor' | '/admin'
  currentUser: initialUser,           // null or { id, name, email, avatar, title, role }
  currentRole: initialUser ? initialUser.role : 'associate',

  // Active Navigation Tabs for Dashboards
  associateTab: 'home',               // 'home' | 'mentors' | 'group_sessions' | 'tasks' | 'sessions'
  mentorTab: 'dashboard',             // 'dashboard' | 'availability' | 'group_sessions' | 'tasks'
  adminTab: 'analytics',              // 'analytics' | 'mentors' | 'sessions'
  adminActiveTable: 'mentees',         // 'mentees' | 'mentors' | 'sessions' | 'attendance'
  adminMenteeSearchQuery: '',
  adminMonthFilter: 'august_2026',    // legacy fallback
  adminDateFrom: '2026-08-01',       // Dynamic Start Date (YYYY-MM-DD)
  adminDateTo: '2026-08-31',         // Dynamic End Date (YYYY-MM-DD)
  adminDatePreset: 'this_month',      // 'custom' | 'today' | 'this_week' | 'this_month' | 'last_30' | 'all_time'
  adminSessionMentorFilter: 'ALL',   // 'ALL' or mentor ID/name
  adminSessionSearchQuery: '',
  adminRowsPerPage: 25,               // 10 | 25 | 50 | 100 | 200 | 500

  currentAssociateIndex: 0,
  currentMentorIndex: 0,
  googleUser: initialUser && initialUser.role === 'mentor' ? initialUser : null,

  isNotificationOpen: false,
  isLoadingData: true,

  // Search & Filter State
  landingDomainFilter: 'All',         // 'All' | 'Software Engineering & AI' | ...
  searchQuery: '',
  selectedDomains: [],
  selectedSessionType: 'all',
  onlyAvailableThisWeek: false,

  // Login & Registration Form State
  loginMode: 'login',                // 'login' | 'register'
  loginForm: {
    selectedRole: '',
    email: '',
    password: '',
    showPassword: false,
    isSubmitting: false,
    errorMessage: null
  },
  registerForm: {
    role: 'associate',
    name: '',
    email: '',
    password: '',
    institutionOrOrg: 'Jobberman',
    isCustomHostOrg: false,
    title: '',
    trackOrDomain: 'Software Engineering & AI',
    bio: '',
    avatar: null
  },

  // Modal State
  activeModal: null,                 // null | 'booking' | 'mentor_profile' | 'group_create' | 'task_create' | 'admin_cap' | 'edit_mentor_profile'
  bookingMentor: null,
  inspectingMentor: null,
  inspectingSession: null,
  editingCapMentor: null,
  editingMentorProfile: null,

  bookingData: {
    date: null,
    time: null,
    duration: '1 Hour',
    objective: '',
    consentToRecord: true
  },

  newGroupData: {
    title: '',
    description: '',
    domain: 'Software Engineering & AI',
    date: '2026-08-25',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    duration: '60 mins',
    maxCapacity: 20
  },

  newTaskData: {
    selectedAssociateIds: [],
    searchQuery: '',
    title: '',
    description: '',
    deadline: '2026-08-22'
  },

  // Collections
  associates: [],
  mentors: [],
  sessions: [],
  groupSessions: [],
  tasks: [],
  notifications: []
};

// Initial Theme Setting
document.documentElement.setAttribute('data-theme', state.theme);

const appNode = document.getElementById('app');

// Toast Notification Engine
function showToast(message, icon = 'fa-circle-check') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="color: var(--brand-primary); font-size: 1.25rem;"></i>
    <div>
      <div style="font-weight: 800; font-size: 0.9rem;">Mastercard Foundation Associate Program</div>
      <div style="font-size: 0.82rem; color: var(--text-secondary);">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Toggle Theme
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveStoredTheme(state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  render();
}

// Client-Side Router & Route Protection
function navigateTo(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  state.currentPath = path;
  state.loginForm.errorMessage = null;
  enforceRouteGuards();
  render();
}

window.addEventListener('popstate', () => {
  state.currentPath = window.location.pathname;
  enforceRouteGuards();
  render();
});

function enforceRouteGuards() {
  const user = apiService.getCurrentUser();
  state.currentUser = user;

  const protectedRoutes = ['/associate', '/mentor', '/admin'];

  if (protectedRoutes.includes(state.currentPath)) {
    if (!user) {
      if (state.currentPath !== '/login') {
        showToast('Please sign in to access your mentorship portal.', 'fa-circle-exclamation');
        state.currentPath = '/login';
        if (window.location.pathname !== '/login') {
          window.history.replaceState({}, '', '/login');
        }
      }
      return;
    }

    const allowedRoleForPath = {
      '/associate': 'associate',
      '/mentor': 'mentor',
      '/admin': 'admin'
    }[state.currentPath];

    if (user.role !== allowedRoleForPath) {
      const authorizedPath = `/${user.role}`;
      showToast(`Access restricted. Redirected to your authorized dashboard.`, 'fa-triangle-exclamation');
      state.currentPath = authorizedPath;
      if (window.location.pathname !== authorizedPath) {
        window.history.replaceState({}, '', authorizedPath);
      }
    }
  } else if (state.currentPath === '/login' && user) {
    const authorizedPath = `/${user.role}`;
    state.currentPath = authorizedPath;
    if (window.location.pathname !== authorizedPath) {
      window.history.replaceState({}, '', authorizedPath);
    }
  }
}

// Load Application Data
async function initAppData() {
  try {
    state.isLoadingData = true;
    render();
    const [assocRes, mentRes, sessRes, groupRes, taskRes, notifRes] = await Promise.allSettled([
      apiService.getAssociates(),
      apiService.getMentors(),
      apiService.getSessions(),
      apiService.getGroupSessions(),
      apiService.getTasks(),
      apiService.getNotifications()
    ]);

    state.associates = assocRes.status === 'fulfilled' && assocRes.value ? assocRes.value : [];
    state.mentors = mentRes.status === 'fulfilled' && mentRes.value ? mentRes.value : [];
    state.sessions = sessRes.status === 'fulfilled' && sessRes.value ? sessRes.value : [];
    state.groupSessions = groupRes.status === 'fulfilled' && groupRes.value ? groupRes.value : [];
    state.tasks = taskRes.status === 'fulfilled' && taskRes.value ? taskRes.value : [];
    state.notifications = notifRes.status === 'fulfilled' && notifRes.value ? notifRes.value : [];
  } catch (err) {
    console.warn('Data load warning:', err);
  } finally {
    state.isLoadingData = false;
    enforceRouteGuards();
    render();
  }
}

// Global Main Render Function
function render() {
  if (state.isLoadingData) {
    appNode.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 1rem;">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--brand-primary);"></i>
        <div style="font-weight: 800; font-size: 1.1rem;">Loading Associate Mentorship Portal...</div>
      </div>
    `;
    return;
  }

  // Route Dispatcher
  if (state.currentPath === '/login') {
    appNode.innerHTML = renderLoginPage();
  } else if (state.currentPath === '/') {
    appNode.innerHTML = renderPublicLandingPage();
  } else {
    appNode.innerHTML = renderAuthenticatedDashboard();
  }

  bindEvents();
}

// --------------------------------------------------------------------------
// 1. PUBLIC LANDING PAGE
// --------------------------------------------------------------------------
function renderPublicLandingPage() {
  const domainList = [
    "All",
    "Software Engineering & AI",
    "Fintech & Product",
    "Public Health & Social Impact",
    "Software Engineering & Data"
  ];

  const filteredMentors = state.mentors.filter(m => {
    if (state.landingDomainFilter === 'All') return true;
    return m.domain === state.landingDomainFilter;
  });

  return `
    <div style="min-height: 100vh; display: flex; flex-direction: column;">
      <!-- Public Header -->
      <header class="mently-header" style="justify-content: space-between;">
        <div class="brand-wrapper" style="cursor: pointer; display: flex; align-items: center; gap: 0.85rem;" id="btnNavBrandHome">
          <img src="https://cdn.punchng.com/wp-content/uploads/2020/11/16161239/jobberman-logo.fw_.png" onerror="this.onerror=null; this.src='https://th.bing.com/th/id/R.b027fa05ff8c37baaf5b9326985ca6e0?rik=tjRRiqfBgaDl2A&pid=ImgRaw&r=0';" alt="Jobberman" style="height: 36px; width: auto; object-fit: contain;" />
          <div style="width: 1px; height: 28px; background: var(--border-color); margin: 0 0.15rem;"></div>
          <div class="brand-text">
            <span class="brand-name" style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary); font-family: var(--font-display);">Mastercard Foundation Associate Program</span>
            <span class="brand-tagline" style="font-size: 0.72rem; font-weight: 800; color: var(--brand-violet); letter-spacing: 0.05em; text-transform: uppercase;">ASSOCIATE MENTORSHIP PORTAL</span>
          </div>
        </div>

        <nav class="public-nav-links">
          <a class="public-nav-link" id="navLinkHome">Home</a>
          <a class="public-nav-link" id="navLinkMentors">Find Mentors</a>
          <a class="public-nav-link" id="navLinkHowItWorks">How It Works</a>
          <a class="public-nav-link" id="navLinkValue">Program Value</a>
        </nav>

        <div style="display: flex; align-items: center; gap: 1rem;">
          <button class="btn-icon-circle" id="btnToggleTheme" title="Toggle Theme">
            <i class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
          </button>
          
          <button class="btn-brand-primary btn-nav-login" id="btnNavLogin">
            <i class="fa-solid fa-user"></i> Login
          </button>
        </div>
      </header>

      <!-- Main Landing Content -->
      <main style="max-width: 1240px; margin: 2rem auto; padding: 0 1.5rem; flex: 1; width: 100%;">
        
        <!-- Hero Section -->
        <section class="landing-hero" id="section-hero">
          <div>
            <span class="hero-pill-badge"><i class="fa-solid fa-star"></i> Mastercard Foundation Associate Program</span>
            <h1 class="landing-hero-title">Find a Mentor.<br/><span>Grow With Purpose.</span></h1>
            <p class="landing-hero-sub">
              Connect with experienced mentors who can help you develop your skills, navigate your career and achieve your professional goals.
            </p>
            <div class="landing-hero-ctas">
              <button class="btn-brand-primary" id="btnHeroFindMentors" style="padding: 0.8rem 1.8rem; font-size: 0.95rem;">
                <i class="fa-solid fa-magnifying-glass"></i> Find a Mentor
              </button>
              <button class="btn-brand-secondary" id="btnHeroLogin" style="padding: 0.8rem 1.8rem; font-size: 0.95rem; border: 1px solid var(--border-color);">
                <i class="fa-solid fa-right-to-bracket"></i> Login
              </button>
            </div>
          </div>

          <!-- Hero Visual Stack -->
          <div class="hero-visual-wrapper">
            <div class="hero-visual-card-stack">
              <div class="hero-visual-card card-1">
                <img src="${state.mentors[0]?.avatar || '/assets/mentor_samuel.jpg'}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand-primary);" />
                <div>
                  <div style="font-weight: 800; font-size: 0.95rem;">${state.mentors[0]?.name || 'Dr. Samuel Osei'}</div>
                  <div style="font-size: 0.78rem; color: var(--text-secondary);">${state.mentors[0]?.title || 'Principal AI Scientist'}</div>
                  <span class="badge-tag badge-blue" style="font-size: 0.72rem; margin-top: 0.25rem;">Software Engineering & AI</span>
                </div>
              </div>

              <div class="hero-visual-card card-2">
                <img src="${state.mentors[1]?.avatar || '/assets/mentor_nia.jpg'}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand-violet);" />
                <div>
                  <div style="font-weight: 800; font-size: 0.95rem;">${state.mentors[1]?.name || 'Nia Temilade'}</div>
                  <div style="font-size: 0.78rem; color: var(--text-secondary);">${state.mentors[1]?.title || 'VP of Product Management'}</div>
                  <span class="badge-tag badge-purple" style="font-size: 0.72rem; margin-top: 0.25rem;">Fintech & Product</span>
                </div>
              </div>

              <div class="hero-stats-badge">
                <i class="fa-solid fa-users-viewfinder" style="font-size: 1.4rem; color: var(--brand-primary);"></i>
                <div>
                  <div style="font-weight: 900; font-size: 1rem; color: var(--text-primary);">4,120+ Scholars</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">Empowered Across Africa</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Mentor Discovery Section -->
        <section class="public-section" id="section-mentors">
          <div class="public-section-header">
            <h2 class="public-section-title">Find the right mentor for your journey</h2>
            <p class="public-section-sub">Explore mentors across different specialist domains, professional backgrounds and areas of expertise.</p>
          </div>

          <!-- Filter Pills -->
          <div class="domain-pills-container">
            ${domainList.map(d => `
              <button class="domain-pill-btn ${state.landingDomainFilter === d ? 'active' : ''}" data-domain="${d}">
                ${d}
              </button>
            `).join('')}
          </div>

          <!-- Mentor Cards Grid -->
          <div class="cards-grid">
            ${filteredMentors.map(m => renderLandingMentorCard(m)).join('')}
          </div>
        </section>

        <!-- How It Works Section -->
        <section class="public-section" id="section-how-it-works">
          <div class="public-section-header">
            <h2 class="public-section-title">How the Mentorship Portal Works</h2>
            <p class="public-section-sub">Three simple steps to connect with experienced leaders and accelerate your growth.</p>
          </div>

          <div class="how-it-works-grid">
            <div class="step-card">
              <div class="step-number">01</div>
              <h3 class="step-title">Explore</h3>
              <p class="step-desc">Discover mentors based on your interests, goals and specialist domain across AI, Fintech, Data, and Health.</p>
            </div>

            <div class="step-card">
              <div class="step-number">02</div>
              <h3 class="step-title">Connect</h3>
              <p class="step-desc">Review mentor profiles, explore background bios, social links, and find the right person for your development journey.</p>
            </div>

            <div class="step-card">
              <div class="step-number">03</div>
              <h3 class="step-title">Grow</h3>
              <p class="step-desc">Book 1-on-1 sessions, complete assigned action tasks, attend masterclasses and build meaningful professional relationships.</p>
            </div>
          </div>
        </section>

        <!-- Program Value Section -->
        <section class="public-section" id="section-value">
          <div class="public-section-header">
            <h2 class="public-section-title">Your growth journey starts here</h2>
            <p class="public-section-sub">Empowering scholars with world-class mentorship, technical guidance, and leadership acceleration.</p>
          </div>

          <div class="value-cards-grid">
            <div class="value-card">
              <div class="value-icon-box"><i class="fa-solid fa-compass"></i></div>
              <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.4rem;">Career Guidance</h4>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Strategic roadmap planning for PhD applications, tech fellowship applications, and corporate placement.</p>
            </div>

            <div class="value-card">
              <div class="value-icon-box" style="background: var(--badge-purple-bg); color: var(--brand-violet);"><i class="fa-solid fa-code"></i></div>
              <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.4rem;">Technical Mentorship</h4>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Hands-on feedback on research papers, software system architecture, machine learning models, and code.</p>
            </div>

            <div class="value-card">
              <div class="value-icon-box" style="background: var(--badge-green-bg); color: var(--brand-emerald);"><i class="fa-solid fa-award"></i></div>
              <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.4rem;">Leadership Development</h4>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Cultivate executive presence, communication, and community leadership capabilities across Africa.</p>
            </div>

            <div class="value-card">
              <div class="value-icon-box" style="background: var(--badge-gold-bg); color: var(--brand-gold);"><i class="fa-solid fa-globe"></i></div>
              <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.4rem;">Global Network</h4>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Direct connections to top university faculty, industry executives, and alumni in the Mastercard network.</p>
            </div>

            <div class="value-card">
              <div class="value-icon-box"><i class="fa-solid fa-list-check"></i></div>
              <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.4rem;">Goal Tracking</h4>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Structured action tasks assigned by mentors with deadline tracking and progress reviews.</p>
            </div>

            <div class="value-card">
              <div class="value-icon-box" style="background: var(--badge-purple-bg); color: var(--brand-violet);"><i class="fa-solid fa-people-group"></i></div>
              <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.4rem;">Group Masterclasses</h4>
              <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Interactive cohort workshops and teardowns accommodating up to 20 associates per session.</p>
            </div>
          </div>
        </section>

        <!-- Final Call to Action -->
        <section class="final-cta-banner">
          <h2 class="final-cta-title">Ready to find your mentor?</h2>
          <p class="final-cta-sub">Sign in to your mentorship portal and start building your development journey today.</p>
          <button class="btn-cta-large" id="btnFinalCtaLogin">
            <i class="fa-solid fa-right-to-bracket"></i> Login to Mentorship Portal
          </button>
        </section>

      </main>

      <!-- Public Footer -->
      <footer class="public-footer">
        <div style="max-width: 1240px; margin: 0 auto;">
          <div class="footer-top-grid">
            <div class="brand-wrapper" style="display: flex; align-items: center; gap: 0.85rem;">
              <img src="https://cdn.punchng.com/wp-content/uploads/2020/11/16161239/jobberman-logo.fw_.png" onerror="this.onerror=null; this.src='https://th.bing.com/th/id/R.b027fa05ff8c37baaf5b9326985ca6e0?rik=tjRRiqfBgaDl2A&pid=ImgRaw&r=0';" alt="Jobberman" style="height: 38px; width: auto; object-fit: contain;" />
              <div style="width: 1px; height: 30px; background: var(--border-color);"></div>
              <div class="brand-text">
                <span class="brand-name" style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary);">Mastercard Foundation Associate Program</span>
                <span class="brand-tagline" style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">ASSOCIATE MENTORSHIP PORTAL</span>
              </div>
            </div>

            <!-- Jobberman Official Social Media Links -->
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <span style="font-size: 0.82rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-right: 0.25rem;">Follow Jobberman:</span>
              <a href="https://www.linkedin.com/company/jobberman-nigeria/" target="_blank" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(10, 102, 194, 0.1); color: #0A66C2; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none;" title="LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
              <a href="https://twitter.com/jobbermandotcom" target="_blank" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(15, 20, 25, 0.1); color: var(--text-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none;" title="Twitter / X"><i class="fa-brands fa-x-twitter"></i></a>
              <a href="https://www.facebook.com/jobberman/" target="_blank" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(24, 119, 242, 0.1); color: #1877F2; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none;" title="Facebook"><i class="fa-brands fa-facebook"></i></a>
              <a href="https://www.instagram.com/jobbermannigeria/" target="_blank" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(225, 48, 108, 0.1); color: #E1306C; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none;" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
              <a href="https://www.youtube.com/user/jobbermanng" target="_blank" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255, 0, 0, 0.1); color: #FF0000; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none;" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
              <a href="https://www.jobberman.com/" target="_blank" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(46, 16, 101, 0.1); color: var(--brand-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none;" title="Jobberman Official Website"><i class="fa-solid fa-globe"></i></a>
            </div>
          </div>

          <div class="footer-bottom" style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; font-size: 0.82rem; color: var(--text-muted);">
            <div>© 2026 Mastercard Foundation Associate Program & Jobberman. All rights reserved.</div>
            <div style="display: flex; gap: 1.5rem;">
              <a class="public-nav-link" id="footerLinkHome" style="color: var(--text-secondary);">Home</a>
              <a class="public-nav-link" id="footerLinkMentors" style="color: var(--text-secondary);">Find Mentors</a>
              <a class="public-nav-link" id="footerLinkLogin" style="color: var(--text-secondary);">Login</a>
            </div>
          </div>
        </div>
      </footer>
    </div>

    <!-- Mentor Profile Preview Modal for Unauthenticated Users -->
    ${renderModals()}
  `;
}

function renderLandingMentorCard(m) {
  return `
    <div class="mentor-card">
      <div class="card-header-flex">
        <img src="${m.avatar && m.avatar.startsWith('data:') ? m.avatar : (m.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2e1065&color=ffffff';" class="mentor-avatar-lg" />
        <div>
          <div class="mentor-name">${m.name}</div>
          <div class="mentor-title">${m.title}</div>
          <div class="mentor-org">${m.organization}</div>
        </div>
      </div>

      <p class="mentor-bio-preview">${m.bio}</p>

      <div class="card-tags-flex">
        <span class="badge-tag badge-blue"><i class="fa-solid fa-briefcase"></i> ${m.domain}</span>
        <span class="badge-tag badge-gold"><i class="fa-solid fa-star"></i> ${m.rating} (${m.totalSessions} sessions)</span>
      </div>

      <div class="card-footer" style="margin-top: 1.25rem;">
        <button class="btn-brand-primary btn-inspect-profile" data-id="${m.id}" style="padding: 0.45rem 1rem; font-size: 0.82rem;">View Profile</button>
        <button class="btn-brand-primary btn-landing-book" data-id="${m.id}" style="padding: 0.45rem 1rem; font-size: 0.82rem; background: var(--brand-violet);">Book Session</button>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 2. DEDICATED LOGIN PAGE
// --------------------------------------------------------------------------
function renderLoginPage() {
  const form = state.loginForm;

  return `
    <div class="login-page-wrapper">
      <!-- Login Top Bar -->
      <header class="login-header-bar">
        <div class="brand-wrapper" style="cursor: pointer;" id="btnBackToHomeBrand">
          <div class="brand-logo-icon"><i class="fa-solid fa-graduation-cap"></i></div>
          <div class="brand-text">
            <span class="brand-name" style="font-size: 1.05rem;">Mastercard Foundation Associate Program</span>
            <span class="brand-tagline">ASSOCIATE MENTORSHIP PORTAL</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem;">
          <a id="btnBackToHome" style="font-size: 0.88rem; font-weight: 700; cursor: pointer; color: var(--text-secondary);">
            <i class="fa-solid fa-arrow-left"></i> Back to Home
          </a>
          <button class="btn-icon-circle" id="btnToggleTheme" title="Toggle Theme">
            <i class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
          </button>
        </div>
      </header>

      <!-- Main Login Container -->
      <div class="login-page-container">
        
        <!-- Left Side: Brand Visual Column -->
        <div class="login-banner-side">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.15); padding: 0.35rem 0.9rem; border-radius: 50px; font-size: 0.78rem; font-weight: 800; margin-bottom: 1.5rem;">
              <i class="fa-solid fa-shield-halved"></i> Secure Access Portal
            </div>
            <h1 class="login-banner-title">Empowering Scholars<br/>Across Africa</h1>
            <p style="font-size: 1rem; opacity: 0.9; line-height: 1.6; max-width: 440px;">
              Join thousands of scholars connecting with global leaders in AI, Fintech, Public Health, and Cloud Architecture.
            </p>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 2rem; font-size: 0.9rem; font-weight: 700;">
              <div><i class="fa-solid fa-circle-check" style="margin-right: 0.5rem; opacity: 0.9;"></i> 1-on-1 Strategic Mentorship</div>
              <div><i class="fa-solid fa-circle-check" style="margin-right: 0.5rem; opacity: 0.9;"></i> Interactive Group Masterclasses</div>
              <div><i class="fa-solid fa-circle-check" style="margin-right: 0.5rem; opacity: 0.9;"></i> Action Task Tracking & Guidance</div>
            </div>
          </div>

          <div class="login-quote-card">
            "Mentorship through the Mastercard Foundation Associate Program provided me with the clarity and guidance needed to publish my research and secure admission into CMU Africa."
            <div style="font-weight: 800; margin-top: 0.6rem; font-size: 0.85rem; opacity: 0.95;">— Amina Kwame, Tech Fellow</div>
          </div>
        </div>

        <!-- Right Side: Login / Register Card Form -->
        <div class="login-card-side">
          <div class="login-card">
            
            <!-- Top Tab Switcher: Log In vs Sign Up / Register -->
            <div class="auth-mode-tab-bar">
              <button type="button" id="tabModeLogin" class="auth-mode-tab-btn ${state.loginMode === 'login' ? 'active' : ''}">
                <i class="fa-solid fa-right-to-bracket"></i> Log In
              </button>
              <button type="button" id="tabModeRegister" class="auth-mode-tab-btn ${state.loginMode === 'register' ? 'active' : ''}">
                <i class="fa-solid fa-user-plus"></i> Sign Up / Register
              </button>
            </div>

            <div class="login-card-header">
              <h2 class="login-card-title">${state.loginMode === 'register' ? 'Create Your Account' : 'Welcome Back'}</h2>
              <p class="login-card-sub">${state.loginMode === 'register' ? 'Register your candidate or mentor profile to access the portal.' : 'Sign in to access your mentorship workspace.'}</p>
            </div>

            <!-- Error Alert -->
            ${form.errorMessage ? `
              <div class="login-error-alert" id="loginErrorAlert">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 1.1rem; margin-top: 0.1rem;"></i>
                <div>${form.errorMessage}</div>
              </div>
            ` : ''}

            ${state.loginMode === 'register' ? `
              <!-- REGISTRATION FORM WITH AVATAR UPLOAD -->
              <form id="registerAuthForm">
                
                <!-- AVATAR PHOTO UPLOADER -->
                <div class="form-group" style="text-align: center; margin-bottom: 1.25rem;">
                  <label class="form-label">Profile Photo</label>
                  <div class="avatar-upload-container">
                    <img src="${state.registerForm.avatar && state.registerForm.avatar.startsWith('data:') ? state.registerForm.avatar : (state.registerForm.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80')}" id="regAvatarPreview" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';" class="avatar-upload-preview" />
                    <div style="text-align: left;">
                      <label for="regAvatarInput" class="btn-brand-primary" style="padding: 0.4rem 0.85rem; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                        <i class="fa-solid fa-upload"></i> Upload Headshot
                      </label>
                      <input type="file" id="regAvatarInput" accept="image/jpeg,image/png,image/webp" style="display: none;" />
                      <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.3rem;">JPG or PNG photo (Max 5MB)</div>
                    </div>
                  </div>
                </div>

                <!-- FIELD 1: ACCOUNT TYPE -->
                <div class="form-group">
                  <label class="form-label" for="regRole">Account Type</label>
                  <select class="form-select" id="regRole" required style="border-radius: 10px; padding: 0.7rem 1rem;">
                    <option value="associate" ${state.registerForm.role === 'associate' ? 'selected' : ''}>Associate</option>
                    <option value="mentor" ${state.registerForm.role === 'mentor' ? 'selected' : ''}>Mentor</option>
                  </select>
                </div>

                <!-- FIELD 2: FULL NAME -->
                <div class="form-group">
                  <label class="form-label" for="regName">Full Name</label>
                  <input type="text" class="form-input" id="regName" placeholder="e.g. Emmanuel Okon" value="${state.registerForm.name}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
                </div>

                <!-- FIELD 3: EMAIL -->
                <div class="form-group">
                  <label class="form-label" for="regEmail">Email Address</label>
                  <input type="email" class="form-input" id="regEmail" placeholder="name@domain.com" value="${state.registerForm.email}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
                </div>

                <!-- FIELD 4: PASSWORD -->
                <div class="form-group">
                  <label class="form-label" for="regPassword">Password (Min 6 chars)</label>
                  <input type="password" class="form-input" id="regPassword" placeholder="Create a secure password" value="${state.registerForm.password}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
                </div>

                <!-- FIELD 5: HOST ORGANIZATION -->
                <div class="form-group">
                  <label class="form-label" for="regHostOrgSelect">Host Organization</label>
                  <select class="form-select" id="regHostOrgSelect" style="border-radius: 10px; padding: 0.7rem 1rem;">
                    <option value="Jobberman" ${state.registerForm.institutionOrOrg === 'Jobberman' ? 'selected' : ''}>Jobberman</option>
                    <option value="Paystack" ${state.registerForm.institutionOrOrg === 'Paystack' ? 'selected' : ''}>Paystack</option>
                    <option value="Flutterwave" ${state.registerForm.institutionOrOrg === 'Flutterwave' ? 'selected' : ''}>Flutterwave</option>
                    <option value="Google Africa" ${state.registerForm.institutionOrOrg === 'Google Africa' ? 'selected' : ''}>Google Africa</option>
                    <option value="Microsoft Africa Development Center" ${state.registerForm.institutionOrOrg === 'Microsoft Africa Development Center' ? 'selected' : ''}>Microsoft Africa Development Center</option>
                    <option value="KPMG Africa" ${state.registerForm.institutionOrOrg === 'KPMG Africa' ? 'selected' : ''}>KPMG Africa</option>
                    <option value="Andela" ${state.registerForm.institutionOrOrg === 'Andela' ? 'selected' : ''}>Andela</option>
                    <option value="Ashesi University / CMU Africa" ${state.registerForm.institutionOrOrg === 'Ashesi University / CMU Africa' ? 'selected' : ''}>Ashesi University / CMU Africa</option>
                    <option value="Other" ${state.registerForm.isCustomHostOrg ? 'selected' : ''}>Other (Type Custom Organization)</option>
                  </select>
                  ${state.registerForm.isCustomHostOrg ? `
                    <input type="text" class="form-input" id="regHostOrgCustom" placeholder="Enter Host Organization name (e.g. Jobberman)" value="${state.registerForm.institutionOrOrg === 'Other' ? '' : state.registerForm.institutionOrOrg}" style="margin-top: 0.5rem; border-radius: 10px; padding: 0.7rem 1rem;" />
                  ` : ''}
                </div>

                <!-- FIELD 6: JOB TITLE -->
                <div class="form-group">
                  <label class="form-label" for="regJobTitle">Job Title</label>
                  <input type="text" class="form-input" id="regJobTitle" placeholder="e.g. Software Engineer / Data Analyst / Product Lead" value="${state.registerForm.title || ''}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
                </div>

                <!-- FIELD 7: GENDER -->
                <div class="form-group">
                  <label class="form-label" for="regGender">Gender</label>
                  <select class="form-select" id="regGender" style="border-radius: 10px; padding: 0.7rem 1rem;">
                    <option value="" ${!state.registerForm.gender ? 'selected' : ''}>-- Select Gender --</option>
                    <option value="Male" ${state.registerForm.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${state.registerForm.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Non-binary" ${state.registerForm.gender === 'Non-binary' ? 'selected' : ''}>Non-binary / Gender Diverse</option>
                    <option value="Prefer not to say" ${state.registerForm.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                  </select>
                </div>

                <!-- FIELD 8: BIO -->
                <div class="form-group">
                  <label class="form-label" for="regBio">Biography & Background Summary</label>
                  <textarea class="form-textarea" id="regBio" rows="2" placeholder="Briefly describe your career focus and goals..." style="border-radius: 10px; padding: 0.7rem 1rem;">${state.registerForm.bio}</textarea>
                </div>

                <button type="submit" class="btn-brand-primary login-submit-btn" id="btnSubmitRegister" ${form.isSubmitting ? 'disabled' : ''}>
                  ${form.isSubmitting ? `<i class="fa-solid fa-circle-notch fa-spin"></i> Creating Profile...` : '<i class="fa-solid fa-user-check"></i> CREATE PROFILE & LOG IN'}
                </button>

                <div style="text-align: center; margin-top: 1.25rem; font-size: 0.88rem; color: var(--text-secondary);">
                  Already have an account? <a id="btnToggleLogin" style="color: var(--brand-primary); font-weight: 800; cursor: pointer;">Sign In</a>
                </div>
              </form>
            ` : `
              <!-- LOGIN FORM -->
              <form id="loginAuthForm">
                
                <!-- FIELD 1: PROFILE TYPE -->
                <div class="form-group">
                  <label class="form-label" for="loginRole">Login as</label>
                  <select class="form-select" id="loginRole" required style="border-radius: 10px; padding: 0.7rem 1rem;">
                    <option value="" ${!form.selectedRole ? 'selected' : ''}>Select profile</option>
                    <option value="associate" ${form.selectedRole === 'associate' ? 'selected' : ''}>Associate</option>
                    <option value="mentor" ${form.selectedRole === 'mentor' ? 'selected' : ''}>Mentor</option>
                    <option value="admin" ${form.selectedRole === 'admin' ? 'selected' : ''}>Admin</option>
                  </select>
                </div>

                <!-- FIELD 2: EMAIL ADDRESS -->
                <div class="form-group">
                  <label class="form-label" for="loginEmail">Email Address</label>
                  <input type="email" class="form-input" id="loginEmail" placeholder="Enter your email address" value="${form.email}" autocomplete="email" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
                </div>

                <!-- FIELD 3: PASSWORD -->
                <div class="form-group">
                  <label class="form-label" for="loginPassword">Password</label>
                  <div class="password-input-wrapper">
                    <input type="${form.showPassword ? 'text' : 'password'}" class="form-input" id="loginPassword" placeholder="Enter your password" value="${form.password}" autocomplete="current-password" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
                    <button type="button" class="btn-toggle-password" id="btnTogglePassword" aria-label="Toggle password visibility">
                      <i class="fa-regular ${form.showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-bottom: 1.25rem;">
                  <a href="#" id="btnForgotPassword" style="font-size: 0.82rem; font-weight: 700; color: var(--brand-primary);">Forgot Password?</a>
                </div>

                <button type="submit" class="btn-brand-primary login-submit-btn" id="btnSubmitLogin" ${form.isSubmitting ? 'disabled' : ''}>
                  ${form.isSubmitting ? `<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...` : 'LOGIN'}
                </button>

                <div style="text-align: center; margin-top: 1.25rem; font-size: 0.88rem; color: var(--text-secondary);">
                  Don't have an account yet? <a id="btnToggleRegister" style="color: var(--brand-primary); font-weight: 800; cursor: pointer;">Sign Up / Register</a>
                </div>
              </form>
            `}

          </div>
        </div>

          </div>
        </div>

      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 3. AUTHENTICATED DASHBOARD (PRESERVED WORKSPACE)
// --------------------------------------------------------------------------
function renderAuthenticatedDashboard() {
  const activeAssociate = state.associates[state.currentAssociateIndex] || state.associates[0];
  const activeMentor = state.mentors[state.currentMentorIndex] || state.mentors[0];
  const unreadNotifCount = state.notifications.filter(n => !n.read).length;
  const user = state.currentUser;

  return `
    <!-- Top Header -->
    <header class="mently-header">
      <div class="brand-wrapper" style="display: flex; align-items: center; gap: 0.85rem;">
        <img src="https://cdn.punchng.com/wp-content/uploads/2020/11/16161239/jobberman-logo.fw_.png" onerror="this.onerror=null; this.src='https://th.bing.com/th/id/R.b027fa05ff8c37baaf5b9326985ca6e0?rik=tjRRiqfBgaDl2A&pid=ImgRaw&r=0';" alt="Jobberman" style="height: 36px; width: auto; object-fit: contain;" />
        <div style="width: 1px; height: 28px; background: var(--border-color); margin: 0 0.15rem;"></div>
        <div class="brand-text">
          <span class="brand-name" style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary); font-family: var(--font-display);">Mastercard Foundation Associate Program</span>
          <span class="brand-tagline" style="font-size: 0.72rem; font-weight: 800; color: var(--brand-violet); letter-spacing: 0.05em; text-transform: uppercase;">ASSOCIATE MENTORSHIP PORTAL</span>
        </div>
      </div>

      <!-- Search Input -->
      <div class="header-search-bar">
        <i class="fa-solid fa-magnifying-glass" style="color: var(--text-muted);"></i>
        <input type="text" class="header-search-input" placeholder="Search mentors, expertise, fields..." value="${state.searchQuery}" id="headerSearchInput">
      </div>

      <!-- Actions & Authenticated User Info -->
      <div class="header-right-actions">
        <!-- Auth User Profile Badge -->
        <div class="auth-user-badge">
          <img src="${user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}" class="auth-user-avatar" />
          <span class="auth-user-name">${user?.name || 'User'}</span>
          <span class="badge-tag ${user?.role === 'admin' ? 'badge-purple' : user?.role === 'mentor' ? 'badge-gold' : 'badge-blue'}" style="font-size: 0.72rem; padding: 0.15rem 0.5rem; text-transform: capitalize;">
            ${user?.role || state.currentRole}
          </span>
        </div>

        <!-- Notification Bell -->
        <button class="btn-icon-circle" id="btnToggleNotifications" title="Notifications">
          <i class="fa-regular fa-bell"></i>
          ${unreadNotifCount > 0 ? `<div class="notification-badge-dot"></div>` : ''}
        </button>

        <!-- Theme Toggle -->
        <button class="btn-icon-circle" id="btnToggleTheme" title="Toggle Theme">
          <i class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
        </button>

        <!-- Logout Button -->
        <button class="btn-logout" id="btnLogout" title="Log Out">
          <i class="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      </div>
    </header>

    <!-- Notification Drawer -->
    ${state.isNotificationOpen ? renderNotificationDrawer() : ''}

    <!-- Navigation Subbar -->
    <nav class="mently-subnav">
      ${renderNavigationTabs()}
    </nav>

    <!-- Main Workspace Area -->
    <main class="mently-container">
      ${renderRoleView(activeAssociate, activeMentor)}
    </main>

    <!-- Active Modals -->
    ${renderModals()}
  `;
}

// Render Navigation Tabs based on Role
function renderNavigationTabs() {
  const role = state.currentUser ? state.currentUser.role : state.currentRole;
  if (role === 'associate') {
    return `
      <div class="subnav-link ${state.associateTab === 'home' ? 'active' : ''}" data-tab="home"><i class="fa-solid fa-house"></i> Home</div>
      <div class="subnav-link ${state.associateTab === 'mentors' ? 'active' : ''}" data-tab="mentors"><i class="fa-solid fa-users"></i> Find Mentors</div>
      <div class="subnav-link ${state.associateTab === 'group_sessions' ? 'active' : ''}" data-tab="group_sessions"><i class="fa-solid fa-people-group"></i> Group Sessions</div>
      <div class="subnav-link ${state.associateTab === 'tasks' ? 'active' : ''}" data-tab="tasks"><i class="fa-solid fa-list-check"></i> Tasks</div>
      <div class="subnav-link ${state.associateTab === 'sessions' ? 'active' : ''}" data-tab="sessions"><i class="fa-solid fa-calendar-check"></i> My Sessions</div>
      <div class="subnav-link ${state.associateTab === 'profile' ? 'active' : ''}" data-tab="profile"><i class="fa-solid fa-user-gear"></i> My Profile & Edit</div>
    `;
  } else if (role === 'mentor') {
    return `
      <div class="subnav-link ${state.mentorTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</div>
      <div class="subnav-link ${state.mentorTab === 'availability' ? 'active' : ''}" data-tab="availability"><i class="fa-solid fa-clock"></i> 1-on-1 Slots</div>
      <div class="subnav-link ${state.mentorTab === 'group_sessions' ? 'active' : ''}" data-tab="group_sessions"><i class="fa-solid fa-people-group"></i> Group Masterclasses</div>
      <div class="subnav-link ${state.mentorTab === 'tasks' ? 'active' : ''}" data-tab="tasks"><i class="fa-solid fa-tasks"></i> Mentee Tasks</div>
      <div class="subnav-link ${state.mentorTab === 'profile' ? 'active' : ''}" data-tab="profile"><i class="fa-solid fa-user-pen"></i> My Profile & Edit</div>
    `;
  } else {
    return `
      <div class="subnav-link ${state.adminTab === 'analytics' ? 'active' : ''}" data-tab="analytics"><i class="fa-solid fa-chart-pie"></i> Programme Overview</div>
      <div class="subnav-link ${state.adminTab === 'mentors' ? 'active' : ''}" data-tab="mentors"><i class="fa-solid fa-sliders"></i> Mentor Caps & Onboarding</div>
      <div class="subnav-link ${state.adminTab === 'sessions' ? 'active' : ''}" data-tab="sessions"><i class="fa-solid fa-video"></i> Session Audit Logs</div>
    `;
  }
}

// Render View by Role
function renderRoleView(associate, mentor) {
  const user = state.currentUser;
  const role = user ? user.role : state.currentRole;

  // Bind genuine registered user data dynamically
  const activeUserAssoc = user && user.role === 'associate' ? {
    ...associate,
    id: user.id || associate.id,
    name: user.name || associate.name,
    email: user.email || associate.email,
    institution: user.institution || associate.institution,
    title: user.title || associate.title,
    track: user.track || associate.track,
    bio: user.bio || associate.bio,
    avatar: user.avatar || associate.avatar
  } : associate;

  const activeUserMentor = user && user.role === 'mentor' ? {
    ...mentor,
    id: user.id || mentor.id,
    name: user.name || mentor.name,
    email: user.email || mentor.email,
    organization: user.organization || mentor.organization,
    title: user.title || mentor.title,
    domain: user.domain || mentor.domain,
    bio: user.bio || mentor.bio,
    avatar: user.avatar || mentor.avatar
  } : mentor;

  if (role === 'associate') {
    if (state.associateTab === 'home') return renderMenteeHome(activeUserAssoc);
    if (state.associateTab === 'mentors') return renderMenteeDiscovery();
    if (state.associateTab === 'group_sessions') return renderGroupSessionsList();
    if (state.associateTab === 'tasks') return renderMenteeTasksList();
    if (state.associateTab === 'sessions') return renderMenteeSessionsList();
    if (state.associateTab === 'profile') return renderMenteeProfile(activeUserAssoc);
  } else if (role === 'mentor') {
    if (state.mentorTab === 'dashboard') return renderMentorDashboard(activeUserMentor);
    if (state.mentorTab === 'availability') return renderMentorAvailability(activeUserMentor);
    if (state.mentorTab === 'group_sessions') return renderMentorGroupSessions(activeUserMentor);
    if (state.mentorTab === 'tasks') return renderMentorTasks(activeUserMentor);
    if (state.mentorTab === 'profile') return renderMentorProfile(activeUserMentor);
  } else if (role === 'admin') {
    if (state.adminTab === 'analytics') return renderAdminAnalytics();
    if (state.adminTab === 'mentors') return renderAdminMentorManagement();
    if (state.adminTab === 'sessions') return renderAdminSessionLogs();
  }
}

// --------------------------------------------------------------------------
// MENTEE VIEWS
// --------------------------------------------------------------------------
function renderMenteeHome(associate) {
  const upcomingSessions = state.sessions.filter(s => s.status === 'Accepted');
  const pastSessions = state.sessions.filter(s => s.status === 'Completed' || s.associateId === associate.id || s.associateName === associate.name);
  const engagedMentorIds = [...new Set(pastSessions.map(s => s.mentorId))];
  const engagedMentors = state.mentors.filter(m => engagedMentorIds.includes(m.id));

  return `
    <div style="width: 100%;">
      <!-- Hero Banner: Your Growth Journey Starts Here -->
      <div class="mently-hero-banner" style="background: linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%); border-radius: 18px; padding: 2.25rem; color: #fff; margin-bottom: 2rem; box-shadow: 0 10px 30px rgba(46, 16, 101, 0.25); position: relative; overflow: hidden;">
        <div style="position: relative; z-index: 2;">
          <div class="hero-pill-badge" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); color: #ffd700; border: 1px solid rgba(255,215,0,0.3); font-weight: 800; font-size: 0.82rem; padding: 0.35rem 0.85rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <i class="fa-solid fa-rocket"></i> Mastercard Foundation Associate Program
          </div>
          <h1 class="hero-title" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #ffffff; margin-bottom: 0.75rem; line-height: 1.2;">Your growth journey starts here.</h1>
          <p class="hero-subtitle" style="font-size: 1rem; color: rgba(255,255,255,0.85); max-width: 680px; margin-bottom: 1.5rem; line-height: 1.6;">Connect with verified executive mentors, book 1-on-1 career guidance sessions, and supercharge your leadership skills.</p>
          <div class="hero-actions">
            <button class="btn-brand-primary" id="btnHeroExploreMentors" style="padding: 0.75rem 1.75rem; font-weight: 800; font-size: 0.95rem; border-radius: 10px; background: #6b21a8; color: white; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.6rem; box-shadow: 0 4px 14px rgba(107,33,168,0.4);">
              <i class="fa-solid fa-compass"></i> Explore Mentors
            </button>
          </div>
        </div>
      </div>

      <!-- How the Mentorship Portal Works -->
      <div style="margin-bottom: 2.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-circle-info" style="color: var(--brand-primary);"></i> How the Mentorship Portal Works
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
          <div class="mentor-card" style="border-left: 4px solid #6b21a8; padding: 1.25rem;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(107,33,168,0.1); color: #6b21a8; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">1</div>
            <h4 style="font-weight: 800; font-size: 1rem; margin-bottom: 0.4rem;">Explore & Match</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">Search verified mentors by domain expertise, company, and career specialization.</p>
          </div>
          <div class="mentor-card" style="border-left: 4px solid #059669; padding: 1.25rem;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(5,150,105,0.1); color: #059669; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">2</div>
            <h4 style="font-weight: 800; font-size: 1rem; margin-bottom: 0.4rem;">Schedule 1-on-1</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">Select an open calendar slot and submit your mentorship discussion goals.</p>
          </div>
          <div class="mentor-card" style="border-left: 4px solid #d97706; padding: 1.25rem;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(217,119,6,0.1); color: #d97706; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">3</div>
            <h4 style="font-weight: 800; font-size: 1rem; margin-bottom: 0.4rem;">Connect & Grow</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">Join live Zoho meeting sessions, complete assigned action tasks, and track your progress.</p>
          </div>
        </div>
      </div>

      <!-- Upcoming Sessions Section -->
      <div style="margin-bottom: 2.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-calendar-check" style="color: var(--brand-emerald);"></i> Upcoming Sessions
        </h2>
        ${upcomingSessions.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${upcomingSessions.map(s => `
              <div class="mentor-card" style="border-left: 4px solid var(--brand-emerald); padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                  <div>
                    <span class="badge-tag badge-green" style="margin-bottom: 0.5rem; display: inline-block;">Confirmed 1-on-1 Session</span>
                    <h3 style="font-weight: 800; font-size: 1.15rem;">Session with ${s.mentorName}</h3>
                    <p style="font-size: 0.88rem; color: var(--text-secondary);">${s.mentorDomain}</p>
                  </div>
                  <a href="${s.meetingLink}" target="_blank" class="btn-brand-primary" style="padding: 0.6rem 1.25rem; font-size: 0.88rem;"><i class="fa-solid fa-video"></i> Join Zoho Meeting</a>
                </div>
                <div style="font-size: 0.86rem; color: var(--text-secondary); background: var(--bg-hover); padding: 0.75rem 1rem; border-radius: 8px;">
                  <i class="fa-regular fa-clock"></i> <strong>Scheduled:</strong> ${s.date} at ${s.time} (${s.duration})<br/>
                  <i class="fa-solid fa-bullseye"></i> <strong>Objective:</strong> ${s.objective}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="mentor-card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fa-regular fa-calendar-xmark" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
            <div style="font-weight: 700; font-size: 0.95rem;">No upcoming sessions scheduled.</div>
            <button class="btn-brand-primary" id="btnHomeBookSession" style="margin-top: 0.8rem; padding: 0.5rem 1.2rem; font-size: 0.85rem;"><i class="fa-solid fa-plus"></i> Book a Mentor Session</button>
          </div>
        `}
      </div>

      <!-- Mentors Previously Engaged Section -->
      <div style="margin-bottom: 2.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-user-clock" style="color: var(--brand-violet);"></i> Mentors Previously Engaged
        </h2>
        ${engagedMentors.length > 0 ? `
          <div class="cards-grid">
            ${engagedMentors.map(m => renderMentorCard(m)).join('')}
          </div>
        ` : `
          <div class="cards-grid">
            ${state.mentors.slice(0, 2).map(m => renderMentorCard(m)).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderMenteeDiscovery() {
  const query = state.searchQuery.trim().toLowerCase();
  const filteredMentors = state.mentors.filter(m => {
    const matchesSearch = !query || 
      m.name.toLowerCase().includes(query) ||
      m.title.toLowerCase().includes(query) ||
      m.organization.toLowerCase().includes(query) ||
      m.domain.toLowerCase().includes(query) ||
      m.bio.toLowerCase().includes(query) ||
      m.expertise.some(e => e.toLowerCase().includes(query));

    const matchesDomain = state.selectedDomains.length === 0 || state.selectedDomains.includes(m.domain);
    return matchesSearch && matchesDomain;
  });

  const domains = [
    "Software Engineering & AI",
    "Fintech & Product",
    "Public Health & Social Impact",
    "Software Engineering & Data"
  ];

  return `
    <div class="sidebar-filters">
      <div class="sidebar-header">
        <span>Filters</span>
        <button class="clear-filter-btn" id="btnClearFilters">Reset</button>
      </div>

      <div class="filter-section">
        <div class="filter-title">Specialist Domain</div>
        ${domains.map(d => `
          <label class="filter-checkbox">
            <input type="checkbox" class="domain-filter-cb" value="${d}" ${state.selectedDomains.includes(d) ? 'checked' : ''}>
            <span>${d}</span>
          </label>
        `).join('')}
      </div>
    </div>

    <div class="content-area">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800;">
          Mentor Directory (${filteredMentors.length})
        </h2>
      </div>

      ${filteredMentors.length > 0 ? `
        <div class="cards-grid">
          ${filteredMentors.map(m => renderMentorCard(m)).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="fa-solid fa-user-slash" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
          <div style="font-weight: 800; font-size: 1.1rem;">No mentors found matching your filters.</div>
        </div>
      `}
    </div>
  `;
}

function renderMentorCard(mentor) {
  const availableSlot = mentor.schedule.find(s => !s.isBooked);
  return `
    <div class="mentor-card">
      <div class="card-header-flex">
        <img src="${mentor.avatar && mentor.avatar.startsWith('data:') ? mentor.avatar : (mentor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=2e1065&color=ffffff';" class="mentor-avatar-lg" />
        <div>
          <div class="mentor-name">${mentor.name}</div>
          <div class="mentor-title">${mentor.title}</div>
          <div class="mentor-org">${mentor.organization}</div>
        </div>
      </div>

      <p class="mentor-bio-preview">${mentor.bio}</p>

      <div class="card-tags-flex">
        <span class="badge-tag badge-blue"><i class="fa-solid fa-briefcase"></i> ${mentor.domain}</span>
        <span class="badge-tag badge-gold"><i class="fa-solid fa-star"></i> ${mentor.rating} (${mentor.totalSessions} sessions)</span>
        ${availableSlot ? `<span class="badge-tag badge-green"><i class="fa-regular fa-circle-check"></i> Available ${availableSlot.date}</span>` : ''}
      </div>

      <div class="card-footer">
        <button class="btn-brand-primary btn-inspect-profile" data-id="${mentor.id}" style="padding: 0.45rem 1rem; font-size: 0.82rem;">View Profile</button>
        <button class="btn-brand-primary btn-book-slot" data-id="${mentor.id}" style="padding: 0.45rem 1rem; font-size: 0.82rem; background: var(--brand-violet);">Book 1-on-1</button>
      </div>
    </div>
  `;
}

function renderGroupSessionsList() {
  return `
    <div class="content-area" style="width: 100%;">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">Group Mentorship Masterclasses</h2>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">Join interactive group sessions led by senior mentors (capacity: 20 associates per session).</p>
      </div>

      <div class="cards-grid">
        ${state.groupSessions.map(g => {
          const seatsLeft = g.maxCapacity - g.enrolledMentees.length;
          const activeAssoc = state.associates[state.currentAssociateIndex];
          const isJoined = g.enrolledMentees.includes(activeAssoc.name);

          return `
            <div class="mentor-card">
              <div class="card-header-flex">
                <img src="${g.mentorAvatar && g.mentorAvatar.startsWith('data:') ? g.mentorAvatar : (g.mentorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(g.mentorName)}&background=2e1065&color=ffffff';" class="mentor-avatar-lg" />
                <div>
                  <div class="mentor-name">${g.title}</div>
                  <div class="mentor-title">Led by ${g.mentorName} (${g.mentorTitle})</div>
                  <div class="mentor-org">${g.domain}</div>
                </div>
              </div>

              <p class="mentor-bio-preview">${g.description}</p>

              <div class="card-tags-flex">
                <span class="badge-tag badge-blue"><i class="fa-regular fa-calendar"></i> ${g.date} at ${g.startTime}</span>
                <span class="badge-tag badge-purple"><i class="fa-solid fa-users"></i> ${seatsLeft} / ${g.maxCapacity} seats remaining</span>
              </div>

              <div class="card-footer">
                ${isJoined ? `
                  <span class="badge-tag badge-green" style="font-size: 0.85rem;"><i class="fa-solid fa-circle-check"></i> Registered</span>
                ` : `
                  <button class="btn-brand-primary btn-join-group" data-id="${g.id}">Join Masterclass</button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMenteeTasksList() {
  const activeAssoc = state.associates[state.currentAssociateIndex];
  const myTasks = state.tasks.filter(t => t.associateId === activeAssoc.id || t.associateName === activeAssoc.name);

  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Assigned Action Tasks</h2>
      
      ${myTasks.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${myTasks.map(t => `
            <div class="mentor-card" style="flex-direction: row; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.25rem;">${t.title}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">${t.description}</div>
                <div style="font-size: 0.78rem; color: var(--brand-primary); font-weight: 700;">Assigned by: ${t.mentorName} · Due: ${t.deadline}</div>
              </div>
              <div>
                ${t.status === 'Completed' ? `
                  <span class="badge-tag badge-green"><i class="fa-solid fa-check-double"></i> Completed</span>
                ` : `
                  <button class="btn-brand-primary btn-complete-task" data-id="${t.id}">Mark Completed</button>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="fa-solid fa-clipboard-check" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
          <div style="font-weight: 800;">No pending tasks assigned right now.</div>
        </div>
      `}
    </div>
  `;
}

function renderMenteeSessionsList() {
  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">My Scheduled Sessions</h2>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${state.sessions.map(s => `
          <div class="mentor-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
              <div>
                <div style="font-weight: 800; font-size: 1.1rem;">1-on-1 Session with ${s.mentorName}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${s.mentorDomain}</div>
              </div>
              <span class="badge-tag ${s.status === 'Accepted' ? 'badge-green' : 'badge-gold'}">${s.status}</span>
            </div>

            <div style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 1rem;">
              <strong>Objective:</strong> ${s.objective}
            </div>

            <div class="card-footer">
              <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">
                <i class="fa-regular fa-clock"></i> ${s.date} at ${s.time} (${s.duration})
              </div>
              ${s.meetingLink ? `
                <a href="${s.meetingLink}" target="_blank" class="btn-brand-primary" style="padding: 0.4rem 0.9rem; font-size: 0.8rem;"><i class="fa-solid fa-video"></i> Join Zoho Meet</a>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMenteeProfile(associate) {
  return `
    <div class="content-area" style="width: 100%; max-width: 800px; margin: 0 auto;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <i class="fa-solid fa-user-gear" style="color: var(--brand-primary);"></i> My Associate Profile & Settings
      </h2>

      <form id="formEditMenteeProfile" class="mentor-card" style="padding: 2rem;">
        <!-- PROFILE PHOTO EDIT SECTION -->
        <div style="display: flex; align-items: center; gap: 1.5rem; padding-bottom: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);">
          <img src="${associate.avatar && associate.avatar.startsWith('data:') ? associate.avatar : (associate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80')}" id="profileAvatarPreview" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(associate.name)}&background=2e1065&color=ffffff';" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-primary); box-shadow: var(--shadow-sm);" />
          <div>
            <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.25rem;">Profile Headshot Photo</h4>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem;">JPG or PNG format. Compressed automatically.</p>
            <label for="profileAvatarInput" class="btn-brand-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
              <i class="fa-solid fa-upload"></i> Upload New Picture
            </label>
            <input type="file" id="profileAvatarInput" accept="image/jpeg,image/png,image/webp" style="display: none;" />
          </div>
        </div>

        <!-- FULL NAME -->
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-input" id="editProfileName" value="${associate.name}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- EMAIL ADDRESS -->
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-input" id="editProfileEmail" value="${associate.email}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- HOST ORGANIZATION -->
        <div class="form-group">
          <label class="form-label">Host Organization</label>
          <input type="text" class="form-input" id="editProfileOrg" value="${associate.institution || associate.organization || 'Jobberman'}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- JOB TITLE -->
        <div class="form-group">
          <label class="form-label">Job Title</label>
          <input type="text" class="form-input" id="editProfileTitle" placeholder="e.g. Software Engineer / Data Analyst / Product Lead" value="${associate.title || ''}" required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- GENDER -->
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-input" id="editProfileGender" style="border-radius: 10px; padding: 0.7rem 1rem;">
            <option value="" ${!associate.gender ? 'selected' : ''}>-- Select Gender --</option>
            <option value="Male" ${associate.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Female" ${associate.gender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Non-binary" ${associate.gender === 'Non-binary' ? 'selected' : ''}>Non-binary / Gender Diverse</option>
            <option value="Prefer not to say" ${associate.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
          </select>
        </div>

        <!-- BIO -->
        <div class="form-group">
          <label class="form-label">Bio & Career Goals</label>
          <textarea class="form-input" id="editProfileBio" rows="4" style="border-radius: 10px; padding: 0.7rem 1rem; resize: vertical;">${associate.bio}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
          <button type="submit" class="btn-brand-primary" style="padding: 0.65rem 1.5rem; font-weight: 800; font-size: 0.9rem;">
            <i class="fa-solid fa-floppy-disk"></i> Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  `;
}

// --------------------------------------------------------------------------
// MENTOR VIEWS
// --------------------------------------------------------------------------
function renderMentorDashboard(mentor) {
  const usagePct = Math.round((mentor.sessionsUsedThisMonth / mentor.monthlyCap) * 100);

  return `
    <div class="content-area" style="width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">Mentor Dashboard — ${mentor.name}</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">${mentor.title} (${mentor.organization})</p>
        </div>
        <button class="btn-brand-primary" id="btnEditMyProfile"><i class="fa-solid fa-user-pen"></i> Edit Profile</button>
      </div>

      <!-- Capacity Progress Meter -->
      <div class="mentor-card" style="margin-bottom: 2rem; border-left: 4px solid var(--brand-primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.9rem;">
          <span>Monthly Session Capacity Usage</span>
          <span>${mentor.sessionsUsedThisMonth} / ${mentor.monthlyCap} Sessions Used (${usagePct}%)</span>
        </div>
        <div class="capacity-progress-container">
          <div class="capacity-progress-fill" style="width: ${Math.min(usagePct, 100)}%;"></div>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">Adjusted by Programme Administrators in Admin Portal.</div>
      </div>

      <!-- Booked Sessions -->
      <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin-bottom: 1rem;">Booked Mentorship Sessions</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${state.sessions.map(s => `
          <div class="mentor-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
              <div style="font-weight: 800; font-size: 1.05rem;">Associate: ${s.associateName}</div>
              <span class="badge-tag ${s.status === 'Accepted' ? 'badge-green' : 'badge-gold'}">${s.status}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.8rem;">${s.objective}</p>
            <div class="card-footer">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${s.date} at ${s.time}</span>
              ${s.status === 'Pending' ? `
                <button class="btn-brand-primary btn-accept-session" data-id="${s.id}" style="padding: 0.4rem 0.9rem; font-size: 0.8rem;">Accept Session & Generate Zoho Link</button>
              ` : `
                <a href="${s.meetingLink}" target="_blank" class="btn-brand-primary" style="padding: 0.4rem 0.9rem; font-size: 0.8rem;"><i class="fa-solid fa-video"></i> Start Zoho Session</a>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMentorAvailability(mentor) {
  const defaultDate = new Date().toISOString().split('T')[0];
  return `
    <div class="content-area" style="width: 100%;">
      <div class="mentor-card" style="margin-bottom: 2rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); padding: 1.75rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; color: var(--brand-primary); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-circle-plus"></i> Add Open Time Slot
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 1.25rem; align-items: flex-end;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; color: var(--text-primary);">Available Date</label>
            <input type="date" class="form-input" id="inputSlotDate" value="${defaultDate}" style="border-radius: 10px; padding: 0.65rem 1rem;" />
          </div>
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; color: var(--text-primary);">1–Hour Time Slot</label>
            <select class="form-select" id="inputSlotTime" style="border-radius: 10px; padding: 0.65rem 1rem;">
              <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
              <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
              <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
              <option value="02:30 PM - 03:30 PM">02:30 PM - 03:30 PM</option>
              <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
              <option value="05:30 PM - 06:30 PM">05:30 PM - 06:30 PM</option>
            </select>
          </div>

          <button class="btn-brand-primary" id="btnAddSlotSubmit" style="border-radius: 50px; padding: 0.75rem 1.6rem; font-weight: 800; white-space: nowrap;">
            <i class="fa-solid fa-plus"></i> Add Slot
          </button>
        </div>
      </div>

      <div class="mentor-card" style="border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); padding: 1.75rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem;">My Open & Booked Schedules</h3>
        
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary); font-weight: 800;">
              <th style="padding: 0.85rem;">Date</th>
              <th style="padding: 0.85rem;">1–Hour Time Slot</th>
              <th style="padding: 0.85rem;">Status</th>
              <th style="padding: 0.85rem;">Booked By</th>
              <th style="padding: 0.85rem; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${mentor.schedule.map((s, idx) => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem 0.85rem; font-weight: 800; color: var(--text-primary);">${s.date}</td>
                <td style="padding: 1rem 0.85rem; font-weight: 800; color: var(--brand-primary);">${s.time}</td>
                <td style="padding: 1rem 0.85rem;">
                  ${s.isBooked 
                    ? `<span class="badge-tag badge-gold" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;"><i class="fa-solid fa-lock"></i> Slot Filled</span>` 
                    : `<span class="badge-tag badge-green" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;"><i class="fa-solid fa-circle-check"></i> Available</span>`}
                </td>
                <td style="padding: 1rem 0.85rem; color: var(--text-secondary);">
                  ${s.isBooked ? s.bookedBy : '<span style="color: var(--text-muted);">Open</span>'}
                </td>
                <td style="padding: 1rem 0.85rem; text-align: right;">
                  ${s.isBooked 
                    ? `<span style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Locked</span>` 
                    : `<button class="btn-remove-slot" data-idx="${idx}" style="background: transparent; border: none; color: var(--brand-rose); font-weight: 800; font-size: 0.88rem; cursor: pointer; padding: 0.2rem 0.5rem;">Remove</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMentorGroupSessions(mentor) {
  return `
    <div class="content-area" style="width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">Group Masterclasses</h2>
        <button class="btn-brand-primary" id="btnOpenCreateGroupModal"><i class="fa-solid fa-plus"></i> Create Group Session</button>
      </div>

      <div class="cards-grid">
        ${state.groupSessions.filter(g => g.mentorId === mentor.id || g.mentorName === mentor.name).map(g => `
          <div class="mentor-card">
            <div style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.4rem;">${g.title}</div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${g.description}</p>
            <div class="card-tags-flex">
              <span class="badge-tag badge-blue">${g.date} at ${g.startTime}</span>
              <span class="badge-tag badge-purple">${g.enrolledMentees.length} / ${g.maxCapacity} Enrolled</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMentorTasks(mentor) {
  return `
    <div class="content-area" style="width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">Mentee Action Tasks</h2>
        <button class="btn-brand-primary" id="btnOpenCreateTaskModal"><i class="fa-solid fa-plus"></i> Assign New Task</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${state.tasks.filter(t => t.mentorId === mentor.id || t.mentorName === mentor.name).map(t => `
          <div class="mentor-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-weight: 800; font-size: 1.05rem;">${t.title}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Assigned to: ${t.associateName} · Due: ${t.deadline}</div>
              </div>
              <span class="badge-tag ${t.status === 'Completed' ? 'badge-green' : 'badge-gold'}">${t.status}</span>
            </div>
            <p style="font-size: 0.86rem; color: var(--text-secondary); margin-top: 0.6rem;">${t.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// ADMIN VIEWS
// --------------------------------------------------------------------------
function renderAdminAnalytics() {
  const activeTable = state.adminActiveTable || 'mentees';
  const fromDate = state.adminDateFrom || '2026-08-01';
  const toDate = state.adminDateTo || '2026-08-31';

  const menteesCount = (state.associates && state.associates.length > 0) ? state.associates.length.toLocaleString() : '4,120';
  const sessionsCount = (state.sessions && state.sessions.length > 0) ? state.sessions.length.toString() : '184';
  const rangeLabel = (fromDate && toDate) ? `${fromDate} to ${toDate}` : 'Selected Range';

  return `
    <div class="content-area" style="width: 100%;">
      <!-- DYNAMIC CALENDAR DATE RANGE CONTROL BAR -->
      <div style="background: var(--bg-hover); padding: 1.25rem; border-radius: 16px; border: 1px solid var(--border-color); margin-bottom: 1.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <h2 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; margin-bottom: 0.25rem;">Programme Overview Analytics</h2>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">Select custom <strong>From</strong> & <strong>To</strong> dates on the calendar to dynamically filter all metrics, session logs, and exports.</p>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <!-- SHOW ROWS SELECTOR -->
            <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.84rem; font-weight: 700;">
              <span>Show:</span>
              <select id="selectAdminRowsPerPage" style="padding: 0.45rem 0.65rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.84rem; font-weight: 700; cursor: pointer; background: var(--bg-surface); color: var(--text-primary);">
                <option value="10" ${state.adminRowsPerPage == 10 ? 'selected' : ''}>10 / page</option>
                <option value="25" ${state.adminRowsPerPage == 25 ? 'selected' : ''}>25 / page</option>
                <option value="50" ${state.adminRowsPerPage == 50 ? 'selected' : ''}>50 / page</option>
                <option value="100" ${state.adminRowsPerPage == 100 ? 'selected' : ''}>100 / page</option>
                <option value="200" ${state.adminRowsPerPage == 200 ? 'selected' : ''}>200 / page</option>
                <option value="500" ${state.adminRowsPerPage == 500 ? 'selected' : ''}>500 / page</option>
              </select>
            </div>

            <!-- EXPORT CSV BUTTON -->
            <button id="btnExportAdminCSV" class="btn-brand-primary" style="padding: 0.5rem 1.15rem; font-size: 0.84rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.5rem; background: #059669; color: white;">
              <i class="fa-solid fa-file-csv"></i> Export Table (CSV)
            </button>
          </div>
        </div>

        <!-- DYNAMIC CALENDAR DATE RANGE PICKERS & PRESET PILLS -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: var(--bg-surface); padding: 0.85rem 1.1rem; border-radius: 12px; border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.86rem; font-weight: 800;">
              <i class="fa-regular fa-calendar-days" style="color: var(--brand-primary); font-size: 1.1rem;"></i>
              <span>Calendar Filter:</span>
            </div>

            <!-- FROM DATE PICKER -->
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <label for="inputAdminDateFrom" style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">From:</label>
              <input type="date" id="inputAdminDateFrom" value="${fromDate}" style="padding: 0.4rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem; font-weight: 700; font-family: var(--font-sans); background: var(--bg-hover); color: var(--text-primary); cursor: pointer;" />
            </div>

            <!-- TO DATE PICKER -->
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <label for="inputAdminDateTo" style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">To:</label>
              <input type="date" id="inputAdminDateTo" value="${toDate}" style="padding: 0.4rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem; font-weight: 700; font-family: var(--font-sans); background: var(--bg-hover); color: var(--text-primary); cursor: pointer;" />
            </div>
          </div>

          <!-- QUICK PRESET PILLS -->
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
            <button class="btn-admin-date-preset ${state.adminDatePreset === 'this_month' ? 'active-preset' : ''}" data-preset="this_month" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 800; border-radius: 20px; border: 1px solid var(--border-color); cursor: pointer; ${state.adminDatePreset === 'this_month' ? 'background: var(--brand-primary); color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">This Month</button>
            <button class="btn-admin-date-preset ${state.adminDatePreset === 'last_30' ? 'active-preset' : ''}" data-preset="last_30" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 800; border-radius: 20px; border: 1px solid var(--border-color); cursor: pointer; ${state.adminDatePreset === 'last_30' ? 'background: var(--brand-primary); color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">Last 30 Days</button>
            <button class="btn-admin-date-preset ${state.adminDatePreset === 'this_week' ? 'active-preset' : ''}" data-preset="this_week" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 800; border-radius: 20px; border: 1px solid var(--border-color); cursor: pointer; ${state.adminDatePreset === 'this_week' ? 'background: var(--brand-primary); color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">This Week</button>
            <button class="btn-admin-date-preset ${state.adminDatePreset === 'all_time' ? 'active-preset' : ''}" data-preset="all_time" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 800; border-radius: 20px; border: 1px solid var(--border-color); cursor: pointer; ${state.adminDatePreset === 'all_time' ? 'background: var(--brand-primary); color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">All-Time</button>
          </div>
        </div>
      </div>

      <!-- CLICKABLE KPI STAT CARDS GRID -->
      <div class="stats-overview-grid" style="margin-bottom: 2rem;">
        <!-- KPI 1: TOTAL MENTEES -->
        <div class="stat-card btn-admin-kpi-card ${activeTable === 'mentees' ? 'active-kpi-card' : ''}" data-table="mentees" style="cursor: pointer; position: relative; transition: all 0.25s ease; ${activeTable === 'mentees' ? 'border: 2px solid var(--brand-primary); background: var(--bg-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(107,33,168,0.18);' : 'border: 1px solid var(--border-color);'}">
          <div class="stat-card-header">
            <span class="stat-label" style="font-weight: 800; color: ${activeTable === 'mentees' ? 'var(--brand-primary)' : 'var(--text-secondary)'};">TOTAL MENTEES</span>
            <div class="stat-icon" style="background: rgba(107,33,168,0.12); color: var(--brand-primary);"><i class="fa-solid fa-user-graduate"></i></div>
          </div>
          <div class="stat-value" style="font-size: 2rem; font-weight: 800;">${menteesCount}</div>
          <div class="stat-meta" style="color: var(--text-secondary); font-size: 0.78rem;">${rangeLabel}</div>
          ${activeTable === 'mentees' ? `<div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.72rem; font-weight: 800; color: var(--brand-primary); display: flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-eye"></i> Viewing Table</div>` : ''}
        </div>

        <!-- KPI 2: ACTIVE MENTORS -->
        <div class="stat-card btn-admin-kpi-card ${activeTable === 'mentors' ? 'active-kpi-card' : ''}" data-table="mentors" style="cursor: pointer; position: relative; transition: all 0.25s ease; ${activeTable === 'mentors' ? 'border: 2px solid var(--brand-emerald); background: var(--bg-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(5,150,105,0.18);' : 'border: 1px solid var(--border-color);'}">
          <div class="stat-card-header">
            <span class="stat-label" style="font-weight: 800; color: ${activeTable === 'mentors' ? 'var(--brand-emerald)' : 'var(--text-secondary)'};">ACTIVE MENTORS</span>
            <div class="stat-icon" style="background: var(--badge-green-bg); color: var(--brand-emerald);"><i class="fa-solid fa-user-tie"></i></div>
          </div>
          <div class="stat-value" style="font-size: 2rem; font-weight: 800;">38</div>
          <div class="stat-meta" style="color: var(--text-secondary);">Verified Industry Leaders</div>
          ${activeTable === 'mentors' ? `<div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.72rem; font-weight: 800; color: var(--brand-emerald); display: flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-eye"></i> Viewing Table</div>` : ''}
        </div>

        <!-- KPI 3: SESSIONS IN RANGE -->
        <div class="stat-card btn-admin-kpi-card ${activeTable === 'sessions' ? 'active-kpi-card' : ''}" data-table="sessions" style="cursor: pointer; position: relative; transition: all 0.25s ease; ${activeTable === 'sessions' ? 'border: 2px solid var(--brand-violet); background: var(--bg-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(107,33,168,0.18);' : 'border: 1px solid var(--border-color);'}">
          <div class="stat-card-header">
            <span class="stat-label" style="font-weight: 800; color: ${activeTable === 'sessions' ? 'var(--brand-violet)' : 'var(--text-secondary)'};">SESSIONS (RANGE)</span>
            <div class="stat-icon" style="background: var(--badge-purple-bg); color: var(--brand-violet);"><i class="fa-solid fa-video"></i></div>
          </div>
          <div class="stat-value" style="font-size: 2rem; font-weight: 800;">${sessionsCount}</div>
          <div class="stat-meta" style="color: var(--text-secondary); font-size: 0.78rem;">${rangeLabel}</div>
          ${activeTable === 'sessions' ? `<div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.72rem; font-weight: 800; color: var(--brand-violet); display: flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-eye"></i> Viewing Table</div>` : ''}
        </div>

        <!-- KPI 4: ATTENDANCE RATE -->
        <div class="stat-card btn-admin-kpi-card ${activeTable === 'attendance' ? 'active-kpi-card' : ''}" data-table="attendance" style="cursor: pointer; position: relative; transition: all 0.25s ease; ${activeTable === 'attendance' ? 'border: 2px solid var(--brand-gold); background: var(--bg-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(217,119,6,0.18);' : 'border: 1px solid var(--border-color);'}">
          <div class="stat-card-header">
            <span class="stat-label" style="font-weight: 800; color: ${activeTable === 'attendance' ? 'var(--brand-gold)' : 'var(--text-secondary)'};">ATTENDANCE RATE</span>
            <div class="stat-icon" style="background: var(--badge-gold-bg); color: var(--brand-gold);"><i class="fa-solid fa-chart-line"></i></div>
          </div>
          <div class="stat-value" style="font-size: 2rem; font-weight: 800;">96.4%</div>
          <div class="stat-meta" style="color: var(--text-secondary);">Verified Zoho Logs</div>
          ${activeTable === 'attendance' ? `<div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.72rem; font-weight: 800; color: var(--brand-gold); display: flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-eye"></i> Viewing Table</div>` : ''}
        </div>
      </div>

      <!-- FILTER TAB PILLS -->
      <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color);">
        <button class="btn-admin-kpi-pill ${activeTable === 'mentees' ? 'active-pill' : ''}" data-table="mentees" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'mentees' ? 'background: var(--brand-primary); color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-user-graduate"></i> Mentees Roster (4,120)
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'mentors' ? 'active-pill' : ''}" data-table="mentors" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'mentors' ? 'background: #059669; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-user-tie"></i> Active Mentors (38)
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'sessions' ? 'active-pill' : ''}" data-table="sessions" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'sessions' ? 'background: #6b21a8; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-video"></i> Sessions Log (184)
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'attendance' ? 'active-pill' : ''}" data-table="attendance" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'attendance' ? 'background: #d97706; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-chart-line"></i> Attendance Audit (96.4%)
        </button>
      </div>

      <!-- DYNAMIC TABLE CONTAINER -->
      <div id="adminAnalyticsTableContainer">
        ${renderAdminSelectedTable(activeTable)}
      </div>
    </div>
  `;
}

function renderAdminSelectedTable(activeTable) {
  if (activeTable === 'mentees') {
    const q = (state.adminMenteeSearchQuery || '').toLowerCase().trim();
    const mockMenteesList = [
      { id: 'MCF-2026-089', name: 'Amina Kwame', email: 'amina.kwame@ashesi.edu.gh', org: 'Jobberman / Ashesi', title: 'Software Engineering & Data Science', cohort: '2024-2026', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80', status: 'Active' },
      { id: 'MCF-2026-042', name: 'Kofi Mensah', email: 'kofi.mensah@ala.org', org: 'Jobberman / U-Toronto', title: 'Fintech & Financial Inclusion Analyst', cohort: '2025-2026', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', status: 'Active' },
      { id: 'MCF-2026-108', name: 'Zainab Hassan', email: 'zainab.hassan@uct.ac.za', org: 'African CDC / UCT', title: 'Public Health Research Associate', cohort: '2024-2026', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', status: 'Active' },
      { id: 'MCF-2026-144', name: 'Emmanuel Chukwu', email: 'emmanuel.chukwu@unilag.edu.ng', org: 'Paystack / UNILAG', title: 'Backend Systems Engineer', cohort: '2025-2026', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', status: 'Active' },
      { id: 'MCF-2026-192', name: 'Fatoumata Diallo', email: 'fatoumata.diallo@cmu.edu', org: 'CMU Africa / Google', title: 'AI & Natural Language Processing Fellow', cohort: '2024-2026', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', status: 'Active' }
    ];

    const displayAssociates = state.associates && state.associates.length > 0 ? state.associates : mockMenteesList;
    const filtered = displayAssociates.filter(a => {
      if (!q) return true;
      return (a.name || '').toLowerCase().includes(q) ||
             (a.email || '').toLowerCase().includes(q) ||
             (a.institution || a.org || a.organization || '').toLowerCase().includes(q) ||
             (a.title || a.track || '').toLowerCase().includes(q);
    });

    return `
      <div class="mentor-card" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="font-weight: 800; font-size: 1.15rem;"><i class="fa-solid fa-user-graduate" style="color: var(--brand-primary);"></i> Active Mastercard Scholars & Mentees Roster</h3>
            <p style="font-size: 0.84rem; color: var(--text-secondary);">Verified Associate scholars enrolled in the mentorship programme.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="position: relative;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
              <input type="text" id="inputAdminMenteeSearch" placeholder="Search mentees, org, email..." value="${state.adminMenteeSearchQuery}" style="padding: 0.5rem 1rem 0.5rem 2.2rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem; width: 260px;" />
            </div>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
                <th style="padding: 0.75rem;">Scholar Name</th>
                <th style="padding: 0.75rem;">Email Address</th>
                <th style="padding: 0.75rem;">Host Organization</th>
                <th style="padding: 0.75rem;">Job Title / Specialization</th>
                <th style="padding: 0.75rem;">Cohort</th>
                <th style="padding: 0.75rem;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(a => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${a.avatar && a.avatar.startsWith('data:') ? a.avatar : (a.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=2e1065&color=ffffff';" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />
                    <span>${a.name}</span>
                  </td>
                  <td style="padding: 0.85rem; color: var(--text-secondary);">${a.email}</td>
                  <td style="padding: 0.85rem; font-weight: 700;">${a.institution || a.org || a.organization || 'Jobberman'}</td>
                  <td style="padding: 0.85rem;">${a.title || a.track || 'Software Engineering'}</td>
                  <td style="padding: 0.85rem;"><span class="badge-tag badge-purple">${a.cohort || '2024-2026'}</span></td>
                  <td style="padding: 0.85rem;"><span class="badge-tag badge-green">Verified Active</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (activeTable === 'mentors') {
    return renderAdminMentorManagement();
  }

  if (activeTable === 'sessions') {
    return renderAdminSessionLogs();
  }

  if (activeTable === 'attendance') {
    return `
      <div class="mentor-card" style="padding: 1.5rem;">
        <div style="margin-bottom: 1.25rem;">
          <h3 style="font-weight: 800; font-size: 1.15rem;"><i class="fa-solid fa-chart-line" style="color: var(--brand-gold);"></i> Attendance & Zoho Verification Log Audit</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary);">Real-time attendance logs synchronized with Zoho Meeting webhooks (96.4% attendance rate).</p>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
                <th style="padding: 0.75rem;">Session ID</th>
                <th style="padding: 0.75rem;">Scholar</th>
                <th style="padding: 0.75rem;">Mentor</th>
                <th style="padding: 0.75rem;">Scheduled Time</th>
                <th style="padding: 0.75rem;">Zoho Join Log</th>
                <th style="padding: 0.75rem;">Duration</th>
                <th style="padding: 0.75rem;">Attendance Status</th>
                <th style="padding: 0.75rem;">Scholar Score</th>
              </tr>
            </thead>
            <tbody>
              ${state.sessions.map(s => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 0.85rem; font-weight: 800;">${s.id}</td>
                  <td style="padding: 0.85rem; font-weight: 700;">${s.associateName}</td>
                  <td style="padding: 0.85rem;">${s.mentorName}</td>
                  <td style="padding: 0.85rem;">${s.date} at ${s.time}</td>
                  <td style="padding: 0.85rem; font-family: monospace; font-size: 0.82rem; color: var(--brand-emerald);">${s.time} (On Time)</td>
                  <td style="padding: 0.85rem; font-weight: 700;">60 Mins</td>
                  <td style="padding: 0.85rem;"><span class="badge-tag badge-green"><i class="fa-solid fa-circle-check"></i> Verified (Zoho)</span></td>
                  <td style="padding: 0.85rem; font-weight: 800; color: var(--brand-gold);"><i class="fa-solid fa-star"></i> 5.0 / 5.0</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return '';
}

function exportAdminTableToCSV(activeTable) {
  let filename = `Mastercard_Mentorship_${activeTable}_${state.adminMonthFilter}.csv`;
  let rows = [];

  if (activeTable === 'mentees') {
    rows.push(['Scholar Name', 'Email Address', 'Host Organization', 'Job Title / Specialization', 'Cohort', 'Status']);
    const mockList = [
      ['Amina Kwame', 'amina.kwame@ashesi.edu.gh', 'Jobberman / Ashesi', 'Software Engineering & Data Science', '2024-2026', 'Verified Active'],
      ['Kofi Mensah', 'kofi.mensah@ala.org', 'Jobberman / U-Toronto', 'Fintech & Financial Inclusion Analyst', '2025-2026', 'Verified Active'],
      ['Zainab Hassan', 'zainab.hassan@uct.ac.za', 'African CDC / UCT', 'Public Health Research Associate', '2024-2026', 'Verified Active'],
      ['Emmanuel Chukwu', 'emmanuel.chukwu@unilag.edu.ng', 'Paystack / UNILAG', 'Backend Systems Engineer', '2025-2026', 'Verified Active'],
      ['Fatoumata Diallo', 'fatoumata.diallo@cmu.edu', 'CMU Africa / Google', 'AI & Natural Language Processing Fellow', '2024-2026', 'Verified Active']
    ];
    const source = (state.associates && state.associates.length > 0) 
      ? state.associates.map(a => [a.name, a.email, a.institution || a.org || 'Jobberman', a.title || a.track || 'Software Engineering', a.cohort || '2024-2026', 'Verified Active'])
      : mockList;
    rows.push(...source);
  } else if (activeTable === 'mentors') {
    rows.push(['Mentor Name', 'Specialist Domain', 'Organization', 'Monthly Session Cap', 'Used This Month', 'Status']);
    state.mentors.forEach(m => {
      rows.push([m.name, m.domain, m.organization, `${m.monthlyCap} sessions`, `${m.sessionsUsedThisMonth || 0} sessions`, m.status]);
    });
  } else if (activeTable === 'sessions') {
    rows.push(['Session ID', 'Mentor Name', 'Associate Name', 'Date & Time', 'Status']);
    state.sessions.forEach(s => {
      rows.push([s.id, s.mentorName, s.associateName, `${s.date} ${s.time}`, s.status]);
    });
  } else if (activeTable === 'attendance') {
    rows.push(['Session ID', 'Associate Name', 'Mentor Name', 'Scheduled Time', 'Zoho Join Timestamp', 'Duration', 'Verification Status', 'Scholar Score']);
    state.sessions.forEach(s => {
      rows.push([s.id, s.associateName, s.mentorName, `${s.date} ${s.time}`, `${s.time} (On Time)`, '60 Mins', 'Verified (Zoho)', '5.0 / 5.0']);
    });
  }

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`📥 Exported ${rows.length - 1} records to ${filename}!`, 'fa-file-csv');
}

function renderAdminMentorManagement() {
  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Mentor Session Limits & Onboarding</h2>

      <div class="mentor-card">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
              <th style="padding: 0.75rem;">Mentor Name</th>
              <th style="padding: 0.75rem;">Domain</th>
              <th style="padding: 0.75rem;">Monthly Session Cap</th>
              <th style="padding: 0.75rem;">Used This Month</th>
              <th style="padding: 0.75rem;">Status</th>
              <th style="padding: 0.75rem;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${state.mentors.map(m => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem;">
                  <img src="${m.avatar && m.avatar.startsWith('data:') ? m.avatar : (m.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2e1065&color=ffffff';" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                  <span>${m.name}</span>
                </td>
                <td style="padding: 0.85rem;">${m.domain}</td>
                <td style="padding: 0.85rem; font-weight: 800; color: var(--brand-primary);">${m.monthlyCap} sessions</td>
                <td style="padding: 0.85rem;">${m.sessionsUsedThisMonth} sessions</td>
                <td style="padding: 0.85rem;"><span class="badge-tag badge-green">${m.status}</span></td>
                <td style="padding: 0.85rem;">
                  <button class="btn-brand-primary btn-edit-cap" data-id="${m.id}" style="padding: 0.35rem 0.85rem; font-size: 0.78rem;">Adjust Cap</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminSessionLogs() {
  const selectedMentorIdOrName = state.adminSessionMentorFilter || 'ALL';
  const searchQuery = (state.adminSessionSearchQuery || '').toLowerCase().trim();

  // Filter sessions
  let filteredSessions = state.sessions || [];

  if (selectedMentorIdOrName !== 'ALL') {
    filteredSessions = filteredSessions.filter(s => 
      s.mentorId === selectedMentorIdOrName || 
      (s.mentorName && s.mentorName.toLowerCase() === selectedMentorIdOrName.toLowerCase())
    );
  }

  if (searchQuery) {
    filteredSessions = filteredSessions.filter(s =>
      (s.mentorName && s.mentorName.toLowerCase().includes(searchQuery)) ||
      (s.associateName && s.associateName.toLowerCase().includes(searchQuery)) ||
      (s.id && s.id.toLowerCase().includes(searchQuery)) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery))
    );
  }

  // Selected Mentor Info Object (if specific mentor selected)
  const selectedMentor = selectedMentorIdOrName !== 'ALL'
    ? state.mentors.find(m => m.id === selectedMentorIdOrName || m.name.toLowerCase() === selectedMentorIdOrName.toLowerCase())
    : null;

  return `
    <div class="mentor-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-weight: 800; font-size: 1.15rem; font-family: var(--font-display);"><i class="fa-solid fa-video" style="color: var(--brand-violet);"></i> Executive Session Audit Logs</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary);">Filter and inspect 1-on-1 mentorship session logs by executive mentor, scholar, or keyword.</p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <!-- FILTER BY MENTOR DROPDOWN -->
          <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.84rem; font-weight: 700;">
            <i class="fa-solid fa-filter" style="color: var(--brand-primary);"></i>
            <span>Filter by Mentor:</span>
            <select id="selectAdminSessionMentor" style="padding: 0.45rem 0.85rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.84rem; font-weight: 700; cursor: pointer; background: var(--bg-surface); color: var(--text-primary); max-width: 240px;">
              <option value="ALL" ${selectedMentorIdOrName === 'ALL' ? 'selected' : ''}>-- All Executive Mentors (${state.mentors.length}) --</option>
              ${state.mentors.map(m => `
                <option value="${m.id}" ${selectedMentorIdOrName === m.id || selectedMentorIdOrName.toLowerCase() === m.name.toLowerCase() ? 'selected' : ''}>${m.name} (${m.domain || 'Executive'})</option>
              `).join('')}
            </select>
          </div>

          <!-- SEARCH INPUT -->
          <div style="position: relative;">
            <input type="text" id="inputAdminSessionSearch" value="${state.adminSessionSearchQuery || ''}" placeholder="Search mentor or scholar..." style="padding: 0.45rem 0.85rem 0.45rem 2rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.84rem; background: var(--bg-hover); color: var(--text-primary); width: 210px;" />
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-muted);"></i>
          </div>

          ${selectedMentorIdOrName !== 'ALL' || searchQuery ? `
            <button id="btnResetAdminSessionFilter" style="padding: 0.45rem 0.75rem; font-size: 0.78rem; font-weight: 800; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-secondary); cursor: pointer;"><i class="fa-solid fa-xmark"></i> Clear Filter</button>
          ` : ''}
        </div>
      </div>

      <!-- SELECTED MENTOR SPECIFIC SUMMARY BANNER -->
      ${selectedMentor ? `
        <div style="background: linear-gradient(135deg, rgba(46,16,101,0.06) 0%, rgba(107,33,168,0.12) 100%); border: 1px solid rgba(107,33,168,0.25); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${selectedMentor.avatar && selectedMentor.avatar.startsWith('data:') ? selectedMentor.avatar : (selectedMentor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMentor.name)}&background=2e1065&color=ffffff';" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand-primary);" />
            <div>
              <div style="font-weight: 800; font-size: 1.08rem; font-family: var(--font-display);">${selectedMentor.name}</div>
              <div style="font-size: 0.83rem; color: var(--text-secondary);">${selectedMentor.domain || 'Executive Mentor'} · ${selectedMentor.organization || 'Jobberman Partner Network'}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <span class="badge-tag badge-purple" style="font-size: 0.82rem; padding: 0.4rem 0.85rem;"><i class="fa-solid fa-video"></i> ${filteredSessions.length} Filtered Sessions</span>
            <span class="badge-tag badge-green" style="font-size: 0.82rem; padding: 0.4rem 0.85rem;"><i class="fa-solid fa-chart-pie"></i> Cap: ${selectedMentor.monthlyCap || 10} Sessions / Mo</span>
          </div>
        </div>
      ` : ''}

      <!-- SESSIONS DATA TABLE -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
              <th style="padding: 0.75rem;">Session ID</th>
              <th style="padding: 0.75rem;">Mentor Name</th>
              <th style="padding: 0.75rem;">Scholar / Associate</th>
              <th style="padding: 0.75rem;">Date & Time</th>
              <th style="padding: 0.75rem;">Duration</th>
              <th style="padding: 0.75rem;">Status</th>
              <th style="padding: 0.75rem;">Zoho Room Link</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSessions.length === 0 ? `
              <tr>
                <td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-secondary);">
                  <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                  <div>No session logs found matching the selected mentor filter.</div>
                </td>
              </tr>
            ` : filteredSessions.slice(0, state.adminRowsPerPage || 25).map(s => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem; font-weight: 800; color: var(--brand-primary);">${s.id}</td>
                <td style="padding: 0.85rem; font-weight: 700;">${s.mentorName}</td>
                <td style="padding: 0.85rem;">${s.associateName}</td>
                <td style="padding: 0.85rem;">${s.date} at ${s.time}</td>
                <td style="padding: 0.85rem; font-weight: 700;">60 Mins</td>
                <td style="padding: 0.85rem;"><span class="badge-tag ${s.status === 'Completed' ? 'badge-green' : 'badge-blue'}"><i class="fa-solid ${s.status === 'Completed' ? 'fa-check-double' : 'fa-clock'}"></i> ${s.status}</span></td>
                <td style="padding: 0.85rem;">
                  <a href="${s.meetingUrl || 'https://meeting.zoho.com/join?key=mcf-session'}" target="_blank" style="color: var(--brand-primary); font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem;"><i class="fa-solid fa-up-right-from-square"></i> Zoho Room</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// NOTIFICATION DRAWER & MODALS
// --------------------------------------------------------------------------
function renderNotificationDrawer() {
  return `
    <div class="notification-drawer">
      <div class="notification-header">
        <span>Notifications</span>
        <button id="btnCloseNotifications" style="background: transparent; color: var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
      </div>
      ${state.notifications.map(n => `
        <div class="notification-item ${!n.read ? 'unread' : ''}">
          <i class="fa-solid fa-circle-info" style="color: var(--brand-primary); margin-top: 0.2rem;"></i>
          <div>
            <div style="font-weight: 800; font-size: 0.85rem;">${n.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${n.message}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">${n.timestamp}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderModals() {
  if (!state.activeModal) return '';

  if (state.activeModal === 'booking' && state.bookingMentor) {
    const mentor = state.bookingMentor;
    return `
      <div class="modal-overlay">
        <div class="modal-content-card">
          <div class="modal-header-flex">
            <div class="modal-title">Book 1-on-1 Session with ${mentor.name}</div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <label class="form-label">Select Available Time Slot</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.6rem;">
              ${mentor.schedule.filter(s => !s.isBooked).map(s => `
                <button class="btn-brand-secondary slot-pick-btn ${state.bookingData.date === s.date && state.bookingData.time === s.time ? 'active' : ''}" 
                        data-date="${s.date}" data-time="${s.time}" style="color: var(--text-primary); border: 1px solid var(--border-color);">
                  ${s.date}<br/>${s.time}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Session Objective / Questions</label>
            <textarea class="form-textarea" rows="3" id="bookingObjectiveInput" placeholder="Describe what you would like to discuss...">${state.bookingData.objective}</textarea>
          </div>

          <button class="btn-brand-primary" id="btnConfirmBookingSubmit" style="width: 100%; justify-content: center; padding: 0.8rem;">Confirm Booking</button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'mentor_profile' && state.inspectingMentor) {
    const m = state.inspectingMentor;
    return `
      <div class="modal-overlay">
        <div class="modal-content-card">
          <div class="modal-header-flex">
            <div class="modal-title">${m.name}</div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="card-header-flex">
            <img src="${m.avatar && m.avatar.startsWith('data:') ? m.avatar : (m.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2e1065&color=ffffff';" class="mentor-avatar-lg" />
            <div>
              <div style="font-weight: 800; font-size: 1.1rem;">${m.title}</div>
              <div class="mentor-org">${m.organization}</div>
            </div>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem;">${m.bio}</p>

          <div style="margin-bottom: 1.25rem;">
            <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Social & Professional Profiles</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
              ${m.socialLinks?.linkedin ? `<a href="${m.socialLinks.linkedin}" target="_blank" class="social-link-badge linkedin"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>` : ''}
              ${m.socialLinks?.github ? `<a href="${m.socialLinks.github}" target="_blank" class="social-link-badge github"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
              ${m.socialLinks?.twitter ? `<a href="${m.socialLinks.twitter}" target="_blank" class="social-link-badge twitter"><i class="fa-brands fa-x-twitter"></i> Twitter / X</a>` : ''}
              ${!m.socialLinks?.linkedin && !m.socialLinks?.github && !m.socialLinks?.twitter ? `<span style="font-size: 0.84rem; color: var(--text-muted);">No social handles attached yet.</span>` : ''}
            </div>
          </div>

          <div class="card-tags-flex" style="margin-bottom: 1.5rem;">
            ${m.expertise.map(e => `<span class="badge-tag badge-blue">${e}</span>`).join('')}
          </div>
          <button class="btn-brand-primary btn-book-slot" data-id="${m.id}" style="width: 100%; justify-content: center;">Book Session Now</button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'edit_mentor_profile' && state.editingMentorProfile) {
    const m = state.editingMentorProfile;
    return `
      <div class="modal-overlay">
        <div class="modal-content-card">
          <div class="modal-header-flex">
            <div class="modal-title">Edit Mentor Profile</div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- MENTOR PHOTO UPLOAD SECTION -->
          <div style="display: flex; align-items: center; gap: 1.25rem; padding-bottom: 1.25rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color);">
            <img src="${m.avatar && m.avatar.startsWith('data:') ? m.avatar : (m.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" id="editMentorAvatarPreview" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2e1065&color=ffffff';" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-primary);" />
            <div>
              <h4 style="font-weight: 800; font-size: 1rem; margin-bottom: 0.2rem;">Executive Headshot Photo</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">JPG or PNG photo (Max 5MB)</p>
              <label for="editMentorAvatarInput" class="btn-brand-primary" style="padding: 0.4rem 0.9rem; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-upload"></i> Upload New Picture
              </label>
              <input type="file" id="editMentorAvatarInput" accept="image/jpeg,image/png,image/webp" style="display: none;" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="editMentorName" value="${m.name}" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Professional Title</label>
              <input type="text" class="form-input" id="editMentorTitle" value="${m.title}" />
            </div>
            <div class="form-group">
              <label class="form-label">Organization / Employer</label>
              <input type="text" class="form-input" id="editMentorOrg" value="${m.organization}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Specialist Domain</label>
            <select class="form-select" id="editMentorDomain">
              <option value="Software Engineering & AI" ${m.domain === 'Software Engineering & AI' ? 'selected' : ''}>Software Engineering & AI</option>
              <option value="Fintech & Product" ${m.domain === 'Fintech & Product' ? 'selected' : ''}>Fintech & Product</option>
              <option value="Public Health & Social Impact" ${m.domain === 'Public Health & Social Impact' ? 'selected' : ''}>Public Health & Social Impact</option>
              <option value="Software Engineering & Data" ${m.domain === 'Software Engineering & Data' ? 'selected' : ''}>Software Engineering & Data</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-select" id="editMentorGender">
              <option value="" ${!m.gender ? 'selected' : ''}>-- Select Gender --</option>
              <option value="Male" ${m.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${m.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Non-binary" ${m.gender === 'Non-binary' ? 'selected' : ''}>Non-binary / Gender Diverse</option>
              <option value="Prefer not to say" ${m.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Bio / Background</label>
            <textarea class="form-textarea" rows="3" id="editMentorBio">${m.bio}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Areas of Expertise (Comma Separated)</label>
            <input type="text" class="form-input" id="editMentorExpertise" value="${(m.expertise || []).join(', ')}" placeholder="e.g. AI / Machine Learning, System Design, Career Guidance" />
          </div>

          <div style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); margin-bottom: 0.8rem; margin-top: 0.5rem;">Social Media Links & Handles</div>

          <div class="form-group">
            <label class="form-label"><i class="fa-brands fa-linkedin" style="color: #0A66C2;"></i> LinkedIn URL</label>
            <input type="url" class="form-input" id="editMentorLinkedIn" value="${m.socialLinks?.linkedin || ''}" placeholder="https://linkedin.com/in/username" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label"><i class="fa-brands fa-github"></i> GitHub URL</label>
              <input type="url" class="form-input" id="editMentorGitHub" value="${m.socialLinks?.github || ''}" placeholder="https://github.com/username" />
            </div>
            <div class="form-group">
              <label class="form-label"><i class="fa-brands fa-x-twitter"></i> Twitter / X URL</label>
              <input type="url" class="form-input" id="editMentorTwitter" value="${m.socialLinks?.twitter || ''}" placeholder="https://twitter.com/username" />
            </div>
          </div>

          <button class="btn-brand-primary" id="btnSaveMentorProfileSubmit" style="width: 100%; justify-content: center; padding: 0.8rem; margin-top: 0.5rem;">Save Profile Changes</button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'group_create') {
    const activeMentor = state.mentors[state.currentMentorIndex];
    return `
      <div class="modal-overlay">
        <div class="modal-content-card">
          <div class="modal-header-flex">
            <div class="modal-title"><i class="fa-solid fa-people-group" style="color: var(--brand-primary);"></i> Create Group Masterclass</div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="form-group">
            <label class="form-label">Masterclass Title</label>
            <input type="text" class="form-input" id="createGroupTitle" placeholder="e.g. Navigating AI & Machine Learning Graduate Applications" value="${state.newGroupData.title || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">Specialist Domain</label>
            <select class="form-select" id="createGroupDomain">
              <option value="Software Engineering & AI" ${state.newGroupData.domain === 'Software Engineering & AI' ? 'selected' : ''}>Software Engineering & AI</option>
              <option value="Fintech & Product" ${state.newGroupData.domain === 'Fintech & Product' ? 'selected' : ''}>Fintech & Product</option>
              <option value="Public Health & Social Impact" ${state.newGroupData.domain === 'Public Health & Social Impact' ? 'selected' : ''}>Public Health & Social Impact</option>
              <option value="Software Engineering & Data" ${state.newGroupData.domain === 'Software Engineering & Data' ? 'selected' : ''}>Software Engineering & Data</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Description & Key Takeaways</label>
            <textarea class="form-textarea" rows="3" id="createGroupDescription" placeholder="Describe the topics covered and expectations for attendees...">${state.newGroupData.description || ''}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" id="createGroupDate" value="${state.newGroupData.date || '2026-08-25'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Max Capacity (Associates)</label>
              <input type="number" class="form-input" id="createGroupMaxCapacity" value="${state.newGroupData.maxCapacity || 20}" min="1" max="100" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input type="text" class="form-input" id="createGroupStartTime" value="${state.newGroupData.startTime || '04:00 PM'}" placeholder="e.g. 04:00 PM" />
            </div>
            <div class="form-group">
              <label class="form-label">End Time</label>
              <input type="text" class="form-input" id="createGroupEndTime" value="${state.newGroupData.endTime || '05:00 PM'}" placeholder="e.g. 05:00 PM" />
            </div>
          </div>

          <button class="btn-brand-primary" id="btnSubmitCreateGroup" style="width: 100%; justify-content: center; padding: 0.8rem; margin-top: 0.5rem;">
            <i class="fa-solid fa-plus"></i> Create & Publish Masterclass
          </button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'task_create') {
    const query = (state.newTaskData.searchQuery || '').trim().toLowerCase();
    const filteredAssociates = state.associates.filter(a =>
      !query ||
      a.name.toLowerCase().includes(query) ||
      a.track.toLowerCase().includes(query) ||
      a.id.toLowerCase().includes(query)
    );
    const selectedIds = state.newTaskData.selectedAssociateIds || [];
    const isAllSelected = state.associates.length > 0 && selectedIds.length === state.associates.length;

    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 540px;">
          <div class="modal-header-flex">
            <div class="modal-title"><i class="fa-solid fa-tasks" style="color: var(--brand-primary);"></i> Assign Mentee Task</div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label class="form-label" style="margin-bottom: 0;">Select Mastercard Foundation Associates (${selectedIds.length} selected)</label>
              <button type="button" id="btnToggleSelectAllTasks" class="clear-filter-btn" style="font-size: 0.78rem; font-weight: 700; color: var(--brand-primary); background: transparent; border: none; cursor: pointer;">
                ${isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div class="header-search-bar" style="margin-bottom: 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem 0.8rem; background: var(--bg-card);">
              <i class="fa-solid fa-magnifying-glass" style="color: var(--text-muted); font-size: 0.85rem;"></i>
              <input type="text" class="header-search-input" id="taskAssociateSearchInput" placeholder="Search mentees by name, track, or ID..." value="${state.newTaskData.searchQuery || ''}" style="font-size: 0.85rem; width: 100%;">
            </div>

            <div class="task-associate-list" style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.5rem 0.8rem; display: flex; flex-direction: column; gap: 0.35rem; background: var(--bg-card);">
              ${filteredAssociates.length > 0 ? filteredAssociates.map(a => {
                const checked = selectedIds.includes(a.id);
                return `
                  <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; transition: background 0.15s; background: ${checked ? 'rgba(37, 99, 235, 0.08)' : 'transparent'};" class="associate-checkbox-item">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                      <input type="checkbox" class="task-associate-cb" value="${a.id}" ${checked ? 'checked' : ''} style="accent-color: var(--brand-primary); width: 16px; height: 16px; cursor: pointer;" />
                      <img src="${a.avatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" />
                      <span style="font-weight: 700; color: var(--text-primary);">${a.name}</span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); background: var(--border-color); padding: 0.15rem 0.5rem; border-radius: 4px;">${a.track}</span>
                  </label>
                `;
              }).join('') : `
                <div style="font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 1rem;">No matching associates found.</div>
              `}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Task Title</label>
            <input type="text" class="form-input" id="createTaskTitle" placeholder="e.g. Draft Revised Statement of Purpose (SOP)" value="${state.newTaskData.title || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">Instructions & Deliverables</label>
            <textarea class="form-textarea" rows="3" id="createTaskDescription" placeholder="Detailed guidance for the associate...">${state.newTaskData.description || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Deadline</label>
            <input type="date" class="form-input" id="createTaskDeadline" value="${state.newTaskData.deadline || '2026-08-22'}" />
          </div>

          <button class="btn-brand-primary" id="btnSubmitCreateTask" style="width: 100%; justify-content: center; padding: 0.8rem; margin-top: 0.5rem;">
            <i class="fa-solid fa-paper-plane"></i> Assign Task to ${selectedIds.length} Mentee${selectedIds.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'admin_cap' && state.editingCapMentor) {
    const m = state.editingCapMentor;
    return `
      <div class="modal-overlay">
        <div class="modal-content-card">
          <div class="modal-header-flex">
            <div class="modal-title">Adjust Monthly Cap — ${m.name}</div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Session Limit</label>
            <input type="number" class="form-input" id="inputNewMentorCap" value="${m.monthlyCap}" />
          </div>
          <button class="btn-brand-primary" id="btnSaveCapSubmit" style="width: 100%; justify-content: center;">Save Limit</button>
        </div>
      </div>
    `;
  }

  return '';
}

// Image File Validator & Canvas Compressor (~25KB DataURL)
function compressImageFile(file, callback) {
  if (!file) return;
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('Please select a valid image (JPG, PNG, WEBP).', 'fa-triangle-exclamation');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('File size must be under 5MB.', 'fa-triangle-exclamation');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
      callback(compressedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// --------------------------------------------------------------------------
// EVENT BINDINGS
// --------------------------------------------------------------------------
function bindEvents() {
  // Theme Toggle Button
  document.querySelectorAll('#btnToggleTheme').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // Logout Button
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    apiService.logout();
    state.currentUser = null;
    showToast('Logged out successfully.', 'fa-circle-check');
    navigateTo('/');
  });

  // Public Landing Page Handlers
  if (state.currentPath === '/') {
    document.getElementById('btnNavBrandHome')?.addEventListener('click', () => navigateTo('/'));
    document.getElementById('navLinkHome')?.addEventListener('click', () => {
      document.getElementById('section-hero')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('navLinkMentors')?.addEventListener('click', () => {
      document.getElementById('section-mentors')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('navLinkHowItWorks')?.addEventListener('click', () => {
      document.getElementById('section-how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('navLinkValue')?.addEventListener('click', () => {
      document.getElementById('section-value')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btnNavLogin')?.addEventListener('click', () => navigateTo('/login'));
    document.getElementById('btnHeroLogin')?.addEventListener('click', () => navigateTo('/login'));
    document.getElementById('btnFinalCtaLogin')?.addEventListener('click', () => navigateTo('/login'));
    document.getElementById('footerLinkLogin')?.addEventListener('click', () => navigateTo('/login'));

    document.getElementById('footerLinkHome')?.addEventListener('click', () => navigateTo('/'));
    document.getElementById('footerLinkMentors')?.addEventListener('click', () => {
      document.getElementById('section-mentors')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btnHeroFindMentors')?.addEventListener('click', () => {
      document.getElementById('section-mentors')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Domain Pill Filters on Landing Page
    document.querySelectorAll('.domain-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.landingDomainFilter = btn.dataset.domain;
        render();
      });
    });

    // Inspect Profile Button on Landing Page Card (Enforces Privacy for Unauthenticated Visitors)
    document.querySelectorAll('.btn-inspect-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.currentUser) {
          showToast('🔒 Mentor profiles are reserved for Scholars. Please sign in to view full bios!', 'fa-lock');
          navigateTo('/login');
        } else {
          const m = state.mentors.find(x => x.id === btn.dataset.id);
          state.inspectingMentor = m;
          state.activeModal = 'mentor_profile';
          render();
        }
      });
    });

    // Booking Button on Landing Page Card (Enforces Privacy for Unauthenticated Visitors)
    document.querySelectorAll('.btn-landing-book').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.currentUser) {
          showToast('🔒 1-on-1 Mentorship booking is reserved for Scholars. Please sign in with your account!', 'fa-lock');
          navigateTo('/login');
        } else {
          const m = state.mentors.find(x => x.id === btn.dataset.id);
          state.bookingMentor = m;
          state.activeModal = 'booking';
          render();
        }
      });
    });
  }

  // Login Page Handlers
  if (state.currentPath === '/login') {
    document.getElementById('btnBackToHome')?.addEventListener('click', () => navigateTo('/'));
    document.getElementById('btnBackToHomeBrand')?.addEventListener('click', () => navigateTo('/'));

    // Toggle Password Visibility
    document.getElementById('btnTogglePassword')?.addEventListener('click', () => {
      state.loginForm.showPassword = !state.loginForm.showPassword;
      const passInput = document.getElementById('loginPassword');
      if (passInput) passInput.type = state.loginForm.showPassword ? 'text' : 'password';
      const eyeIcon = document.getElementById('passwordEyeIcon');
      if (eyeIcon) eyeIcon.className = `fa-regular ${state.loginForm.showPassword ? 'fa-eye-slash' : 'fa-eye'}`;
    });

    // Password & Email input handlers
    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput) {
      loginEmailInput.addEventListener('input', (e) => state.loginForm.email = e.target.value);
    }
    const loginPassInput = document.getElementById('loginPassword');
    if (loginPassInput) {
      loginPassInput.addEventListener('input', (e) => state.loginForm.password = e.target.value);
    }
    const loginRoleSelect = document.getElementById('loginRole');
    if (loginRoleSelect) {
      loginRoleSelect.addEventListener('change', (e) => state.loginForm.selectedRole = e.target.value);
    }

    // Demo Credentials Fill
    document.querySelectorAll('.demo-cred-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.loginForm.selectedRole = btn.dataset.role;
        state.loginForm.email = btn.dataset.email;
        state.loginForm.password = 'password123';
        state.loginForm.errorMessage = null;
        render();
      });
    });

    document.getElementById('btnForgotPassword')?.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Password reset instructions have been sent to your email.', 'fa-envelope');
    });

    // Top Mode Tab Switcher: Log In vs Sign Up / Register
    document.getElementById('tabModeLogin')?.addEventListener('click', () => {
      state.loginMode = 'login';
      state.loginForm.errorMessage = null;
      render();
    });
    document.getElementById('tabModeRegister')?.addEventListener('click', () => {
      state.loginMode = 'register';
      state.loginForm.errorMessage = null;
      render();
    });

    // Toggle between Login & Register mode links
    document.getElementById('btnToggleRegister')?.addEventListener('click', () => {
      state.loginMode = 'register';
      state.loginForm.errorMessage = null;
      render();
    });
    document.getElementById('btnToggleLogin')?.addEventListener('click', () => {
      state.loginMode = 'login';
      state.loginForm.errorMessage = null;
      render();
    });
    document.getElementById('regRole')?.addEventListener('change', (e) => {
      state.registerForm.role = e.target.value;
      render();
    });

    // Host Organization Select & Custom Input Handlers
    document.getElementById('regHostOrgSelect')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'Other') {
        state.registerForm.isCustomHostOrg = true;
        state.registerForm.institutionOrOrg = '';
      } else {
        state.registerForm.isCustomHostOrg = false;
        state.registerForm.institutionOrOrg = val;
      }
      render();
    });

    document.getElementById('regHostOrgCustom')?.addEventListener('input', (e) => {
      state.registerForm.institutionOrOrg = e.target.value;
    });

    // Sign Up Profile Photo File Upload Listener (Canvas Compressed to ~25KB max)
    const regAvatarInput = document.getElementById('regAvatarInput');
    if (regAvatarInput) {
      regAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressImageFile(file, (compressedDataUrl) => {
            state.registerForm.avatar = compressedDataUrl;
            const preview = document.getElementById('regAvatarPreview');
            if (preview) preview.src = compressedDataUrl;
            showToast('Profile photo optimized!', 'fa-image');
          });
        }
      });
    }

    // Registration Form Submit Handler
    const regFormEl = document.getElementById('registerAuthForm');
    if (regFormEl) {
      regFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = document.getElementById('regRole')?.value || 'associate';
        const name = document.getElementById('regName')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const gender = document.getElementById('regGender')?.value || '';
        const institutionOrOrg = state.registerForm.institutionOrOrg || document.getElementById('regHostOrgCustom')?.value || document.getElementById('regHostOrgSelect')?.value || 'Jobberman';
        const title = document.getElementById('regJobTitle')?.value || (role === 'associate' ? 'Mastercard Foundation Scholar' : 'Executive Mentor');
        const bio = document.getElementById('regBio')?.value;

        try {
          state.loginForm.isSubmitting = true;
          state.loginForm.errorMessage = null;
          render();

          const authResult = await apiService.register({
            selectedRole: role,
            name,
            email,
            password,
            gender,
            institutionOrOrg,
            title,
            trackOrDomain: title,
            bio,
            avatar: state.registerForm.avatar
          });

          state.currentUser = authResult.user;
          state.currentRole = authResult.user.role;
          state.loginForm.isSubmitting = false;

          showToast(`Account created! Welcome to the portal, ${authResult.user.name}!`, 'fa-user-check');
          navigateTo(`/${authResult.user.role}`);
        } catch (err) {
          state.loginForm.isSubmitting = false;
          state.loginForm.errorMessage = err.message || 'Registration failed. Please try again.';
          render();
        }
      });
    }

    // Login Form Submit Handler
    const loginFormEl = document.getElementById('loginAuthForm');
    if (loginFormEl) {
      loginFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();

        const role = state.loginForm.selectedRole || document.getElementById('loginRole')?.value;
        const email = state.loginForm.email || document.getElementById('loginEmail')?.value;
        const password = state.loginForm.password || document.getElementById('loginPassword')?.value;

        if (!role) {
          state.loginForm.errorMessage = 'Please select how you want to log in.';
          render();
          return;
        }
        if (!email || !email.includes('@')) {
          state.loginForm.errorMessage = 'Please enter a valid email address.';
          render();
          return;
        }
        if (!password) {
          state.loginForm.errorMessage = 'Please enter your password.';
          render();
          return;
        }

        try {
          state.loginForm.isSubmitting = true;
          state.loginForm.errorMessage = null;
          render();

          const authResult = await apiService.login({
            selectedRole: role,
            email,
            password
          });

          state.currentUser = authResult.user;
          state.currentRole = authResult.user.role;
          state.loginForm.isSubmitting = false;

          showToast(`Welcome back, ${authResult.user.name}!`);
          navigateTo(`/${authResult.user.role}`);
        } catch (err) {
          state.loginForm.isSubmitting = false;
          state.loginForm.errorMessage = err.message || 'The email or password you entered is incorrect.';
          render();
        }
      });
    }
  }

  // Dashboard Workspace Handlers (For Authenticated Users)
  if (['/associate', '/mentor', '/admin'].includes(state.currentPath)) {
    // Search Bar
    const searchInput = document.getElementById('headerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const cursorPos = e.target.selectionStart;
        state.searchQuery = val;

        const role = state.currentUser ? state.currentUser.role : state.currentRole;
        if (role === 'associate' && state.associateTab !== 'mentors' && val.trim() !== '') {
          state.associateTab = 'mentors';
        }

        render();

        const newInput = document.getElementById('headerSearchInput');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(cursorPos, cursorPos);
        }
      });
    }

    // Navigation Tabs
    document.querySelectorAll('.subnav-link').forEach(link => {
      link.addEventListener('click', () => {
        const tab = link.dataset.tab;
        const role = state.currentUser ? state.currentUser.role : state.currentRole;
        if (role === 'associate') state.associateTab = tab;
        else if (role === 'mentor') state.mentorTab = tab;
        else if (role === 'admin') state.adminTab = tab;
        render();
      });
    });

    // Hero CTAs inside Associate Dashboard
    document.getElementById('btnHeroFindMentors')?.addEventListener('click', () => { state.associateTab = 'mentors'; render(); });
    document.getElementById('btnHeroExploreMentors')?.addEventListener('click', () => { state.associateTab = 'mentors'; render(); });
    document.getElementById('btnHomeBookSession')?.addEventListener('click', () => { state.associateTab = 'mentors'; render(); });
    document.getElementById('btnHeroGroupSessions')?.addEventListener('click', () => { state.associateTab = 'group_sessions'; render(); });

    // Associate Profile Photo File Upload Listener
    const profileAvatarInput = document.getElementById('profileAvatarInput');
    if (profileAvatarInput) {
      profileAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressImageFile(file, (compressedDataUrl) => {
            if (state.currentUser) state.currentUser.avatar = compressedDataUrl;
            const preview = document.getElementById('profileAvatarPreview');
            if (preview) preview.src = compressedDataUrl;
            showToast('New profile photo selected!', 'fa-image');
          });
        }
      });
    }

    // Associate Profile Save Submit Handler
    document.getElementById('formEditMenteeProfile')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('editProfileName')?.value;
      const email = document.getElementById('editProfileEmail')?.value;
      const institution = document.getElementById('editProfileOrg')?.value;
      const title = document.getElementById('editProfileTitle')?.value;
      const track = document.getElementById('editProfileTrack')?.value;
      const bio = document.getElementById('editProfileBio')?.value;
      const gender = document.getElementById('editProfileGender')?.value;

      if (state.currentUser) {
        state.currentUser.name = name || state.currentUser.name;
        state.currentUser.email = email || state.currentUser.email;
        state.currentUser.institution = institution || state.currentUser.institution;
        state.currentUser.organization = institution || state.currentUser.organization;
        state.currentUser.title = title || state.currentUser.title;
        state.currentUser.track = track || state.currentUser.track;
        state.currentUser.bio = bio || state.currentUser.bio;
        if (gender) state.currentUser.gender = gender;
        localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
        // Also persist to Supabase if available
        apiService.updateAssociateProfile && apiService.updateAssociateProfile(state.currentUser.id, { name, email, institution, title, track, bio, gender }).catch(() => {});
      }

      showToast('Profile updated successfully!', 'fa-circle-check');
      render();
    });

    // Notifications
    document.getElementById('btnToggleNotifications')?.addEventListener('click', () => {
      state.isNotificationOpen = !state.isNotificationOpen;
      render();
    });
    document.getElementById('btnCloseNotifications')?.addEventListener('click', () => {
      state.isNotificationOpen = false;
      render();
    });

    // Domain Filter Checkboxes
    document.querySelectorAll('.domain-filter-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const val = cb.value;
        if (cb.checked) state.selectedDomains.push(val);
        else state.selectedDomains = state.selectedDomains.filter(d => d !== val);
        render();
      });
    });

    document.getElementById('btnClearFilters')?.addEventListener('click', () => {
      state.selectedDomains = [];
      state.searchQuery = '';
      render();
    });

    // View Mentor Profile Modal
    document.querySelectorAll('.btn-inspect-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = state.mentors.find(x => x.id === btn.dataset.id);
        state.inspectingMentor = m;
        state.activeModal = 'mentor_profile';
        render();
      });
    });

    // Book 1-on-1 Slot Modal
    document.querySelectorAll('.btn-book-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = state.mentors.find(x => x.id === btn.dataset.id);
        state.bookingMentor = m;
        state.activeModal = 'booking';
        const availableSlot = m.schedule.find(s => !s.isBooked);
        if (availableSlot) {
          state.bookingData.date = availableSlot.date;
          state.bookingData.time = availableSlot.time;
        }
        render();
      });
    });

    // Slot Picker Buttons in Modal
    document.querySelectorAll('.slot-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.bookingData.date = btn.dataset.date;
        state.bookingData.time = btn.dataset.time;
        render();
      });
    });

    // Confirm Booking Submit
    document.getElementById('btnConfirmBookingSubmit')?.addEventListener('click', async () => {
      const activeAssoc = state.associates[state.currentAssociateIndex];
      const objInput = document.getElementById('bookingObjectiveInput');
      const objective = objInput ? objInput.value : state.bookingData.objective;

      if (!state.bookingData.date || !state.bookingData.time) {
        showToast('Please select a date and time slot.', 'fa-circle-exclamation');
        return;
      }

      await apiService.createBookingSession({
        associateId: activeAssoc.id,
        associateName: activeAssoc.name,
        mentorId: state.bookingMentor.id,
        mentorName: state.bookingMentor.name,
        mentorDomain: state.bookingMentor.domain,
        date: state.bookingData.date,
        time: state.bookingData.time,
        duration: '1 Hour',
        objective: objective || 'Strategic career guidance session.',
        consentToRecord: true
      });

      state.activeModal = null;
      showToast('Session booked successfully!');
      await initAppData();
    });

    // Join Group Session
    document.querySelectorAll('.btn-join-group').forEach(btn => {
      btn.addEventListener('click', async () => {
        const activeAssoc = state.associates[state.currentAssociateIndex];
        await apiService.joinGroupSession(btn.dataset.id, activeAssoc.name);
        showToast('Enrolled in Group Masterclass!');
        await initAppData();
      });
    });

    // Complete Task
    document.querySelectorAll('.btn-complete-task').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiService.updateTaskStatus(btn.dataset.id, 'Completed');
        showToast('Task marked as completed!');
        await initAppData();
      });
    });

    // Mentor Add Availability Slot
    document.getElementById('btnAddSlotSubmit')?.addEventListener('click', async () => {
      const activeMentor = (state.currentUser && state.currentUser.role === 'mentor') 
        ? state.currentUser 
        : (state.mentors[state.currentMentorIndex] || state.mentors[0]);

      const dateInput = document.getElementById('inputSlotDate');
      const timeInput = document.getElementById('inputSlotTime');

      if (dateInput && timeInput && dateInput.value && timeInput.value) {
        const newSlot = { date: dateInput.value, time: timeInput.value, isBooked: false, bookedBy: null };

        if (!activeMentor.schedule) activeMentor.schedule = [];
        activeMentor.schedule.push(newSlot);

        const matchInState = state.mentors.find(m => m.id === activeMentor.id || m.email === activeMentor.email);
        if (matchInState) {
          if (!matchInState.schedule) matchInState.schedule = [];
          matchInState.schedule.push(newSlot);
        }

        if (state.currentUser && state.currentUser.role === 'mentor') {
          localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
        }

        await apiService.addMentorSlot(activeMentor.id, { date: dateInput.value, time: timeInput.value });
        showToast('Open time slot added to your schedule!', 'fa-circle-check');
        render();
      }
    });

    // Mentor Remove Slot
    document.querySelectorAll('.btn-remove-slot').forEach(btn => {
      btn.addEventListener('click', async () => {
        const activeMentor = (state.currentUser && state.currentUser.role === 'mentor') 
          ? state.currentUser 
          : (state.mentors[state.currentMentorIndex] || state.mentors[0]);
        const idx = parseInt(btn.dataset.idx, 10);

        if (activeMentor.schedule && activeMentor.schedule[idx]) {
          activeMentor.schedule.splice(idx, 1);
          const matchInState = state.mentors.find(m => m.id === activeMentor.id || m.email === activeMentor.email);
          if (matchInState && matchInState.schedule) {
            matchInState.schedule.splice(idx, 1);
          }
          if (state.currentUser && state.currentUser.role === 'mentor') {
            localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
          }
          await apiService.removeMentorSlot(activeMentor.id, idx);
          showToast('Slot removed!', 'fa-trash');
          render();
        }
      });
    });

    // Mentor Accept Session (Triggers Email & iCal Calendar Invites)
    document.querySelectorAll('.btn-accept-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        const session = state.sessions.find(s => s.id === btn.dataset.id);
        await apiService.acceptBookingSession(btn.dataset.id);

        const assocEmail = session ? session.associateName : 'Associate';
        showToast(`📧 Session Accepted! Confirmation email & calendar invite sent to ${assocEmail}!`, 'fa-envelope-circle-check');
        await initAppData();
      });
    });

    // Mentor Edit Profile
    document.getElementById('btnEditMyProfile')?.addEventListener('click', () => {
      const activeMentor = (state.currentUser && state.currentUser.role === 'mentor') ? state.currentUser : state.mentors[state.currentMentorIndex];
      state.editingMentorProfile = activeMentor;
      state.activeModal = 'edit_mentor_profile';
      render();
    });

    // Mentor Avatar Photo Upload Handler
    const editMentorAvatarInput = document.getElementById('editMentorAvatarInput');
    if (editMentorAvatarInput) {
      editMentorAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressImageFile(file, (compressedDataUrl) => {
            if (state.editingMentorProfile) state.editingMentorProfile.avatar = compressedDataUrl;
            if (state.currentUser) state.currentUser.avatar = compressedDataUrl;
            const preview = document.getElementById('editMentorAvatarPreview');
            if (preview) preview.src = compressedDataUrl;
            showToast('New executive headshot photo selected!', 'fa-image');
          });
        }
      });
    }

    document.getElementById('btnSaveMentorProfileSubmit')?.addEventListener('click', async () => {
      const activeMentor = state.mentors[state.currentMentorIndex];
      const name = document.getElementById('editMentorName')?.value || activeMentor.name;
      const avatar = document.getElementById('editMentorAvatar')?.value || activeMentor.avatar;
      const title = document.getElementById('editMentorTitle')?.value || activeMentor.title;
      const organization = document.getElementById('editMentorOrg')?.value || activeMentor.organization;
      const domain = document.getElementById('editMentorDomain')?.value || activeMentor.domain;
      const bio = document.getElementById('editMentorBio')?.value || activeMentor.bio;
      const expRaw = document.getElementById('editMentorExpertise')?.value || '';
      const expertise = expRaw.split(',').map(s => s.trim()).filter(Boolean);

      const linkedin = document.getElementById('editMentorLinkedIn')?.value || '';
      const github = document.getElementById('editMentorGitHub')?.value || '';
      const twitter = document.getElementById('editMentorTwitter')?.value || '';

      const gender = document.getElementById('editMentorGender')?.value || activeMentor.gender || '';

      await apiService.updateMentorProfile(activeMentor.id, {
        name,
        avatar,
        title,
        organization,
        domain,
        bio,
        gender,
        expertise,
        socialLinks: { linkedin, github, twitter }
      });

      state.activeModal = null;
      showToast('Mentor profile updated successfully!');
      await initAppData();
    });

    // Create Group Masterclass Modal
    document.getElementById('btnOpenCreateGroupModal')?.addEventListener('click', () => {
      state.activeModal = 'group_create';
      render();
    });

    document.getElementById('btnSubmitCreateGroup')?.addEventListener('click', async () => {
      const activeMentor = state.mentors[state.currentMentorIndex];
      const title = document.getElementById('createGroupTitle')?.value;
      const domain = document.getElementById('createGroupDomain')?.value;
      const description = document.getElementById('createGroupDescription')?.value;
      const date = document.getElementById('createGroupDate')?.value;
      const startTime = document.getElementById('createGroupStartTime')?.value;
      const endTime = document.getElementById('createGroupEndTime')?.value;
      const maxCapacity = parseInt(document.getElementById('createGroupMaxCapacity')?.value || 20, 10);

      if (!title || !description || !date) {
        showToast('Please fill out all required fields for the group session.', 'fa-circle-exclamation');
        return;
      }

      await apiService.createGroupSession({
        mentorId: activeMentor.id,
        mentorName: activeMentor.name,
        mentorTitle: activeMentor.title,
        mentorAvatar: activeMentor.avatar,
        title,
        domain,
        description,
        date,
        startTime: startTime || '04:00 PM',
        endTime: endTime || '05:00 PM',
        duration: '60 mins',
        maxCapacity
      });

      state.activeModal = null;
      showToast('Group Masterclass created and published successfully!');
      await initAppData();
    });

    // Assign Mentee Task Modal
    document.getElementById('btnOpenCreateTaskModal')?.addEventListener('click', () => {
      state.newTaskData.selectedAssociateIds = state.associates.length > 0 ? [state.associates[0].id] : [];
      state.newTaskData.searchQuery = '';
      state.activeModal = 'task_create';
      render();
    });

    const taskSearchInput = document.getElementById('taskAssociateSearchInput');
    if (taskSearchInput) {
      taskSearchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const cursorPos = e.target.selectionStart;
        state.newTaskData.searchQuery = val;
        render();
        const newInput = document.getElementById('taskAssociateSearchInput');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(cursorPos, cursorPos);
        }
      });
    }

    document.querySelectorAll('.task-associate-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const val = cb.value;
        let selected = state.newTaskData.selectedAssociateIds || [];
        if (cb.checked) {
          if (!selected.includes(val)) selected.push(val);
        } else {
          selected = selected.filter(id => id !== val);
        }
        state.newTaskData.selectedAssociateIds = selected;
        render();
      });
    });

    document.getElementById('btnToggleSelectAllTasks')?.addEventListener('click', () => {
      const selected = state.newTaskData.selectedAssociateIds || [];
      if (selected.length === state.associates.length) {
        state.newTaskData.selectedAssociateIds = [];
      } else {
        state.newTaskData.selectedAssociateIds = state.associates.map(a => a.id);
      }
      render();
    });

    document.getElementById('btnSubmitCreateTask')?.addEventListener('click', async () => {
      const activeMentor = state.mentors[state.currentMentorIndex];
      const selectedIds = state.newTaskData.selectedAssociateIds || [];
      const title = document.getElementById('createTaskTitle')?.value;
      const description = document.getElementById('createTaskDescription')?.value;
      const deadline = document.getElementById('createTaskDeadline')?.value;

      if (selectedIds.length === 0) {
        showToast('Please select at least one associate for this task.', 'fa-circle-exclamation');
        return;
      }

      if (!title || !description || !deadline) {
        showToast('Please fill out all required task fields.', 'fa-circle-exclamation');
        return;
      }

      const selectedAssociates = state.associates.filter(a => selectedIds.includes(a.id));

      await Promise.all(selectedAssociates.map(assoc => 
        apiService.createTask({
          mentorId: activeMentor.id,
          mentorName: activeMentor.name,
          associateId: assoc.id,
          associateName: assoc.name,
          title,
          description,
          deadline
        })
      ));

      state.activeModal = null;
      state.newTaskData.selectedAssociateIds = [];
      state.newTaskData.searchQuery = '';
      showToast(`Task successfully assigned to ${selectedAssociates.length} mentee${selectedAssociates.length === 1 ? '' : 's'}!`);
      await initAppData();
    });

    // Admin Clickable KPI Cards & Filter Pill Buttons Handler
    document.querySelectorAll('.btn-admin-kpi-card, .btn-admin-kpi-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.adminActiveTable = btn.dataset.table;
        render();
        document.getElementById('adminAnalyticsTableContainer')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Dynamic Calendar From Date Listener
    document.getElementById('inputAdminDateFrom')?.addEventListener('change', (e) => {
      state.adminDateFrom = e.target.value;
      state.adminDatePreset = 'custom';
      render();
    });

    // Dynamic Calendar To Date Listener
    document.getElementById('inputAdminDateTo')?.addEventListener('change', (e) => {
      state.adminDateTo = e.target.value;
      state.adminDatePreset = 'custom';
      render();
    });

    // Quick Date Preset Pills Handler
    document.querySelectorAll('.btn-admin-date-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        state.adminDatePreset = preset;
        const todayStr = '2026-08-16';

        if (preset === 'this_month') {
          state.adminDateFrom = '2026-08-01';
          state.adminDateTo = '2026-08-31';
        } else if (preset === 'last_30') {
          state.adminDateFrom = '2026-07-17';
          state.adminDateTo = '2026-08-16';
        } else if (preset === 'this_week') {
          state.adminDateFrom = '2026-08-10';
          state.adminDateTo = '2026-08-16';
        } else if (preset === 'all_time') {
          state.adminDateFrom = '2026-01-01';
          state.adminDateTo = '2026-12-31';
        }
        render();
      });
    });

    // Admin Rows Per Page Select Handler
    document.getElementById('selectAdminRowsPerPage')?.addEventListener('change', (e) => {
      state.adminRowsPerPage = parseInt(e.target.value, 10);
      render();
    });

    // Admin Export Table to CSV Handler
    document.getElementById('btnExportAdminCSV')?.addEventListener('click', () => {
      exportAdminTableToCSV(state.adminActiveTable || 'mentees');
    });

    // Admin Filter by Mentor Dropdown Listener
    document.getElementById('selectAdminSessionMentor')?.addEventListener('change', (e) => {
      state.adminSessionMentorFilter = e.target.value;
      render();
    });

    // Admin Sessions Live Search Input Listener
    document.getElementById('inputAdminSessionSearch')?.addEventListener('input', (e) => {
      state.adminSessionSearchQuery = e.target.value;
      const tableContainer = document.getElementById('adminAnalyticsTableContainer');
      if (tableContainer && state.adminActiveTable === 'sessions') {
        tableContainer.innerHTML = renderAdminSessionLogs();
      }
    });

    // Admin Reset Session Filter Handler
    document.getElementById('btnResetAdminSessionFilter')?.addEventListener('click', () => {
      state.adminSessionMentorFilter = 'ALL';
      state.adminSessionSearchQuery = '';
      render();
    });

    // Admin Mentee Search Input Listener
    document.getElementById('inputAdminMenteeSearch')?.addEventListener('input', (e) => {
      state.adminMenteeSearchQuery = e.target.value;
      const tableContainer = document.getElementById('adminAnalyticsTableContainer');
      if (tableContainer) {
        tableContainer.innerHTML = renderAdminSelectedTable('mentees');
      }
    });

    // Admin Edit Mentor Cap
    document.querySelectorAll('.btn-edit-cap').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = state.mentors.find(x => x.id === btn.dataset.id);
        state.editingCapMentor = m;
        state.activeModal = 'admin_cap';
        render();
      });
    });

    document.getElementById('btnSaveCapSubmit')?.addEventListener('click', async () => {
      const capInput = document.getElementById('inputNewMentorCap');
      if (capInput && state.editingCapMentor) {
        await apiService.updateMentorMonthlyCap(state.editingCapMentor.id, capInput.value);
        state.activeModal = null;
        showToast('Monthly session cap updated!');
        await initAppData();
      }
    });

    // Close Modal Buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeModal = null;
        render();
      });
    });
  }
}

// Initial Kickoff
initAppData();
