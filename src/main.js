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
    institutionOrOrg: '',
    title: '',
    trackOrDomain: 'Software Engineering & AI',
    bio: ''
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
          <div class="brand-logo-icon"><i class="fa-solid fa-graduation-cap"></i></div>
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
            <div class="brand-wrapper">
              <div class="brand-logo-icon"><i class="fa-solid fa-graduation-cap"></i></div>
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
            <div style="display: flex; gap: 0.4rem; background: var(--bg-main); padding: 0.35rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
              <button type="button" id="tabModeLogin" style="flex: 1; padding: 0.65rem 0.5rem; border-radius: 8px; border: none; font-weight: 800; font-size: 0.88rem; cursor: pointer; transition: all 0.2s ease; background: ${state.loginMode === 'login' ? 'var(--brand-primary)' : 'transparent'}; color: ${state.loginMode === 'login' ? '#ffffff' : 'var(--text-secondary)'}; shadow: ${state.loginMode === 'login' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none'};">
                <i class="fa-solid fa-right-to-bracket"></i> Log In
              </button>
              <button type="button" id="tabModeRegister" style="flex: 1; padding: 0.65rem 0.5rem; border-radius: 8px; border: none; font-weight: 800; font-size: 0.88rem; cursor: pointer; transition: all 0.2s ease; background: ${state.loginMode === 'register' ? 'var(--brand-primary)' : 'transparent'}; color: ${state.loginMode === 'register' ? '#ffffff' : 'var(--text-secondary)'}; shadow: ${state.loginMode === 'register' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none'};">
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
                  <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 0.5rem;">
                    <img src="${state.registerForm.avatar || '/assets/assoc_amina.jpg'}" id="regAvatarPreview" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-primary); flex-shrink: 0;" />
                    <div style="text-align: left;">
                      <label for="regAvatarInput" class="btn-brand-primary" style="padding: 0.4rem 0.85rem; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                        <i class="fa-solid fa-upload"></i> Upload Headshot
                      </label>
                      <input type="file" id="regAvatarInput" accept="image/*" style="display: none;" />
                      <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.3rem;">JPG or PNG photo file</div>
                    </div>
                  </div>
                </div>

                <!-- FIELD 1: ACCOUNT TYPE -->
                <div class="form-group">
                  <label class="form-label" for="regRole">Account Type</label>
                  <select class="form-select" id="regRole" required style="border-radius: 10px; padding: 0.7rem 1rem;">
                    <option value="associate" ${state.registerForm.role === 'associate' ? 'selected' : ''}>Candidate / Associate Scholar</option>
                    <option value="mentor" ${state.registerForm.role === 'mentor' ? 'selected' : ''}>Mentor / Employer</option>
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

                <!-- FIELD 5: INSTITUTION OR ORGANIZATION -->
                <div class="form-group">
                  <label class="form-label" for="regInstitution">${state.registerForm.role === 'mentor' ? 'Company / Organization' : 'Partner Institution'}</label>
                  <input type="text" class="form-input" id="regInstitution" placeholder="${state.registerForm.role === 'mentor' ? 'e.g. Google / Paystack / Jobberman Partner' : 'e.g. Ashesi University / Carnegie Mellon Africa'}" value="${state.registerForm.institutionOrOrg}" style="border-radius: 10px; padding: 0.7rem 1rem;" />
                </div>

                <!-- FIELD 6: TRACK / DOMAIN -->
                <div class="form-group">
                  <label class="form-label" for="regTrack">${state.registerForm.role === 'mentor' ? 'Domain Expertise' : 'Program Track'}</label>
                  <select class="form-select" id="regTrack" style="border-radius: 10px; padding: 0.7rem 1rem;">
                    <option value="Software Engineering & AI">Software Engineering & AI</option>
                    <option value="Fintech & Product">Fintech & Product</option>
                    <option value="Public Health & Social Impact">Public Health & Social Impact</option>
                    <option value="Software Engineering & Data">Software Engineering & Data</option>
                  </select>
                </div>

                <!-- FIELD 7: BIO -->
                <div class="form-group">
                  <label class="form-label" for="regBio">Biography & Background Summary</label>
                  <textarea class="form-textarea" id="regBio" rows="2" placeholder="Briefly describe your career focus and goals..." style="border-radius: 10px; padding: 0.7rem 1rem;">${state.registerForm.bio}</textarea>
                </div>

                <button type="submit" class="btn-brand-primary login-submit-btn" id="btnSubmitRegister" ${form.isSubmitting ? 'disabled' : ''}>
                  ${form.isSubmitting ? `<i class="fa-solid fa-circle-notch fa-spin"></i> Creating Profile...` : '<i class="fa-solid fa-user-check"></i> CREATE PROFILE & LOG IN'}
                </button>
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

              <!-- Quick Demo Credentials Helper -->
              <div class="demo-credentials-box">
                <div style="font-weight: 800; color: var(--text-secondary);">Need test credentials? Click to fill:</div>
                <div class="demo-cred-buttons">
                  <button type="button" class="demo-cred-btn" data-role="associate" data-email="amina.kwame@ashesi.edu.gh">Associate</button>
                  <button type="button" class="demo-cred-btn" data-role="mentor" data-email="samuel.osei@mcf-mentors.org">Mentor</button>
                  <button type="button" class="demo-cred-btn" data-role="admin" data-email="admin@mcf-portal.org">Admin</button>
                </div>
              </div>
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
      <div class="brand-wrapper">
        <div class="brand-logo-icon"><i class="fa-solid fa-graduation-cap"></i></div>
        <div class="brand-text">
          <span class="brand-name" style="font-size: 1.1rem; line-height: 1.2;">Mastercard Foundation Associate Program</span>
          <span class="brand-tagline">ASSOCIATE MENTORSHIP PORTAL</span>
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
  const availableSlot = mentor.schedule.find(s => !s.isBooked);
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
  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Programme Overview Analytics</h2>

      <div class="stats-overview-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Total Mentees</span>
            <div class="stat-icon"><i class="fa-solid fa-user-graduate"></i></div>
          </div>
          <div class="stat-value">4,120</div>
          <div class="stat-meta">Active Mastercard Scholars</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Active Mentors</span>
            <div class="stat-icon" style="background: var(--badge-green-bg); color: var(--brand-emerald);"><i class="fa-solid fa-user-tie"></i></div>
          </div>
          <div class="stat-value">38</div>
          <div class="stat-meta">Verified Industry Leaders</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Sessions This Month</span>
            <div class="stat-icon" style="background: var(--badge-purple-bg); color: var(--brand-violet);"><i class="fa-solid fa-video"></i></div>
          </div>
          <div class="stat-value">184</div>
          <div class="stat-meta">+18% vs last month</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Attendance Rate</span>
            <div class="stat-icon" style="background: var(--badge-gold-bg); color: var(--brand-gold);"><i class="fa-solid fa-chart-line"></i></div>
          </div>
          <div class="stat-value">96.4%</div>
          <div class="stat-meta">Verified Zoho Logs</div>
        </div>
      </div>
    </div>
  `;
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
                <td style="padding: 0.85rem; font-weight: 800;">${m.name}</td>
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
  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Session Audit & Duration Logs</h2>
      
      <div class="mentor-card">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color);">
              <th style="padding: 0.75rem;">Session ID</th>
              <th style="padding: 0.75rem;">Mentor</th>
              <th style="padding: 0.75rem;">Associate</th>
              <th style="padding: 0.75rem;">Date & Time</th>
              <th style="padding: 0.75rem;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${state.sessions.map(s => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem; font-weight: 800;">${s.id}</td>
                <td style="padding: 0.85rem;">${s.mentorName}</td>
                <td style="padding: 0.85rem;">${s.associateName}</td>
                <td style="padding: 0.85rem;">${s.date} (${s.time})</td>
                <td style="padding: 0.85rem;"><span class="badge-tag badge-blue">${s.status}</span></td>
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
            <img src="${m.avatar}" class="mentor-avatar-lg" />
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

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="editMentorName" value="${m.name}" />
          </div>

          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-image"></i> Profile Picture URL</label>
            <input type="url" class="form-input" id="editMentorAvatar" value="${m.avatar}" placeholder="/assets/mentor_samuel.jpg or https://..." />
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

    // Booking Button on Landing Page Card (Prompts Login if unauthenticated)
    document.querySelectorAll('.btn-landing-book').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.currentUser) {
          showToast('Please sign in to book a mentorship session.', 'fa-circle-info');
          navigateTo('/login');
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

    // Sign Up Profile Photo File Upload Listener
    const regAvatarInput = document.getElementById('regAvatarInput');
    if (regAvatarInput) {
      regAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            state.registerForm.avatar = evt.target.result;
            const preview = document.getElementById('regAvatarPreview');
            if (preview) preview.src = evt.target.result;
            showToast('Profile photo selected!', 'fa-image');
          };
          reader.readAsDataURL(file);
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
        const institutionOrOrg = document.getElementById('regInstitution')?.value;
        const trackOrDomain = document.getElementById('regTrack')?.value;
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
            institutionOrOrg,
            title: role === 'associate' ? 'Mastercard Foundation Scholar' : 'Executive Mentor',
            trackOrDomain,
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
    document.getElementById('btnHeroGroupSessions')?.addEventListener('click', () => { state.associateTab = 'group_sessions'; render(); });

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
      const activeMentor = state.mentors[state.currentMentorIndex];
      const dateInput = document.getElementById('inputSlotDate');
      const timeInput = document.getElementById('inputSlotTime');

      if (dateInput && timeInput && dateInput.value && timeInput.value) {
        await apiService.addMentorSlot(activeMentor.id, {
          date: dateInput.value,
          time: timeInput.value
        });
        showToast('Availability slot added!');
        await initAppData();
      }
    });

    // Mentor Remove Slot
    document.querySelectorAll('.btn-remove-slot').forEach(btn => {
      btn.addEventListener('click', async () => {
        const activeMentor = state.mentors[state.currentMentorIndex];
        await apiService.removeMentorSlot(activeMentor.id, parseInt(btn.dataset.idx, 10));
        showToast('Slot removed!');
        await initAppData();
      });
    });

    // Mentor Accept Session
    document.querySelectorAll('.btn-accept-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        await apiService.acceptBookingSession(btn.dataset.id);
        showToast('Session accepted & Zoho meeting link created!');
        await initAppData();
      });
    });

    // Mentor Edit Profile
    document.getElementById('btnEditMyProfile')?.addEventListener('click', () => {
      const activeMentor = state.mentors[state.currentMentorIndex];
      state.editingMentorProfile = activeMentor;
      state.activeModal = 'edit_mentor_profile';
      render();
    });

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

      await apiService.updateMentorProfile(activeMentor.id, {
        name,
        avatar,
        title,
        organization,
        domain,
        bio,
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
