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
  associateTab: 'home',               // 'home' | 'mentors' | 'group_sessions' | 'tasks' | 'sessions' | 'profile'
  mentorTab: 'dashboard',             // 'dashboard' | 'availability' | 'group_sessions' | 'tasks' | 'profile'
  adminTab: 'analytics',              // 'analytics' | 'mentors' | 'sessions' | 'profile'

  currentAssociateIndex: 0,
  currentMentorIndex: 0,
  googleUser: initialUser && initialUser.role === 'mentor' ? initialUser : null,

  isNotificationOpen: false,
  isMobileNavOpen: false,
  isLoadingData: true,

  // Search & Filter State
  landingDomainFilter: 'All',         // 'All' | 'Software Engineering & AI' | ...
  searchQuery: '',
  selectedDomains: [],
  selectedSessionType: 'all',
  onlyAvailableThisWeek: false,

  // Login Form State
  loginForm: {
    selectedRole: '',
    email: '',
    password: '',
    showPassword: false,
    isSubmitting: false,
    errorMessage: null
  },

  // Modal State
  activeModal: null,                 // null | 'booking' | 'mentor_profile' | 'group_create' | 'task_create' | 'admin_cap' | 'edit_mentor_profile' | 'manage_availability'
  bookingMentor: null,
  inspectingMentor: null,
  inspectingSession: null,
  editingCapMentor: null,
  editingMentorProfile: null,

  availabilityModal: {
    year: 2026,
    month: 7,                        // August 2026 (0-indexed: 7)
    selectedDates: ['2026-08-14'],
    timeRanges: [
      { id: 1, startTime: '09:00 AM', endTime: '10:00 AM' },
      { id: 2, startTime: '01:00 PM', endTime: '02:00 PM' }
    ]
  },

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
    const [associates, mentors, sessions, groupSessions, tasks, notifications] = await Promise.all([
      apiService.getAssociates(),
      apiService.getMentors(),
      apiService.getSessions(),
      apiService.getGroupSessions(),
      apiService.getTasks(),
      apiService.getNotifications()
    ]);

    state.associates = associates || [];
    state.mentors = mentors || [];
    state.sessions = sessions || [];
    state.groupSessions = groupSessions || [];
    state.tasks = tasks || [];
    state.notifications = notifications || [];
  } catch (err) {
    console.error('Data load failure:', err);
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
        <div class="brand-wrapper" style="cursor: pointer;" id="btnNavBrandHome">
          <img src="/assets/jobberman-logo.png" alt="Jobberman Logo" class="brand-logo-img" />
          <div class="brand-text">
            <span class="brand-name" style="font-size: 1.1rem; line-height: 1.2;">Mastercard Foundation Associate Program</span>
            <span class="brand-tagline">ASSOCIATE MENTORSHIP PORTAL</span>
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
                  <div style="font-weight: 900; font-size: 1rem; color: var(--text-primary);">4,120+ Associates</div>
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
            <p class="public-section-sub">Empowering associates with world-class mentorship, technical guidance, and leadership acceleration.</p>
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
            <div class="brand-wrapper">
              <img src="/assets/jobberman-logo.png" alt="Jobberman Logo" class="brand-logo-img" />
              <div class="brand-text">
                <span class="brand-name" style="font-size: 1.05rem;">Mastercard Foundation Associate Program</span>
                <span class="brand-tagline">ASSOCIATE MENTORSHIP PORTAL</span>
              </div>
            </div>

            <div style="display: flex; gap: 1.5rem; font-size: 0.88rem;">
              <a class="public-nav-link" id="footerLinkHome">Home</a>
              <a class="public-nav-link" id="footerLinkMentors">Find Mentors</a>
              <a class="public-nav-link" id="footerLinkLogin">Login</a>
            </div>
          </div>

          <div class="footer-bottom">
            © 2026 Mastercard Foundation Associate Program. All rights reserved.
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
        <img src="${m.avatar}" class="mentor-avatar-lg" />
        <div>
          <div class="mentor-name">${m.name}</div>
          <div class="mentor-title">${m.title}</div>
          <div class="mentor-org">${m.organization}</div>
        </div>
      </div>

      <div class="card-tags-flex">
        <span class="badge-tag badge-blue"><i class="fa-solid fa-briefcase"></i> ${m.domain}</span>
        <span class="badge-tag badge-gold"><i class="fa-solid fa-star"></i> ${m.rating} (${m.totalSessions} sessions)</span>
      </div>

      <div class="card-footer">
        <button class="btn-brand-primary btn-inspect-profile" data-id="${m.id}">View Profile</button>
        <button class="btn-brand-primary btn-landing-book" data-id="${m.id}" style="background: var(--brand-violet);">Book Session</button>
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
          <img src="/assets/jobberman-logo.png" alt="Jobberman Logo" class="brand-logo-img" />
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
            <h1 class="login-banner-title">Empowering Associates<br/>Across Africa</h1>
            <p style="font-size: 1rem; opacity: 0.9; line-height: 1.6; max-width: 440px;">
              Join thousands of associates connecting with global leaders in AI, Fintech, Public Health, and Cloud Architecture.
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

        <!-- Right Side: Login Card Form -->
        <div class="login-card-side">
          <div class="login-card">
            
            <div class="login-card-header">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--badge-blue-bg); color: var(--brand-primary); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin: 0 auto 1rem auto;">
                <i class="fa-solid fa-lock"></i>
              </div>
              <h2 class="login-card-title">Welcome Back</h2>
              <p class="login-card-sub">Sign in to access your mentorship portal.</p>
            </div>

            <!-- Error Alert -->
            ${form.errorMessage ? `
              <div class="login-error-alert" id="loginErrorAlert">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 1.1rem; margin-top: 0.1rem;"></i>
                <div>${form.errorMessage}</div>
              </div>
            ` : ''}

            <!-- 3-Field Login Form -->
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
            </form>

            <!-- Quick Demo Credentials Helper -->
            <div class="demo-credentials-box">
              <div style="font-weight: 800; color: var(--text-secondary);">Need test credentials? Click to fill:</div>
              <div class="demo-cred-buttons">
                <button type="button" class="demo-cred-btn" data-role="associate" data-email="amina.kwame@ashesi.edu.gh">Associate</button>
                <button type="button" class="demo-cred-btn" data-role="mentor" data-email="samuel.osei@mcf-mentors.org">Mentor</button>
                <button type="button" class="demo-cred-btn" data-role="admin" data-email="admin@mcf-portal.org">Admin</button>
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
      <div style="display: flex; align-items: center; gap: 1rem;">
        <!-- Mobile Navigation Menu Toggle Button -->
        <button class="btn-icon-circle btn-mobile-nav-toggle" id="btnMobileNavToggle" title="Toggle Navigation Menu">
          <i class="fa-solid ${state.isMobileNavOpen ? 'fa-xmark' : 'fa-bars'}"></i>
        </button>

        <div class="brand-wrapper" style="cursor: pointer;" id="btnNavBrandHome">
          <img src="/assets/jobberman-logo.png" alt="Jobberman Logo" class="brand-logo-img" />
          <div class="brand-text">
            <span class="brand-name" style="font-size: 1.1rem; line-height: 1.2;">Mastercard Foundation Associate Program</span>
            <span class="brand-tagline">ASSOCIATE MENTORSHIP PORTAL</span>
          </div>
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
          <div class="auth-user-info">
            <span class="auth-user-name">${user?.name || 'User'}</span>
            <span class="auth-user-role role-${(user?.role || state.currentRole).toLowerCase()}" style="color: ${(user?.role || state.currentRole).toLowerCase() === 'mentor' ? '#D97706' : (user?.role || state.currentRole).toLowerCase() === 'admin' ? '#7C3AED' : '#2563EB'} !important;">
              ${(user?.role || state.currentRole).charAt(0).toUpperCase() + (user?.role || state.currentRole).slice(1)}
            </span>
          </div>
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

    <!-- Mobile Navigation Backdrop Overlay -->
    <div class="sidebar-backdrop ${state.isMobileNavOpen ? 'active' : ''}" id="sidebarBackdrop"></div>

    <!-- Main Workspace Layout with Vertical Navigation Sidebar -->
    <div class="portal-app-wrapper">
      ${renderVerticalSidebar()}

      <!-- Main Content Area -->
      <main class="portal-main-view">
        ${renderRoleView(activeAssociate, activeMentor)}
      </main>
    </div>

    <!-- Active Modals -->
    ${renderModals()}
  `;
}

// Render Vertical Navigation Sidebar
function renderVerticalSidebar() {
  const role = state.currentUser ? state.currentUser.role : state.currentRole;

  let linksHtml = '';
  if (role === 'associate') {
    linksHtml = `
      <button class="nav-sidebar-link ${state.associateTab === 'home' ? 'active' : ''}" data-tab="home">
        <i class="fa-solid fa-house"></i> <span>Home</span>
      </button>
      <button class="nav-sidebar-link ${state.associateTab === 'mentors' ? 'active' : ''}" data-tab="mentors">
        <i class="fa-solid fa-user-group"></i> <span>Find Mentors</span>
      </button>
      <button class="nav-sidebar-link ${state.associateTab === 'group_sessions' ? 'active' : ''}" data-tab="group_sessions">
        <i class="fa-solid fa-users"></i> <span>Group Sessions</span>
      </button>
      <button class="nav-sidebar-link ${state.associateTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
        <i class="fa-solid fa-list-check"></i> <span>Tasks</span>
      </button>
      <button class="nav-sidebar-link ${state.associateTab === 'sessions' ? 'active' : ''}" data-tab="sessions">
        <i class="fa-regular fa-calendar-check"></i> <span>My Sessions</span>
      </button>
      <button class="nav-sidebar-link ${state.associateTab === 'profile' ? 'active' : ''}" data-tab="profile">
        <i class="fa-regular fa-user"></i> <span>Profile</span>
      </button>
    `;
  } else if (role === 'mentor') {
    linksHtml = `
      <button class="nav-sidebar-link ${state.mentorTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
        <i class="fa-solid fa-chart-line"></i> <span>Dashboard</span>
      </button>
      <button class="nav-sidebar-link ${state.mentorTab === 'availability' ? 'active' : ''}" data-tab="availability">
        <i class="fa-regular fa-clock"></i> <span>1-on-1 Slots</span>
      </button>
      <button class="nav-sidebar-link ${state.mentorTab === 'group_sessions' ? 'active' : ''}" data-tab="group_sessions">
        <i class="fa-solid fa-users"></i> <span>Group Masterclasses</span>
      </button>
      <button class="nav-sidebar-link ${state.mentorTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
        <i class="fa-solid fa-tasks"></i> <span>Mentee Tasks</span>
      </button>
      <button class="nav-sidebar-link ${state.mentorTab === 'profile' ? 'active' : ''}" data-tab="profile">
        <i class="fa-regular fa-user"></i> <span>Profile</span>
      </button>
    `;
  } else {
    linksHtml = `
      <button class="nav-sidebar-link ${state.adminTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
        <i class="fa-solid fa-chart-pie"></i> <span>Programme Overview</span>
      </button>
      <button class="nav-sidebar-link ${state.adminTab === 'mentors' ? 'active' : ''}" data-tab="mentors">
        <i class="fa-solid fa-sliders"></i> <span>Mentor Caps & Onboarding</span>
      </button>
      <button class="nav-sidebar-link ${state.adminTab === 'sessions' ? 'active' : ''}" data-tab="sessions">
        <i class="fa-solid fa-video"></i> <span>Session Audit Logs</span>
      </button>
      <button class="nav-sidebar-link ${state.adminTab === 'profile' ? 'active' : ''}" data-tab="profile">
        <i class="fa-regular fa-user"></i> <span>Profile</span>
      </button>
    `;
  }

  return `
    <aside class="portal-sidebar-nav ${state.isMobileNavOpen ? 'mobile-open' : ''}">
      <div class="portal-sidebar-menu">
        ${linksHtml}
      </div>

      <div class="sidebar-bottom-help">
        <button class="nav-sidebar-link" id="btnSidebarHelp">
          <i class="fa-regular fa-circle-question"></i> <span>Help & Support</span>
        </button>
      </div>
    </aside>
  `;
}

// Render User Profile Overview
function renderUserProfileOverview() {
  const user = state.currentUser || state.associates[state.currentAssociateIndex] || { name: 'Mastercard Associate', email: 'associate@mcf-portal.org', role: 'associate' };
  const role = user.role || state.currentRole;

  return `
    <div class="content-area" style="width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">My Profile Overview</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Manage your account details and mentorship preferences.</p>
        </div>
        <button class="btn-brand-primary" id="btnEditUserProfile" style="padding: 0.45rem 1rem; font-size: 0.82rem;">
          <i class="fa-solid fa-pen-to-square"></i> Edit Profile
        </button>
      </div>

      <div class="mentor-card" style="max-width: 680px;">
        <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-primary);" />
          <div>
            <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 800;">${user.name}</h3>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.2rem;">${user.title || user.email}</div>
            ${user.organization ? `<div style="font-size: 0.82rem; color: var(--brand-primary); font-weight: 700; margin-top: 0.2rem;">${user.organization}</div>` : ''}
            <span class="badge-tag badge-blue" style="margin-top: 0.5rem; display: inline-block; text-transform: capitalize;">${role}</span>
          </div>
        </div>

        ${user.bio ? `
          <div style="margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
            <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">Bio & Objectives</h4>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">${user.bio}</p>
          </div>
        ` : ''}

        ${user.expertise && user.expertise.length > 0 ? `
          <div style="margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
            <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">Expertise / Focus Areas</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${user.expertise.map(e => `<span class="badge-tag badge-blue">${e}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div style="display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.9rem;">
          <div><strong>Email Address:</strong> ${user.email}</div>
          <div><strong>Program:</strong> Mastercard Foundation Associates Program</div>
          <div><strong>Status:</strong> Active Associate & Fellow</div>
        </div>
      </div>
    </div>
  `;
}

// Render View by Role
function renderRoleView(associate, mentor) {
  const role = state.currentUser ? state.currentUser.role : state.currentRole;
  if (role === 'associate') {
    if (state.associateTab === 'home') return renderMenteeHome(associate);
    if (state.associateTab === 'mentors') return renderMenteeDiscovery();
    if (state.associateTab === 'group_sessions') return renderGroupSessionsList();
    if (state.associateTab === 'tasks') return renderMenteeTasksList();
    if (state.associateTab === 'sessions') return renderMenteeSessionsList();
    if (state.associateTab === 'profile') return renderUserProfileOverview();
  } else if (role === 'mentor') {
    if (state.mentorTab === 'dashboard') return renderMentorDashboard(mentor);
    if (state.mentorTab === 'availability') return renderMentorAvailability(mentor);
    if (state.mentorTab === 'group_sessions') return renderMentorGroupSessions(mentor);
    if (state.mentorTab === 'tasks') return renderMentorTasks(mentor);
    if (state.mentorTab === 'profile') return renderUserProfileOverview();
  } else if (role === 'admin') {
    if (state.adminTab === 'analytics') return renderAdminAnalytics();
    if (state.adminTab === 'mentors') return renderAdminMentorManagement();
    if (state.adminTab === 'sessions') return renderAdminSessionLogs();
    if (state.adminTab === 'profile') return renderUserProfileOverview();
  }
}

// --------------------------------------------------------------------------
// MENTEE VIEWS
// --------------------------------------------------------------------------
function renderMenteeHome(associate) {
  const nextSession = state.sessions.find(s => s.status === 'Accepted');
  return `
    <div style="width: 100%;">
      <!-- Hero Banner -->
      <div class="mently-hero-banner">
        <div class="hero-pill-badge"><i class="fa-solid fa-star"></i> Mastercard Foundation Associate Program</div>
        <h1 class="hero-title">Your growth starts with the right conversation.</h1>
        <p class="hero-subtitle">Connect with experienced industry leaders, book 1-on-1 strategic sessions, and participate in peer masterclasses to accelerate your career.</p>
        <div class="hero-actions">
          <button class="btn-brand-primary" id="btnHeroFindMentors"><i class="fa-solid fa-magnifying-glass"></i> Find a Mentor</button>
          <button class="btn-brand-secondary" id="btnHeroGroupSessions"><i class="fa-solid fa-users"></i> Explore Masterclasses</button>
        </div>
      </div>

      <!-- Welcome Card -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
        <div class="mentor-card">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <img src="${associate.avatar}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand-primary);" />
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800;">Welcome back, ${associate.name} 👋</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary);">${associate.title}</p>
            </div>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">${associate.bio}</p>
        </div>

        <!-- Next Session Quick Card -->
        <div class="mentor-card" style="border-left: 4px solid var(--brand-primary);">
          <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); margin-bottom: 0.5rem;">Upcoming Session</div>
          ${nextSession ? `
            <div style="font-weight: 800; font-size: 1rem; margin-bottom: 0.2rem;">${nextSession.mentorName}</div>
            <div style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 0.8rem;">
              <i class="fa-regular fa-calendar"></i> ${nextSession.date} · ${nextSession.time}
            </div>
            <a href="${nextSession.meetingLink}" target="_blank" class="btn-brand-primary" style="padding: 0.45rem 1rem; font-size: 0.8rem;"><i class="fa-solid fa-video"></i> Join Zoho Meet</a>
          ` : `
            <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 1rem;">No accepted sessions right now.</p>
            <button class="btn-brand-primary" id="btnQuickBook" style="padding: 0.45rem 1rem; font-size: 0.8rem;">Book 1-on-1</button>
          `}
        </div>
      </div>

      <!-- Featured Mentors Section -->
      <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; margin-bottom: 1.25rem;">Featured Mentors</h2>
      <div class="cards-grid">
        ${state.mentors.slice(0, 3).map(m => renderMentorCard(m)).join('')}
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
  const availableSlot = mentor.schedule ? mentor.schedule.find(s => !s.isBooked) : null;
  return `
    <div class="mentor-card">
      <div class="card-header-flex">
        <img src="${mentor.avatar}" class="mentor-avatar-lg" />
        <div>
          <div class="mentor-name">${mentor.name}</div>
          <div class="mentor-title">${mentor.title}</div>
          <div class="mentor-org">${mentor.organization}</div>
        </div>
      </div>

      <div class="card-tags-flex">
        <span class="badge-tag badge-blue"><i class="fa-solid fa-briefcase"></i> ${mentor.domain}</span>
        <span class="badge-tag badge-gold"><i class="fa-solid fa-star"></i> ${mentor.rating} (${mentor.totalSessions} sessions)</span>
        ${availableSlot ? `<span class="badge-tag badge-green"><i class="fa-regular fa-circle-check"></i> Available ${availableSlot.date}</span>` : ''}
      </div>

      <div class="card-footer">
        <button class="btn-brand-primary btn-inspect-profile" data-id="${mentor.id}">View Profile</button>
        <button class="btn-brand-primary btn-book-slot" data-id="${mentor.id}" style="background: var(--brand-violet);">Book 1-on-1</button>
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
                <img src="${g.mentorAvatar}" class="mentor-avatar-lg" />
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
                  <span class="badge-tag badge-green"><i class="fa-solid fa-circle-check"></i> Completed</span>
                ` : `
                  <button class="btn-brand-primary btn-complete-task" data-id="${t.id}" style="padding: 0.4rem 0.9rem; font-size: 0.8rem;">Mark Completed</button>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">No action tasks assigned yet.</div>
      `}
    </div>
  `;
}

function renderMenteeSessionsList() {
  const activeAssoc = state.associates[state.currentAssociateIndex];
  const mySessions = state.sessions.filter(s => s.associateId === activeAssoc.id || s.associateName === activeAssoc.name);

  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">My 1-on-1 Sessions</h2>

      ${mySessions.length > 0 ? `
        <div class="cards-grid">
          ${mySessions.map(s => `
            <div class="mentor-card">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                <div style="font-weight: 800; font-size: 1.05rem;">${s.mentorName}</div>
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
      ` : `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">No sessions booked yet.</div>
      `}
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
        <button class="btn-brand-primary" id="btnEditProfile" style="padding: 0.45rem 1rem; font-size: 0.82rem;"><i class="fa-solid fa-pen"></i> Edit Profile</button>
      </div>

      <!-- Metrics Cards Grid -->
      <div class="stats-overview-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Monthly 1-on-1 Capacity</span>
            <div class="stat-icon"><i class="fa-solid fa-gauge-high"></i></div>
          </div>
          <div class="stat-value">${mentor.sessionsUsedThisMonth} / ${mentor.monthlyCap}</div>
          <div class="capacity-progress-container">
            <div class="capacity-progress-fill" style="width: ${Math.min(usagePct, 100)}%;"></div>
          </div>
          <div class="stat-meta">${mentor.monthlyCap - mentor.sessionsUsedThisMonth} slots remaining for mentees</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Total Mentees Advised</span>
            <div class="stat-icon" style="background: var(--badge-purple-bg); color: var(--brand-violet);"><i class="fa-solid fa-user-graduate"></i></div>
          </div>
          <div class="stat-value">${mentor.totalSessions}</div>
          <div class="stat-meta">Completed 1-on-1 sessions</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Average Mentee Rating</span>
            <div class="stat-icon" style="background: var(--badge-gold-bg); color: var(--brand-gold);"><i class="fa-solid fa-star"></i></div>
          </div>
          <div class="stat-value">${mentor.rating} / 5.0</div>
          <div class="stat-meta">Based on associate feedback</div>
        </div>
      </div>

      <!-- Mentee Requests Table -->
      <div class="mentor-card">
        <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">Pending 1-on-1 Booking Requests</h3>
        
        ${state.sessions.filter(s => s.mentorId === mentor.id && s.status === 'Pending').length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 0.8rem;">
            ${state.sessions.filter(s => s.mentorId === mentor.id && s.status === 'Pending').map(s => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 800; font-size: 0.95rem;">${s.associateName}</div>
                  <div style="font-size: 0.82rem; color: var(--text-secondary);">${s.objective}</div>
                  <div style="font-size: 0.76rem; color: var(--brand-primary); font-weight: 700; margin-top: 0.2rem;"><i class="fa-regular fa-clock"></i> ${s.date} at ${s.time} (${s.duration})</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn-brand-primary btn-accept-session" data-id="${s.id}" style="padding: 0.35rem 0.8rem; font-size: 0.78rem;">Accept</button>
                  <button class="btn-brand-primary btn-decline-session" data-id="${s.id}" style="padding: 0.35rem 0.8rem; font-size: 0.78rem; background: var(--brand-rose);">Decline</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="font-size: 0.88rem; color: var(--text-muted);">No pending booking requests.</div>
        `}
      </div>
    </div>
  `;
}

function renderMentorAvailability(mentor) {
  const openSlotsCount = mentor.schedule.filter(s => !s.isBooked).length;
  const bookedSlotsCount = mentor.schedule.filter(s => s.isBooked).length;

  return `
    <div class="content-area" style="width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">1-on-1 Availability Management</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Assign specific dates and time hours for associates to book mentorship sessions.</p>
        </div>

        <button class="btn-brand-primary" id="btnOpenAvailabilityModal" style="padding: 0.7rem 1.35rem; font-size: 0.92rem; border-radius: 10px; box-shadow: var(--shadow-sm);">
          <i class="fa-solid fa-calendar-days" style="margin-right: 0.4rem;"></i> Manage Availability & Hours
        </button>
      </div>

      <!-- Quick Stats & Slot Overview -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="stat-card" style="padding: 1.2rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); margin-bottom: 0.3rem;">Open 1-on-1 Slots</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary);">${openSlotsCount}</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 0.2rem;">Ready for associates to book</div>
        </div>

        <div class="stat-card" style="padding: 1.2rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--brand-violet); margin-bottom: 0.3rem;">Booked Sessions</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary);">${bookedSlotsCount}</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 0.2rem;">Confirmed associate meetings</div>
        </div>
      </div>

      <!-- Existing Slots List -->
      <div class="mentor-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem;">
          <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800;">Published 1-on-1 Slots</h3>
          <span class="badge-tag badge-blue" style="font-size: 0.78rem;">${mentor.schedule.length} total entries</span>
        </div>

        ${mentor.schedule.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 0.8rem;">
            ${mentor.schedule.map((slot, index) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.1rem; background: var(--bg-input); border-radius: var(--radius-md);">
                <div style="font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.6rem;">
                  <i class="fa-regular fa-calendar-check" style="color: var(--brand-primary); font-size: 1.05rem;"></i>
                  <span>${slot.date} at ${slot.time}</span>
                  ${slot.isBooked ? '<span class="badge-tag badge-purple" style="margin-left: 0.5rem;">Booked</span>' : '<span class="badge-tag badge-green" style="margin-left: 0.5rem;">Open</span>'}
                </div>
                ${!slot.isBooked ? `
                  <button class="btn-remove-slot" data-index="${index}" style="background: transparent; color: var(--brand-rose); font-size: 0.85rem; font-weight: 700; cursor: pointer; border: none;">
                    <i class="fa-solid fa-trash-can"></i> Remove
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
            <i class="fa-regular fa-calendar-xmark" style="font-size: 2.2rem; margin-bottom: 0.8rem;"></i>
            <div style="font-weight: 800;">No availability slots configured yet.</div>
            <p style="font-size: 0.84rem; margin-top: 0.3rem;">Click "Manage Availability & Hours" above to assign dates and time slots.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderMentorGroupSessions(mentor) {
  return `
    <div class="content-area" style="width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">My Group Masterclasses</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Host cohort masterclasses for up to 20 associates.</p>
        </div>
        <button class="btn-brand-primary" id="btnOpenCreateGroupModal"><i class="fa-solid fa-plus"></i> Schedule Masterclass</button>
      </div>

      <div class="cards-grid">
        ${state.groupSessions.filter(g => g.mentorId === mentor.id).map(g => `
          <div class="mentor-card">
            <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; margin-bottom: 0.4rem;">${g.title}</h3>
            <p style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 1rem;">${g.description}</p>
            <div class="card-tags-flex">
              <span class="badge-tag badge-blue"><i class="fa-regular fa-calendar"></i> ${g.date} at ${g.startTime}</span>
              <span class="badge-tag badge-purple"><i class="fa-solid fa-users"></i> ${g.enrolledMentees.length} / ${g.maxCapacity} Enrolled</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMentorTasks(mentor) {
  const filterQuery = state.newTaskData.searchQuery.trim().toLowerCase();
  const selectedIds = state.newTaskData.selectedAssociateIds;

  const filteredAssociates = state.associates.filter(assoc => {
    if (!filterQuery) return true;
    return assoc.name.toLowerCase().includes(filterQuery) ||
           assoc.title.toLowerCase().includes(filterQuery) ||
           assoc.email.toLowerCase().includes(filterQuery);
  });

  return `
    <div class="content-area" style="width: 100%;">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">Assign Action Tasks to Mentees</h2>
        <p style="font-size: 0.88rem; color: var(--text-secondary);">Create action tasks with deadlines for associates in your mentorship program.</p>
      </div>

      <!-- Assign Task Form Card with Mentee Live Search & Multi-Select -->
      <div class="mentor-card" style="margin-bottom: 2rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; margin-bottom: 1.25rem;">Create New Task</h3>
        
        <form id="formCreateTask">
          
          <!-- MENTEE MULTI-SELECT WITH LIVE SEARCH -->
          <div class="form-group">
            <label class="form-label" style="display: flex; align-items: center; justify-content: space-between;">
              <span>Select Mentees / Associates (${selectedIds.length} selected)</span>
              ${selectedIds.length > 0 ? `
                <button type="button" id="btnClearSelectedAssociates" style="background: transparent; color: var(--brand-rose); font-size: 0.78rem; font-weight: 700; cursor: pointer;">
                  Clear Selection
                </button>
              ` : ''}
            </label>

            <!-- Search Filter Bar -->
            <div style="position: relative; margin-bottom: 0.6rem;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem;"></i>
              <input type="text" id="inputSearchAssociates" class="form-input" placeholder="Type name, title or email to filter mentees..." value="${state.newTaskData.searchQuery}" style="padding-left: 2.3rem; border-radius: 8px;" />
            </div>

            <!-- Scrollable Mentee List with Checkboxes -->
            <div class="mentee-selector-list" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-input); padding: 0.5rem;">
              ${filteredAssociates.length > 0 ? filteredAssociates.map(assoc => {
                const isChecked = selectedIds.includes(assoc.id);
                return `
                  <label class="mentee-select-item ${isChecked ? 'selected' : ''}" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; transition: var(--transition-fast); margin-bottom: 0.2rem;">
                    <input type="checkbox" class="cb-select-associate" value="${assoc.id}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--brand-primary); cursor: pointer;" />
                    <img src="${assoc.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                    <div style="flex: 1;">
                      <div style="font-weight: 700; font-size: 0.86rem; color: var(--text-primary);">${assoc.name}</div>
                      <div style="font-size: 0.76rem; color: var(--text-secondary);">${assoc.title}</div>
                    </div>
                  </label>
                `;
              }).join('') : `
                <div style="padding: 1rem; text-align: center; font-size: 0.84rem; color: var(--text-muted);">
                  No mentees found matching "${state.newTaskData.searchQuery}".
                </div>
              `}
            </div>
          </div>

          <!-- TASK DETAILS -->
          <div class="form-group">
            <label class="form-label" for="createTaskTitle">Task Title</label>
            <input type="text" class="form-input" id="createTaskTitle" placeholder="e.g. Submit Research Proposal Draft" required value="${state.newTaskData.title}">
          </div>

          <div class="form-group">
            <label class="form-label" for="createTaskDescription">Task Description & Deliverables</label>
            <textarea class="form-textarea" id="createTaskDescription" rows="3" placeholder="Provide detailed instructions and expected outputs..." required>${state.newTaskData.description}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="createTaskDeadline">Completion Deadline</label>
            <input type="date" class="form-input" id="createTaskDeadline" required value="${state.newTaskData.deadline}">
          </div>

          <button type="submit" class="btn-brand-primary" style="padding: 0.75rem 1.6rem;">
            <i class="fa-solid fa-paper-plane"></i> Assign Task ${selectedIds.length > 0 ? `to ${selectedIds.length} Mentee${selectedIds.length === 1 ? '' : 's'}` : ''}
          </button>
        </form>
      </div>

      <!-- Assigned Tasks Table -->
      <div class="mentor-card">
        <h3 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem;">Previously Assigned Tasks</h3>
        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
          ${state.tasks.filter(t => t.mentorId === mentor.id).map(t => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.1rem; background: var(--bg-input); border-radius: var(--radius-md);">
              <div>
                <div style="font-weight: 800; font-size: 0.95rem;">${t.title}</div>
                <div style="font-size: 0.82rem; color: var(--text-secondary);">${t.description}</div>
                <div style="font-size: 0.76rem; color: var(--brand-primary); font-weight: 700; margin-top: 0.2rem;">Assigned to: ${t.associateName} · Due: ${t.deadline}</div>
              </div>
              <span class="badge-tag ${t.status === 'Completed' ? 'badge-green' : 'badge-gold'}">${t.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// ADMIN VIEWS
// --------------------------------------------------------------------------
function renderAdminAnalytics() {
  const totalSessions = state.sessions.length;
  const acceptedSessions = state.sessions.filter(s => s.status === 'Accepted').length;

  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Programme Overview & Analytics</h2>

      <div class="stats-overview-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Active Associates</span>
            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
          </div>
          <div class="stat-value">${state.associates.length}</div>
          <div class="stat-meta">Enrolled in Mastercard Foundation Program</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Verified Mentors</span>
            <div class="stat-icon" style="background: var(--badge-purple-bg); color: var(--brand-violet);"><i class="fa-solid fa-user-tie"></i></div>
          </div>
          <div class="stat-value">${state.mentors.length}</div>
          <div class="stat-meta">Across 4 specialist domains</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Total 1-on-1 Sessions</span>
            <div class="stat-icon" style="background: var(--badge-green-bg); color: var(--brand-emerald);"><i class="fa-solid fa-handshake"></i></div>
          </div>
          <div class="stat-value">${totalSessions}</div>
          <div class="stat-meta">${acceptedSessions} completed / accepted</div>
        </div>
      </div>
    </div>
  `;
}

function renderAdminMentorManagement() {
  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Mentor Capacity & Caps</h2>
      
      <div class="cards-grid">
        ${state.mentors.map(m => `
          <div class="mentor-card">
            <div class="card-header-flex">
              <img src="${m.avatar}" class="mentor-avatar-lg" />
              <div>
                <div class="mentor-name">${m.name}</div>
                <div class="mentor-title">${m.title}</div>
              </div>
            </div>
            <div style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">Monthly Cap: ${m.monthlyCap} 1-on-1 sessions</div>
            <button class="btn-brand-primary btn-edit-cap" data-id="${m.id}" style="padding: 0.4rem 0.9rem; font-size: 0.8rem;">Edit Session Cap</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAdminSessionLogs() {
  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Session Audit Logs</h2>
      
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        ${state.sessions.map(s => `
          <div class="mentor-card" style="flex-direction: row; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 800; font-size: 0.95rem;">${s.associateName} ↔ ${s.mentorName}</div>
              <div style="font-size: 0.82rem; color: var(--text-secondary);">${s.objective}</div>
            </div>
            <span class="badge-tag ${s.status === 'Accepted' ? 'badge-green' : 'badge-gold'}">${s.status}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// MODALS
// --------------------------------------------------------------------------
function renderModals() {
  if (!state.activeModal) return '';

  if (state.activeModal === 'booking' && state.bookingMentor) {
    const m = state.bookingMentor;
    return `
      <div class="modal-overlay">
        <div class="modal-content-card">
          <div class="modal-header-flex">
            <h3 class="modal-title">Book 1-on-1 Session with ${m.name}</h3>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>
          
          <form id="formConfirmBooking">
            <div class="form-group">
              <label class="form-label">Available Time Slots</label>
              <select class="form-select" id="bookingSlotSelect" required>
                ${m.schedule.filter(s => !s.isBooked).map(s => `
                  <option value="${s.date}|${s.time}">${s.date} at ${s.time}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Session Duration</label>
              <select class="form-select" id="bookingDuration">
                <option value="45 Mins">45 Mins</option>
                <option value="1 Hour" selected>1 Hour</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Mentorship Objective / Discussion Topics</label>
              <textarea class="form-textarea" id="bookingObjective" rows="3" placeholder="What specific areas would you like help with during this session?" required></textarea>
            </div>

            <button type="submit" class="btn-brand-primary" style="width: 100%; justify-content: center; padding: 0.8rem;"><i class="fa-solid fa-calendar-check"></i> Confirm 1-on-1 Booking</button>
          </form>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'mentor_profile' && state.inspectingMentor) {
    const m = state.inspectingMentor;
    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 640px;">
          <div class="modal-header-flex">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <img src="${m.avatar}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand-gold);" />
              <div>
                <h3 class="modal-title" style="margin-bottom: 0.15rem;">${m.name}</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${m.title} at <strong>${m.organization}</strong></div>
              </div>
            </div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <h4 style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">About</h4>
            <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6;">${m.bio}</p>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <h4 style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">Expertise & Focus Areas</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${m.expertise.map(e => `<span class="badge-tag badge-blue">${e}</span>`).join('')}
            </div>
          </div>

          <div style="display: flex; gap: 0.6rem; margin-bottom: 1.5rem;">
            ${m.socials.linkedin ? `<a href="${m.socials.linkedin}" target="_blank" class="social-link-badge linkedin"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>` : ''}
            ${m.socials.github ? `<a href="${m.socials.github}" target="_blank" class="social-link-badge github"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
            ${m.socials.twitter ? `<a href="${m.socials.twitter}" target="_blank" class="social-link-badge twitter"><i class="fa-brands fa-x-twitter"></i> Twitter</a>` : ''}
          </div>

          <button class="btn-brand-primary btn-book-slot" data-id="${m.id}" style="width: 100%; justify-content: center; padding: 0.75rem;"><i class="fa-solid fa-calendar-plus"></i> Book 1-on-1 Session</button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'group_create') {
    return `
      <div class="modal-overlay">
        <div class="modal-content-card">
          <div class="modal-header-flex">
            <h3 class="modal-title">Schedule Group Masterclass</h3>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form id="formCreateGroup">
            <div class="form-group">
              <label class="form-label">Masterclass Title</label>
              <input type="text" class="form-input" id="groupTitle" placeholder="e.g. AI System Design & LLM Scaling" required>
            </div>

            <div class="form-group">
              <label class="form-label">Domain</label>
              <select class="form-select" id="groupDomain">
                <option value="Software Engineering & AI">Software Engineering & AI</option>
                <option value="Fintech & Product">Fintech & Product</option>
                <option value="Public Health & Social Impact">Public Health & Social Impact</option>
                <option value="Software Engineering & Data">Software Engineering & Data</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Description & Agenda</label>
              <textarea class="form-textarea" id="groupDesc" rows="3" placeholder="Overview of key learning points..." required></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;" class="form-group">
              <div>
                <label class="form-label">Date</label>
                <input type="date" class="form-input" id="groupDate" required value="2026-08-25">
              </div>
              <div>
                <label class="form-label">Start Time</label>
                <input type="text" class="form-input" id="groupStartTime" required value="04:00 PM">
              </div>
              <div>
                <label class="form-label">End Time</label>
                <input type="text" class="form-input" id="groupEndTime" required value="05:00 PM">
              </div>
            </div>

            <button type="submit" class="btn-brand-primary" style="width: 100%; justify-content: center; padding: 0.8rem;"><i class="fa-solid fa-plus"></i> Create Masterclass</button>
          </form>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'admin_cap' && state.editingCapMentor) {
    const m = state.editingCapMentor;
    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 440px;">
          <div class="modal-header-flex">
            <h3 class="modal-title">Edit Session Cap — ${m.name}</h3>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="form-group">
            <label class="form-label">Monthly Session Cap</label>
            <input type="number" class="form-input" id="inputNewMentorCap" value="${m.monthlyCap}" min="1" max="50" required>
          </div>

          <button type="button" class="btn-brand-primary" id="btnSaveCapSubmit" style="width: 100%; justify-content: center; padding: 0.75rem;"><i class="fa-solid fa-floppy-disk"></i> Save Monthly Cap</button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'edit_mentor_profile') {
    const activeMentor = state.mentors.find(m => m.id === state.currentUser?.id || m.email === state.currentUser?.email) || state.mentors[state.currentMentorIndex] || state.mentors[0];
    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 600px;">
          <div class="modal-header-flex">
            <h3 class="modal-title">Edit Mentor Profile</h3>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form id="formEditMentorProfile">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="editMentorName" value="${activeMentor.name || ''}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Job Title</label>
                <input type="text" class="form-input" id="editMentorTitle" value="${activeMentor.title || ''}" required>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Organization</label>
                <input type="text" class="form-input" id="editMentorOrg" value="${activeMentor.organization || ''}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Specialist Domain</label>
                <select class="form-select" id="editMentorDomain" required>
                  <option value="Software Engineering & AI" ${activeMentor.domain === 'Software Engineering & AI' ? 'selected' : ''}>Software Engineering & AI</option>
                  <option value="Fintech & Product" ${activeMentor.domain === 'Fintech & Product' ? 'selected' : ''}>Fintech & Product</option>
                  <option value="Public Health & Social Impact" ${activeMentor.domain === 'Public Health & Social Impact' ? 'selected' : ''}>Public Health & Social Impact</option>
                  <option value="Software Engineering & Data" ${activeMentor.domain === 'Software Engineering & Data' ? 'selected' : ''}>Software Engineering & Data</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Professional Bio</label>
              <textarea class="form-textarea" id="editMentorBio" rows="3" required>${activeMentor.bio || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Expertise / Focus Areas (Comma separated)</label>
              <input type="text" class="form-input" id="editMentorExpertise" value="${(activeMentor.expertise || []).join(', ')}" placeholder="e.g. Machine Learning, System Architecture, Leadership">
            </div>

            <div class="form-group">
              <label class="form-label">Avatar Image URL</label>
              <input type="url" class="form-input" id="editMentorAvatar" value="${activeMentor.avatar || ''}" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem;" class="form-group">
              <div>
                <label class="form-label">LinkedIn URL</label>
                <input type="url" class="form-input" id="editMentorLinkedin" value="${activeMentor.socials?.linkedin || ''}">
              </div>
              <div>
                <label class="form-label">GitHub URL</label>
                <input type="url" class="form-input" id="editMentorGithub" value="${activeMentor.socials?.github || ''}">
              </div>
              <div>
                <label class="form-label">Twitter / X URL</label>
                <input type="url" class="form-input" id="editMentorTwitter" value="${activeMentor.socials?.twitter || ''}">
              </div>
            </div>

            <button type="submit" class="btn-brand-primary" style="width: 100%; justify-content: center; padding: 0.8rem;"><i class="fa-solid fa-floppy-disk"></i> Save Profile Changes</button>
          </form>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'mentor_profile' && state.inspectingMentor) {
    const m = state.inspectingMentor;
    const availableSlot = m.schedule ? m.schedule.find(s => !s.isBooked) : null;

    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 580px; width: 100%;">
          <div class="modal-header-flex">
            <div style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800;">Mentor Profile Overview</div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div style="display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-color);">
            <img src="${m.avatar}" class="mentor-avatar-lg" style="width: 76px; height: 76px; border: 3.5px solid #F59E0B; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);" />
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.2rem;">${m.name}</h3>
              <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); line-height: 1.35; margin-bottom: 0.3rem;">${m.title}</div>
              <div style="font-size: 0.84rem; font-weight: 800; color: var(--brand-primary);">${m.organization}</div>
            </div>
          </div>

          <!-- Badges & Rating -->
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem;">
            <span class="badge-tag badge-blue" style="padding: 0.35rem 0.8rem;"><i class="fa-solid fa-briefcase"></i> ${m.domain}</span>
            <span class="badge-tag badge-gold" style="padding: 0.35rem 0.8rem;"><i class="fa-solid fa-star"></i> ${m.rating} (${m.totalSessions} sessions completed)</span>
            ${availableSlot ? `<span class="badge-tag badge-green" style="padding: 0.35rem 0.8rem;"><i class="fa-regular fa-circle-check"></i> Next Open Slot: ${availableSlot.date}</span>` : ''}
          </div>

          <!-- Full Bio / Background -->
          <div style="margin-bottom: 1.25rem;">
            <h4 style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 0.4rem;">About & Background</h4>
            <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; background: var(--bg-main); padding: 0.9rem 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">${m.bio}</p>
          </div>

          <!-- Expertise / Focus Areas -->
          ${m.expertise && m.expertise.length > 0 ? `
            <div style="margin-bottom: 1.25rem;">
              <h4 style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 0.5rem;">Expertise & Mentorship Areas</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 0.45rem;">
                ${m.expertise.map(e => `<span class="badge-tag badge-blue" style="font-size: 0.78rem;">${e}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Social Links -->
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 0.5rem;">Social & Professional Handles</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
              ${m.socials?.linkedin ? `<a href="${m.socials.linkedin}" target="_blank" class="social-link-badge linkedin"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>` : ''}
              ${m.socials?.github ? `<a href="${m.socials.github}" target="_blank" class="social-link-badge github"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
              ${m.socials?.twitter ? `<a href="${m.socials.twitter}" target="_blank" class="social-link-badge twitter"><i class="fa-brands fa-x-twitter"></i> Twitter / X</a>` : ''}
              ${!m.socials?.linkedin && !m.socials?.github && !m.socials?.twitter ? `<span style="font-size: 0.84rem; color: var(--text-muted);">No social handles attached.</span>` : ''}
            </div>
          </div>

          <!-- Action Button -->
          <button class="btn-brand-primary btn-book-slot" data-id="${m.id}" style="width: 100%; justify-content: center; padding: 0.85rem; font-size: 0.95rem; font-weight: 800; border-radius: 50px; background: var(--brand-violet); box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
            <i class="fa-solid fa-calendar-plus" style="margin-right: 0.4rem;"></i> Book 1-on-1 Session Now
          </button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'edit_associate_profile') {
    const activeAssoc = state.associates.find(a => a.id === state.currentUser?.id || a.email === state.currentUser?.email) || state.associates[state.currentAssociateIndex] || state.associates[0];
    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 540px;">
          <div class="modal-header-flex">
            <h3 class="modal-title">Edit Mentee Profile</h3>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form id="formEditAssociateProfile">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" id="editAssocName" value="${activeAssoc.name || ''}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Title / Track</label>
              <input type="text" class="form-input" id="editAssocTitle" value="${activeAssoc.title || ''}" placeholder="e.g. MasterCard Scholar & Tech Fellow" required>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" id="editAssocEmail" value="${activeAssoc.email || ''}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Bio & Development Goals</label>
              <textarea class="form-textarea" id="editAssocBio" rows="3" required>${activeAssoc.bio || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Avatar Image URL</label>
              <input type="url" class="form-input" id="editAssocAvatar" value="${activeAssoc.avatar || ''}" required>
            </div>

            <button type="submit" class="btn-brand-primary" style="width: 100%; justify-content: center; padding: 0.8rem;"><i class="fa-solid fa-floppy-disk"></i> Save Profile Changes</button>
          </form>
        </div>
    </div>
  `;
  }

  if (state.activeModal === 'manage_availability') {
    const modalData = state.availabilityModal;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthTitle = `${monthNames[modalData.month]} ${modalData.year}`;

    const firstDay = new Date(modalData.year, modalData.month, 1).getDay();
    const daysInMonth = new Date(modalData.year, modalData.month + 1, 0).getDate();

    const daysGrid = [];
    for (let i = 0; i < firstDay; i++) {
      daysGrid.push({ dayNum: null, disabled: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const padMonth = String(modalData.month + 1).padStart(2, '0');
      const padDay = String(day).padStart(2, '0');
      const dateStr = `${modalData.year}-${padMonth}-${padDay}`;
      const isSelected = modalData.selectedDates.includes(dateStr);
      daysGrid.push({ dayNum: day, dateStr, isSelected, disabled: false });
    }

    const timeOptions = [
      "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
      "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
      "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
      "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
      "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
      "06:00 PM", "06:30 PM", "07:00 PM"
    ];

    return `
      <div class="modal-overlay">
        <div class="calendly-modal-card">
          <div class="modal-header-flex">
            <div>
              <h3 class="modal-title" style="font-size: 1.15rem; font-weight: 800;">Select the date(s) you want to assign specific hours</h3>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem;">Click days on the calendar to select multiple dates for your availability.</p>
            </div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Month Date Picker Widget -->
          <div class="calendly-picker-container">
            <div class="calendly-month-header">
              <span class="calendly-month-title">${monthTitle}</span>
              <div class="calendly-month-nav">
                <button type="button" class="calendly-nav-btn" id="btnPrevMonth" title="Previous Month"><i class="fa-solid fa-chevron-left"></i></button>
                <button type="button" class="calendly-nav-btn" id="btnNextMonth" title="Next Month"><i class="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>

            <div class="calendly-weekdays-grid">
              <div class="calendly-weekday-col">SUN</div>
              <div class="calendly-weekday-col">MON</div>
              <div class="calendly-weekday-col">TUE</div>
              <div class="calendly-weekday-col">WED</div>
              <div class="calendly-weekday-col">THU</div>
              <div class="calendly-weekday-col">FRI</div>
              <div class="calendly-weekday-col">SAT</div>
            </div>

            <div class="calendly-days-grid">
              ${daysGrid.map(d => {
                if (d.disabled) {
                  return `<button type="button" class="calendly-day-btn disabled" disabled></button>`;
                }
                return `
                  <button type="button" class="calendly-day-btn calendly-day-cell ${d.isSelected ? 'selected' : ''}" data-date="${d.dateStr}">
                    ${d.dayNum}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Time Range Builder Section -->
          <div class="time-range-section">
            <div class="time-range-header">
              <span>What hours are you available?</span>
              <button type="button" class="btn-add-time-range" id="btnAddTimeRange" title="Add Time Range">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>

            <div id="timeRangeRowsList" style="display: flex; flex-direction: column; gap: 0.6rem;">
              ${modalData.timeRanges.map((tr, index) => `
                <div class="time-range-row">
                  <select class="time-range-start" data-index="${index}">
                    ${timeOptions.map(t => `<option value="${t}" ${t === tr.startTime ? 'selected' : ''}>${t}</option>`).join('')}
                  </select>
                  <span class="time-range-separator">-</span>
                  <select class="time-range-end" data-index="${index}">
                    ${timeOptions.map(t => `<option value="${t}" ${t === tr.endTime ? 'selected' : ''}>${t}</option>`).join('')}
                  </select>
                  ${modalData.timeRanges.length > 1 ? `
                    <button type="button" class="btn-remove-time-range" data-index="${index}" title="Remove Range">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  ` : '<div style="width: 24px;"></div>'}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="calendly-actions-footer">
            <button type="button" class="btn-brand-secondary btn-close-modal" style="padding: 0.65rem 1.4rem; border: 1px solid var(--border-color);">Cancel</button>
            <button type="button" class="btn-brand-primary" id="btnApplyAvailability" style="padding: 0.65rem 1.6rem;">
              Apply (${modalData.selectedDates.length} date${modalData.selectedDates.length === 1 ? '' : 's'})
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

function renderNotificationDrawer() {
  return `
    <div class="notification-drawer">
      <div class="notification-header">
        <span>Notifications (${state.notifications.filter(n => !n.read).length})</span>
        <button id="btnMarkAllRead" style="font-size: 0.75rem; color: var(--brand-primary); font-weight: 700; background: transparent;">Mark all read</button>
      </div>

      ${state.notifications.map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}">
          <i class="fa-solid fa-bell" style="color: var(--brand-primary); font-size: 1rem; margin-top: 0.2rem;"></i>
          <div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${n.message}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">${n.time}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// --------------------------------------------------------------------------
// EVENT BINDINGS
// --------------------------------------------------------------------------
function bindEvents() {
  // Theme Toggle
  document.querySelectorAll('#btnToggleTheme').forEach(btn => {
    btn.onclick = toggleTheme;
  });

  // Client-Side Router Links (Landing Navigation)
  document.getElementById('btnNavBrandHome')?.addEventListener('click', () => navigateTo('/'));
  document.getElementById('navLinkHome')?.addEventListener('click', () => navigateTo('/'));
  document.getElementById('navLinkMentors')?.addEventListener('click', () => scrollToSection('section-mentors'));
  document.getElementById('navLinkHowItWorks')?.addEventListener('click', () => scrollToSection('section-how-it-works'));
  document.getElementById('navLinkValue')?.addEventListener('click', () => scrollToSection('section-value'));
  document.getElementById('footerLinkHome')?.addEventListener('click', () => navigateTo('/'));
  document.getElementById('footerLinkMentors')?.addEventListener('click', () => scrollToSection('section-mentors'));

  // Nav Login Buttons
  document.getElementById('btnNavLogin')?.addEventListener('click', () => navigateTo('/login'));
  document.getElementById('btnHeroLogin')?.addEventListener('click', () => navigateTo('/login'));
  document.getElementById('btnFinalCtaLogin')?.addEventListener('click', () => navigateTo('/login'));
  document.getElementById('footerLinkLogin')?.addEventListener('click', () => navigateTo('/login'));
  document.getElementById('btnHeroFindMentors')?.addEventListener('click', () => scrollToSection('section-mentors'));

  // Dedicated Login Page Controls
  document.getElementById('btnBackToHome')?.addEventListener('click', () => navigateTo('/'));
  document.getElementById('btnBackToHomeBrand')?.addEventListener('click', () => navigateTo('/'));

  // Toggle Password Eye Icon
  document.getElementById('btnTogglePassword')?.addEventListener('click', () => {
    state.loginForm.showPassword = !state.loginForm.showPassword;
    render();
  });

  // Quick Demo Credentials Buttons
  document.querySelectorAll('.demo-cred-btn').forEach(btn => {
    btn.onclick = () => {
      state.loginForm.selectedRole = btn.dataset.role;
      state.loginForm.email = btn.dataset.email;
      state.loginForm.password = 'password123';
      state.loginForm.errorMessage = null;
      render();
    };
  });

  // Login Form Submission
  const loginFormNode = document.getElementById('loginAuthForm');
  if (loginFormNode) {
    loginFormNode.onsubmit = async (e) => {
      e.preventDefault();
      const roleSelect = document.getElementById('loginRole');
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');

      state.loginForm.selectedRole = roleSelect.value;
      state.loginForm.email = emailInput.value.trim();
      state.loginForm.password = passwordInput.value;

      if (!state.loginForm.selectedRole) {
        state.loginForm.errorMessage = 'Please select a profile type to log in.';
        render();
        return;
      }

      state.loginForm.isSubmitting = true;
      state.loginForm.errorMessage = null;
      render();

      try {
        const user = await apiService.loginUser(
          state.loginForm.email,
          state.loginForm.password,
          state.loginForm.selectedRole
        );

        state.loginForm.isSubmitting = false;
        state.currentUser = user;
        showToast(`Welcome back, ${user.name}!`, 'fa-circle-check');
        navigateTo(`/${user.role}`);
      } catch (err) {
        state.loginForm.isSubmitting = false;
        state.loginForm.errorMessage = err.message || 'Invalid login credentials. Please check your details.';
        render();
      }
    };
  }

  // Logout Button
  const btnLogoutNode = document.getElementById('btnLogout');
  if (btnLogoutNode) {
    btnLogoutNode.onclick = () => {
      try {
        if (typeof apiService.logoutUser === 'function') {
          apiService.logoutUser();
        } else if (typeof apiService.logout === 'function') {
          apiService.logout();
        } else {
          localStorage.removeItem('mently_user');
          localStorage.removeItem('mently_auth_token');
        }
      } catch (err) {
        console.warn('Logout warning:', err);
        localStorage.removeItem('mently_user');
        localStorage.removeItem('mently_auth_token');
      }
      state.currentUser = null;
      showToast('Logged out successfully.', 'fa-right-from-bracket');
      navigateTo('/login');
    };
  }

  // Domain Filter Buttons on Landing Page
  document.querySelectorAll('.domain-pill-btn').forEach(btn => {
    btn.onclick = () => {
      state.landingDomainFilter = btn.dataset.domain;
      render();
    };
  });

  // Landing Mentor Profile Inspector & Quick Booking
  document.querySelectorAll('.btn-inspect-profile').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      const mentor = state.mentors.find(m => m.id === id);
      if (mentor) {
        state.inspectingMentor = mentor;
        state.activeModal = 'mentor_profile';
        render();
      }
    };
  });

  document.querySelectorAll('.btn-landing-book').forEach(btn => {
    btn.onclick = (e) => {
      if (!state.currentUser) {
        showToast('Please login to book a 1-on-1 session.', 'fa-circle-exclamation');
        state.loginForm.selectedRole = 'associate';
        navigateTo('/login');
        return;
      }
      const id = e.currentTarget.dataset.id;
      const mentor = state.mentors.find(m => m.id === id);
      if (mentor) {
        state.bookingMentor = mentor;
        state.activeModal = 'booking';
        render();
      }
    };
  });

  // Search Input in Header
  const searchInput = document.getElementById('headerSearchInput');
  if (searchInput) {
    searchInput.oninput = (e) => {
      state.searchQuery = e.target.value;
      render();
    };
  }

  // Navigation Vertical Sidebar Links & Mobile Drawer
  document.querySelectorAll('.nav-sidebar-link[data-tab]').forEach(tab => {
    tab.onclick = () => {
      const role = state.currentUser ? state.currentUser.role : state.currentRole;
      if (role === 'associate') state.associateTab = tab.dataset.tab;
      else if (role === 'mentor') state.mentorTab = tab.dataset.tab;
      else if (role === 'admin') state.adminTab = tab.dataset.tab;
      state.isMobileNavOpen = false;
      render();
    };
  });

  // Mobile Nav Drawer Toggle
  document.getElementById('btnMobileNavToggle')?.addEventListener('click', () => {
    state.isMobileNavOpen = !state.isMobileNavOpen;
    render();
  });

  document.getElementById('sidebarBackdrop')?.addEventListener('click', () => {
    state.isMobileNavOpen = false;
    render();
  });

  document.getElementById('btnSidebarHelp')?.addEventListener('click', () => {
    showToast('Help & Support: Contact support@mcf-portal.org for assistance.', 'fa-circle-question');
  });

  // Domain Checkboxes in Mentee Discovery Sidebar
  document.querySelectorAll('.domain-filter-cb').forEach(cb => {
    cb.onchange = () => {
      const domain = cb.value;
      if (cb.checked) {
        if (!state.selectedDomains.includes(domain)) state.selectedDomains.push(domain);
      } else {
        state.selectedDomains = state.selectedDomains.filter(d => d !== domain);
      }
      render();
    };
  });

  document.getElementById('btnClearFilters')?.addEventListener('click', () => {
    state.selectedDomains = [];
    state.searchQuery = '';
    render();
  });

  // View Mentor Profile Modal
  document.querySelectorAll('.btn-inspect-profile').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      const m = state.mentors.find(x => x.id === id);
      if (m) {
        state.inspectingMentor = m;
        state.activeModal = 'mentor_profile';
        render();
      }
    };
  });

  // Open Schedule Masterclass Modal
  document.getElementById('btnOpenCreateGroupModal')?.addEventListener('click', () => {
    state.activeModal = 'group_create';
    render();
  });

  // Create Group Masterclass Form Submit
  const formCreateGroup = document.getElementById('formCreateGroup');
  if (formCreateGroup) {
    formCreateGroup.onsubmit = async (e) => {
      e.preventDefault();
      const activeMentor = state.mentors.find(m => m.id === state.currentUser?.id || m.email === state.currentUser?.email) || state.mentors[state.currentMentorIndex] || state.mentors[0];

      const topic = document.getElementById('groupTopic')?.value.trim();
      const category = document.getElementById('groupCategory')?.value;
      const date = document.getElementById('groupDate')?.value;
      const time = document.getElementById('groupTime')?.value;
      const capacity = parseInt(document.getElementById('groupCapacity')?.value || '20', 10);
      const meetingUrl = document.getElementById('groupMeetingUrl')?.value.trim();

      try {
        await apiService.createGroupSession({
          mentorId: activeMentor.id,
          mentorName: activeMentor.name,
          topic,
          category,
          date,
          time,
          capacity,
          meetingUrl
        });

        state.activeModal = null;
        showToast('Group Masterclass scheduled successfully!', 'fa-circle-check');
        await initAppData();
      } catch (err) {
        showToast(`Failed to schedule masterclass: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  }

  // Book 1-on-1 Button
  document.querySelectorAll('.btn-book-slot').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      const mentor = state.mentors.find(m => m.id === id);
      if (mentor) {
        state.bookingMentor = mentor;
        state.activeModal = 'booking';
        render();
      }
    };
  });

  // Confirm Booking Form Submit
  const formBooking = document.getElementById('formConfirmBooking');
  if (formBooking) {
    formBooking.onsubmit = async (e) => {
      e.preventDefault();
      const slotVal = document.getElementById('bookingSlotSelect').value;
      const [date, time] = slotVal.split('|');
      const duration = document.getElementById('bookingDuration').value;
      const objective = document.getElementById('bookingObjective').value;
      const activeAssoc = state.associates[state.currentAssociateIndex];

      try {
        await apiService.createSessionBooking({
          associateId: activeAssoc.id,
          associateName: activeAssoc.name,
          mentorId: state.bookingMentor.id,
          mentorName: state.bookingMentor.name,
          date,
          time,
          duration,
          objective
        });

        state.activeModal = null;
        showToast(`1-on-1 booking request sent to ${state.bookingMentor.name}!`, 'fa-circle-check');
        initAppData();
      } catch (err) {
        showToast(`Booking failed: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  }

  // Join Group Masterclass Button
  document.querySelectorAll('.btn-join-group').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      const activeAssoc = state.associates[state.currentAssociateIndex];
      try {
        await apiService.enrollInGroupSession(id, activeAssoc.name);
        showToast('Enrolled in masterclass!', 'fa-circle-check');
        initAppData();
      } catch (err) {
        showToast(`Enrollment failed: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  });

  // Complete Mentee Task Button
  document.querySelectorAll('.btn-complete-task').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        await apiService.updateTaskStatus(id, 'Completed');
        showToast('Task marked as completed!', 'fa-circle-check');
        initAppData();
      } catch (err) {
        showToast(`Error updating task: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  });

  // Accept / Decline Mentor Session Requests
  document.querySelectorAll('.btn-accept-session').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        await apiService.updateSessionStatus(id, 'Accepted');
        showToast('Session request accepted.', 'fa-circle-check');
        initAppData();
      } catch (err) {
        showToast(`Error updating session: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  });

  document.querySelectorAll('.btn-decline-session').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        await apiService.updateSessionStatus(id, 'Declined');
        showToast('Session request declined.', 'fa-circle-info');
        initAppData();
      } catch (err) {
        showToast(`Error updating session: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  });

  // Live Mentee Search Input for Task Assignment
  const inputSearchAssoc = document.getElementById('inputSearchAssociates');
  if (inputSearchAssoc) {
    inputSearchAssoc.oninput = (e) => {
      state.newTaskData.searchQuery = e.target.value;
      render();
    };
  }

  // Multi-Select Mentee Checkboxes
  document.querySelectorAll('.cb-select-associate').forEach(cb => {
    cb.onchange = (e) => {
      const id = e.target.value;
      if (e.target.checked) {
        if (!state.newTaskData.selectedAssociateIds.includes(id)) {
          state.newTaskData.selectedAssociateIds.push(id);
        }
      } else {
        state.newTaskData.selectedAssociateIds = state.newTaskData.selectedAssociateIds.filter(x => x !== id);
      }
      render();
    };
  });

  // Clear Selected Mentees Button
  document.getElementById('btnClearSelectedAssociates')?.addEventListener('click', () => {
    state.newTaskData.selectedAssociateIds = [];
    render();
  });

  // Create Mentor Task Form Submit (Multi-Select Support)
  const formTask = document.getElementById('formCreateTask');
  if (formTask) {
    formTask.onsubmit = async (e) => {
      e.preventDefault();
      const selectedIds = state.newTaskData.selectedAssociateIds;
      const title = document.getElementById('createTaskTitle')?.value;
      const description = document.getElementById('createTaskDescription')?.value;
      const deadline = document.getElementById('createTaskDeadline')?.value;
      const activeMentor = state.mentors[state.currentMentorIndex];

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
    };
  }

  // Open Profile Edit Modal (Mentors and Mentees / Associates)
  document.querySelectorAll('#btnEditProfile, #btnEditUserProfile').forEach(btn => {
    btn.onclick = () => {
      const user = state.currentUser;
      const role = user ? user.role : state.currentRole;
      if (role === 'mentor') {
        state.activeModal = 'edit_mentor_profile';
      } else {
        state.activeModal = 'edit_associate_profile';
      }
      render();
    };
  });

  // Submit Mentor Profile Edit
  const formEditMentor = document.getElementById('formEditMentorProfile');
  if (formEditMentor) {
    formEditMentor.onsubmit = async (e) => {
      e.preventDefault();
      const activeMentor = state.mentors.find(m => m.id === state.currentUser?.id || m.email === state.currentUser?.email) || state.mentors[state.currentMentorIndex] || state.mentors[0];

      const name = document.getElementById('editMentorName')?.value.trim();
      const title = document.getElementById('editMentorTitle')?.value.trim();
      const organization = document.getElementById('editMentorOrg')?.value.trim();
      const domain = document.getElementById('editMentorDomain')?.value;
      const bio = document.getElementById('editMentorBio')?.value.trim();
      const expertiseStr = document.getElementById('editMentorExpertise')?.value.trim();
      const avatar = document.getElementById('editMentorAvatar')?.value.trim();
      const linkedin = document.getElementById('editMentorLinkedin')?.value.trim();
      const github = document.getElementById('editMentorGithub')?.value.trim();
      const twitter = document.getElementById('editMentorTwitter')?.value.trim();

      const expertise = expertiseStr ? expertiseStr.split(',').map(s => s.trim()).filter(Boolean) : activeMentor.expertise;

      const profileData = {
        name: name || activeMentor.name,
        title: title || activeMentor.title,
        organization: organization || activeMentor.organization,
        domain: domain || activeMentor.domain,
        bio: bio || activeMentor.bio,
        expertise,
        avatar: avatar || activeMentor.avatar,
        socials: { linkedin, github, twitter }
      };

      try {
        const updated = await apiService.updateMentorProfile(activeMentor.id, profileData);
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, ...profileData };
          localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
        }
        state.activeModal = null;
        showToast('Mentor profile updated successfully!', 'fa-circle-check');
        await initAppData();
      } catch (err) {
        showToast(`Failed to update profile: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  }

  // Submit Associate / Mentee Profile Edit
  const formEditAssoc = document.getElementById('formEditAssociateProfile');
  if (formEditAssoc) {
    formEditAssoc.onsubmit = async (e) => {
      e.preventDefault();
      const activeAssoc = state.associates.find(a => a.id === state.currentUser?.id || a.email === state.currentUser?.email) || state.associates[state.currentAssociateIndex] || state.associates[0];

      const name = document.getElementById('editAssocName')?.value.trim();
      const title = document.getElementById('editAssocTitle')?.value.trim();
      const email = document.getElementById('editAssocEmail')?.value.trim();
      const bio = document.getElementById('editAssocBio')?.value.trim();
      const avatar = document.getElementById('editAssocAvatar')?.value.trim();

      const profileData = {
        name: name || activeAssoc.name,
        title: title || activeAssoc.title,
        email: email || activeAssoc.email,
        bio: bio || activeAssoc.bio,
        avatar: avatar || activeAssoc.avatar
      };

      try {
        const updated = await apiService.updateAssociateProfile(activeAssoc.id, profileData);
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, ...profileData };
          localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
        }
        state.activeModal = null;
        showToast('Profile updated successfully!', 'fa-circle-check');
        await initAppData();
      } catch (err) {
        showToast(`Failed to update profile: ${err.message}`, 'fa-triangle-exclamation');
      }
    };
  }

  // Open Calendly-Style Availability Modal
  document.getElementById('btnOpenAvailabilityModal')?.addEventListener('click', () => {
    state.activeModal = 'manage_availability';
    render();
  });

  // Previous / Next Month Navigation
  document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
    if (state.availabilityModal.month === 0) {
      state.availabilityModal.month = 11;
      state.availabilityModal.year -= 1;
    } else {
      state.availabilityModal.month -= 1;
    }
    render();
  });

  document.getElementById('btnNextMonth')?.addEventListener('click', () => {
    if (state.availabilityModal.month === 11) {
      state.availabilityModal.month = 0;
      state.availabilityModal.year += 1;
    } else {
      state.availabilityModal.month += 1;
    }
    render();
  });

  // Toggle Day Selection on Calendar Picker
  document.querySelectorAll('.calendly-day-cell').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dateStr = e.currentTarget.dataset.date;
      if (!dateStr) return;
      const idx = state.availabilityModal.selectedDates.indexOf(dateStr);
      if (idx > -1) {
        state.availabilityModal.selectedDates.splice(idx, 1);
      } else {
        state.availabilityModal.selectedDates.push(dateStr);
      }
      render();
    });
  });

  // Add Time Range Row
  document.getElementById('btnAddTimeRange')?.addEventListener('click', () => {
    state.availabilityModal.timeRanges.push({
      id: Date.now(),
      startTime: '09:00 AM',
      endTime: '10:00 AM'
    });
    render();
  });

  // Remove Time Range Row
  document.querySelectorAll('.btn-remove-time-range').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      if (!isNaN(idx) && state.availabilityModal.timeRanges.length > 1) {
        state.availabilityModal.timeRanges.splice(idx, 1);
        render();
      }
    });
  });

  // Select Time Changes
  document.querySelectorAll('.time-range-start').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      if (!isNaN(idx) && state.availabilityModal.timeRanges[idx]) {
        state.availabilityModal.timeRanges[idx].startTime = e.target.value;
      }
    });
  });

  document.querySelectorAll('.time-range-end').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      if (!isNaN(idx) && state.availabilityModal.timeRanges[idx]) {
        state.availabilityModal.timeRanges[idx].endTime = e.target.value;
      }
    });
  });

  // Apply Availability Slots
  document.getElementById('btnApplyAvailability')?.addEventListener('click', async () => {
    const activeMentor = state.mentors.find(m => m.id === state.currentUser?.id || m.email === state.currentUser?.email) || state.mentors[state.currentMentorIndex] || state.mentors[0];
    const { selectedDates, timeRanges } = state.availabilityModal;

    if (selectedDates.length === 0) {
      showToast('Please select at least one date on the calendar.', 'fa-triangle-exclamation');
      return;
    }

    if (timeRanges.length === 0) {
      showToast('Please add at least one time range.', 'fa-triangle-exclamation');
      return;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const newSlots = [];
    selectedDates.forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const formattedDate = `${monthNames[m - 1]} ${d}, ${y}`;
      timeRanges.forEach(tr => {
        const timeStr = `${tr.startTime} - ${tr.endTime}`;
        newSlots.push({ date: formattedDate, time: timeStr });
      });
    });

    try {
      await Promise.all(newSlots.map(slot => apiService.addMentorSlot(activeMentor.id, slot)));
      state.activeModal = null;
      showToast(`Successfully added ${newSlots.length} availability slot${newSlots.length === 1 ? '' : 's'} across ${selectedDates.length} date${selectedDates.length === 1 ? '' : 's'}!`, 'fa-circle-check');
      await initAppData();
    } catch (err) {
      showToast(`Error adding slots: ${err.message}`, 'fa-triangle-exclamation');
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

// Smooth Scroll Helper
function scrollToSection(sectionId) {
  if (state.currentPath !== '/') {
    navigateTo('/');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return;
  }
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Kickstart Application Initialization
initAppData();
