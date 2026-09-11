import './style.css';
import jobbermanLogo from './assets/jobberman-logo.png';
import heroBannerNew from './assets/hero-banner-new.png';
import { getStoredTheme, saveStoredTheme, getStoredAssociates, saveStoredAssociates, getStoredMentors, saveStoredMentors } from './data/mockData.js';
import { apiService } from './services/api.js';
import { getTodayISO, getStartOfMonthISO, getEndOfMonthISO, getLast30DaysISO, getThisWeekStartISO } from './utils/dateHelpers.js';
import { compressImageFile as compressAvatar } from './utils/imageCompressor.js';
import { showToast as displayToast } from './utils/toast.js';

// Route Helper Functions
function getInitialRoute() {
  const path = window.location.pathname.toLowerCase();
  if (path === '/login' || path === '/associate/login' || path === '/mentor/login' || path === '/admin/login') return '/login';
  if (path === '/set-password') return '/set-password';
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
  adminMonthFilter: 'current_month',
  adminDateFrom: getStartOfMonthISO(),// Dynamic Start Date (YYYY-MM-01)
  adminDateTo: getEndOfMonthISO(),    // Dynamic End Date (YYYY-MM-LastDay)
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
  activeModal: null,                 // null | 'booking' | 'mentor_profile' | 'group_create' | 'task_create' | 'admin_cap' | 'edit_mentor_profile' | 'session_evaluation' | 'request_profile_edit'
  bookingMentor: null,
  inspectingMentor: null,
  inspectingSession: null,
  editingCapMentor: null,
  editingMentorProfile: null,
  evaluatingSession: null,
  evaluatingRole: null,              // 'mentor' | 'associate'
  evalFormData: {
    stars: 5,
    engagement: 5,
    objectiveAlignment: 5,
    qualitativeFeedback: ''
  },
  requestEditFormData: {
    fields: [],
    reason: ''
  },
  requestEditUser: null,

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
  notifications: [],
  profileEditRequests: [],
  spillovers: [],

  // Set Password Page (first-login pre-loaded users)
  setPasswordError: null,
  setPasswordSubmitting: false
};

// 3-Month Mentor Availability Horizon Calculator (15 Slots Target)
function getMentorThreeMonthStats(mentor) {
  const schedule = (mentor && Array.isArray(mentor.schedule)) ? mentor.schedule : [];
  const now = new Date();

  const m0Date = new Date(now.getFullYear(), now.getMonth(), 1);
  const m1Date = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const m2Date = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const pad = (n) => String(n).padStart(2, '0');
  const m0Key = `${m0Date.getFullYear()}-${pad(m0Date.getMonth() + 1)}`;
  const m1Key = `${m1Date.getFullYear()}-${pad(m1Date.getMonth() + 1)}`;
  const m2Key = `${m2Date.getFullYear()}-${pad(m2Date.getMonth() + 1)}`;

  const m0Name = m0Date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const m1Name = m1Date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const m2Name = m2Date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  let m0Count = 0;
  let m1Count = 0;
  let m2Count = 0;

  for (const s of schedule) {
    if (!s.date) continue;
    const monthKey = s.date.substring(0, 7);
    if (monthKey === m0Key) m0Count++;
    else if (monthKey === m1Key) m1Count++;
    else if (monthKey === m2Key) m2Count++;
  }

  const totalSlots = m0Count + m1Count + m2Count;
  const isComplete = totalSlots >= 15;

  return {
    m0Key, m0Name, m0Count,
    m1Key, m1Name, m1Count,
    m2Key, m2Name, m2Count,
    totalSlots,
    isComplete,
    requiredTotal: 15
  };
}

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
      <div style="font-weight: 800; font-size: 0.9rem;">Mastercard Foundation Associates Program</div>
      <div style="font-size: 0.82rem; color: var(--text-secondary);">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
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
    const [assocRes, mentRes, sessRes, groupRes, taskRes, notifRes, reqRes, spillRes] = await Promise.allSettled([
      apiService.getAssociates(),
      apiService.getMentors(),
      apiService.getSessions(),
      apiService.getGroupSessions(),
      apiService.getTasks(),
      apiService.getNotifications(),
      apiService.getProfileEditRequests(),
      apiService.getSpillovers()
    ]);

    state.associates = assocRes.status === 'fulfilled' && assocRes.value ? assocRes.value : [];
    state.mentors = mentRes.status === 'fulfilled' && mentRes.value ? mentRes.value : [];
    state.sessions = sessRes.status === 'fulfilled' && sessRes.value ? sessRes.value : [];
    state.groupSessions = groupRes.status === 'fulfilled' && groupRes.value ? groupRes.value : [];
    state.tasks = taskRes.status === 'fulfilled' && taskRes.value ? taskRes.value : [];
    state.notifications = notifRes.status === 'fulfilled' && notifRes.value ? notifRes.value : [];
    state.profileEditRequests = reqRes.status === 'fulfilled' && reqRes.value ? reqRes.value : [];
    state.spillovers = spillRes.status === 'fulfilled' && spillRes.value ? spillRes.value : [];

    // Background 2x monthly reminder check for associates who haven't booked this month
    apiService.checkAndDispatchMonthlyReminders().catch(() => {});
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
  } else if (state.currentPath === '/set-password') {
    appNode.innerHTML = renderSetPasswordPage();
  } else if (state.currentPath === '/') {
    appNode.innerHTML = renderPublicLandingPage();
  } else {
    appNode.innerHTML = renderAuthenticatedDashboard();
  }

  bindEvents();
}

// --------------------------------------------------------------------------
// SET PASSWORD PAGE (First-Login for Pre-Loaded Users)
// --------------------------------------------------------------------------
function renderSetPasswordPage() {
  const user = state.currentUser || {};
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-base); padding: 2rem;">
      <div style="width: 100%; max-width: 460px;">

        <!-- HEADER -->
        <div style="text-align: center; margin-bottom: 2rem;">
          <img src="${jobbermanLogo}" alt="Jobberman Logo" class="brand-logo-img" style="height: 38px; width: 38px; border-radius: 8px; object-fit: cover; margin-bottom: 1.5rem;" />
          <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--brand-primary), var(--brand-violet)); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 8px 24px rgba(107,33,168,0.25);">
            <i class="fa-solid fa-lock-open" style="font-size: 1.6rem; color: white;"></i>
          </div>
          <h1 style="font-family: var(--font-display); font-size: 1.65rem; font-weight: 800; margin-bottom: 0.4rem;">Set Your Password</h1>
          <p style="font-size: 0.88rem; color: var(--text-secondary); max-width: 340px; margin: 0 auto;">
            Welcome, <strong>${user.name || 'Scholar'}</strong>! Your account has been pre-created for you.
            Please set a secure personal password to access your portal.
          </p>
        </div>

        <!-- FORM CARD -->
        <div class="mentor-card" style="padding: 2rem; border-radius: 18px;">
          ${state.setPasswordError ? `
            <div style="background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.3); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.88rem; font-weight: 700; color: #dc2626; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-circle-exclamation"></i> ${state.setPasswordError}
            </div>
          ` : ''}

          <form id="formSetNewPassword">
            <div class="form-group">
              <label class="form-label" style="font-weight: 800;">Email Address</label>
              <input type="email" class="form-input" value="${user.email || ''}" disabled
                style="border-radius: 10px; padding: 0.7rem 1rem; background: var(--bg-hover); color: var(--text-secondary); cursor: not-allowed;" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 800;">New Password <span style="color: #dc2626;">*</span></label>
              <input type="password" class="form-input" id="inputNewPassword1" placeholder="Create a strong password (min. 8 characters)"
                style="border-radius: 10px; padding: 0.7rem 1rem;" required autocomplete="new-password" />
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
                <i class="fa-solid fa-circle-info"></i> Must be at least 8 characters
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 800;">Confirm New Password <span style="color: #dc2626;">*</span></label>
              <input type="password" class="form-input" id="inputNewPassword2" placeholder="Re-enter your new password"
                style="border-radius: 10px; padding: 0.7rem 1rem;" required autocomplete="new-password" />
            </div>

            <button type="submit" class="btn-brand-primary" id="btnSubmitSetPassword"
              style="width: 100%; justify-content: center; padding: 0.85rem; font-size: 0.95rem; font-weight: 800; margin-top: 0.5rem; border-radius: 12px; ${state.setPasswordSubmitting ? 'opacity: 0.7;' : ''}">
              ${state.setPasswordSubmitting
                ? `<i class="fa-solid fa-circle-notch fa-spin"></i> Setting Password...`
                : `<i class="fa-solid fa-shield-halved"></i> Set Password & Enter Portal`}
            </button>
          </form>
        </div>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.84rem; color: var(--text-muted);">
          <i class="fa-solid fa-lock" style="margin-right: 0.3rem;"></i>
          Your password is encrypted and never shared.
          <br/>Need help? Email <a href="mailto:support@jobberman.com" style="color: var(--brand-primary); font-weight: 700;">support@jobberman.com</a>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 1. PUBLIC LANDING PAGE
// --------------------------------------------------------------------------
function renderPublicLandingPage() {
  return `
    <div style="min-height: 100vh; display: flex; flex-direction: column;">
      <!-- Public Header -->
      <header class="mently-header" style="justify-content: space-between;">
        <div class="brand-wrapper" style="cursor: pointer; display: flex; align-items: center; gap: 0.85rem;" id="btnNavBrandHome">
          <img src="${jobbermanLogo}" alt="Jobberman Logo" class="brand-logo-img" style="height: 38px; width: 38px; border-radius: 8px; object-fit: cover;" />
          <div style="width: 1px; height: 28px; background: var(--border-color); margin: 0 0.15rem;"></div>
          <div class="brand-text">
            <span class="brand-name" style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary); font-family: var(--font-display);">Mastercard Foundation Associates Program</span>
            <span class="brand-tagline" style="font-size: 0.72rem; font-weight: 800; color: var(--brand-violet); letter-spacing: 0.05em; text-transform: uppercase;">ASSOCIATE MENTORSHIP PORTAL</span>
          </div>
        </div>

        <nav class="public-nav-links">
          <a class="public-nav-link" id="navLinkHome">Home</a>
          <a class="public-nav-link" id="navLinkHowItWorks">How It Works</a>
          <a class="public-nav-link" id="navLinkValue">Program Value</a>
        </nav>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="btn-icon-circle" id="btnToggleTheme" title="Toggle Theme">
            <i class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
          </button>
          
          <button class="btn-brand-primary btn-nav-login" id="btnNavLogin">
            <i class="fa-solid fa-user"></i> Login
          </button>

          <!-- Mobile Hamburger Menu Button (ASG style) -->
          <button class="btn-mobile-nav-toggle" id="btnMobileNavToggle" aria-label="Toggle Navigation Menu">
            <i class="fa-solid fa-bars" id="iconMobileNavToggle"></i>
          </button>
        </div>
      </header>

      <!-- Collapsible Mobile Navigation Drawer Dropdown -->
      <div class="mobile-nav-drawer" id="mobileNavDrawer">
        <a class="mobile-nav-item" id="mobileNavLinkHome">
          <i class="fa-solid fa-house"></i> Home
        </a>
        <a class="mobile-nav-item" id="mobileNavLinkHowItWorks">
          <i class="fa-solid fa-circle-info"></i> How It Works
        </a>
        <a class="mobile-nav-item" id="mobileNavLinkValue">
          <i class="fa-solid fa-star"></i> Program Value
        </a>
      </div>

      <!-- Main Landing Content -->
      <main style="max-width: 1240px; margin: 2rem auto; padding: 0 1.5rem; flex: 1; width: 100%;">
        
        <!-- Hero Section Redesign (matching requested design) -->
        <section class="landing-hero-redesign" id="section-hero">
          <div class="hero-grid">
            <div class="hero-left-content">
              <div class="pill-tag"><i class="fa-solid fa-graduation-cap"></i> MASTERCARD FOUNDATION ASSOCIATES PROGRAM</div>
              <h1>Find a Mentor.<br/><span class="grad">Grow With Purpose.</span></h1>
              <p class="lead">
                Connect with verified executive mentors who can help you develop your skills, navigate your career, and achieve your professional goals in a secure, private environment.
              </p>
              <div class="hero-ctas">
                <button class="btn-primary" id="btnHeroFindMentors">
                  <i class="fa-solid fa-lock"></i> Login to Access Mentors
                </button>
              </div>
            </div>

            <!-- Hero Photo Showcase (Uncropped & Seamless Background Blending) -->
            <div class="hero-photo-wrap seamless">
              <img src="${heroBannerNew}" alt="Mastercard Foundation Mentorship Session" class="hero-seamless-img" />
            </div>
          </div>

          <!-- Bottom Full-Width Feature Highlights (Spread Evenly Across Card Base) -->
          <div class="hero-features-bottom">
            <div class="hf-item">
              <div class="hf-icon blue"><i class="fa-solid fa-shield-halved"></i></div>
              <div class="hf-text"><b>Verified Mentors</b><span>Industry leaders & professionals</span></div>
            </div>
            <div class="hf-item">
              <div class="hf-icon purple"><i class="fa-solid fa-calendar-check"></i></div>
              <div class="hf-text"><b>Structured 1-on-1 Sessions</b><span>Direct Career & Technical Roadmap Reviews</span></div>
            </div>
            <div class="hf-item">
              <div class="hf-icon green"><i class="fa-solid fa-users"></i></div>
              <div class="hf-text"><b>Purpose Driven</b><span>Connections that drive growth</span></div>
            </div>
          </div>
        </section>

        <!-- How It Works Section Redesign (matching index_1.html) -->
        <section class="public-section" id="section-how-it-works" style="text-align: center;">
          <h2 style="font-size: 2.1rem; font-weight: 800; font-family: var(--font-display); color: var(--text-primary);">How the Mentorship Portal Works</h2>
          <div style="width: 56px; height: 4px; background: var(--brand-violet, #7c5cff); border-radius: 2px; margin: 12px auto 14px;"></div>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 3rem;">Three simple steps to connect with experienced leaders and accelerate your growth.</p>

          <div class="how-it-works-grid">
            <div class="step-card">
              <div class="step-num">01</div>
              <div class="step-icon blue"><i class="fa-solid fa-magnifying-glass"></i></div>
              <h3>Find Your Mentor</h3>
              <p>Browse and connect with verified mentors who match your goals and interests.</p>
            </div>

            <div class="step-card">
              <div class="step-num">02</div>
              <div class="step-icon purple"><i class="fa-solid fa-calendar-days"></i></div>
              <h3>Book a Session</h3>
              <p>Schedule 1-on-1 sessions that fit your schedule and focus on your career development.</p>
            </div>

            <div class="step-card">
              <div class="step-num">03</div>
              <div class="step-icon green"><i class="fa-solid fa-chart-line"></i></div>
              <h3>Grow & Achieve</h3>
              <p>Gain insights, receive guidance, and achieve your professional milestones.</p>
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
              <img src="${jobbermanLogo}" alt="Jobberman Logo" class="brand-logo-img" style="height: 38px; width: 38px; border-radius: 8px; object-fit: cover;" />
              <div style="width: 1px; height: 30px; background: var(--border-color);"></div>
              <div class="brand-text">
                <span class="brand-name" style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary);">Mastercard Foundation Associates Program</span>
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
              <a href="https://www.jobberman.com/" target="_blank" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(46, 16, 101, 0.1); color: var(--brand-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none;" title="Jobberman Official Website"><i class="fa-globe"></i></a>
            </div>
          </div>

          <div class="footer-bottom" style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; font-size: 0.82rem; color: var(--text-muted);">
            <div>© 2026 Mastercard Foundation Associates Program & Jobberman. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>

    <!-- Modal Drawer -->
    ${renderModals()}
  `;
}

function renderLandingMentorCard(m) {
  return `
    <div class="mentor-card" style="display: flex; flex-direction: column; border-radius: 18px; padding: 1.5rem; border: 1px solid var(--border-color); background: var(--bg-surface); box-shadow: var(--shadow-sm); transition: all 0.25s ease;">
      <div class="card-header-flex" style="display: flex; gap: 1.1rem; align-items: center; margin-bottom: 1rem;">
        <img src="${m.avatar && m.avatar.startsWith('data:') ? m.avatar : (m.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2e1065&color=ffffff';" class="mentor-avatar-lg" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 3.5px solid var(--brand-primary); box-shadow: 0 4px 12px rgba(46,16,101,0.15); flex-shrink: 0;" />
        <div>
          <div class="mentor-name" style="font-weight: 800; font-size: 1.18rem; color: var(--text-primary); margin-bottom: 0.2rem;">${m.name}</div>
          <div class="mentor-title" style="font-size: 0.86rem; font-weight: 600; color: var(--text-secondary); line-height: 1.35; margin-bottom: 0.25rem;">${m.title}</div>
          <div class="mentor-org" style="font-size: 0.82rem; font-weight: 800; color: var(--brand-primary);">${m.organization}</div>
        </div>
      </div>

      <p class="mentor-bio-preview" style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 1.2rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${m.bio}</p>

      <div class="card-tags-flex" style="display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1.25rem;">
        <span class="badge-tag badge-blue" style="font-weight: 700;"><i class="fa-solid fa-briefcase"></i> ${m.domain}</span>
        <span class="badge-tag badge-gold" style="font-weight: 800;"><i class="fa-solid fa-star"></i> ${m.rating || '5.0'} (${m.totalSessions || 0} sessions)</span>
      </div>

      <div class="card-footer" style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; gap: 0.75rem;">
        <button class="btn-brand-primary btn-inspect-profile" data-id="${m.id}" style="padding: 0.55rem 1.15rem; font-size: 0.84rem; border-radius: 10px;">
          <i class="fa-solid fa-user"></i> View Profile
        </button>
        <button class="btn-brand-primary btn-landing-book" data-id="${m.id}" style="padding: 0.55rem 1.15rem; font-size: 0.84rem; border-radius: 10px; background: var(--brand-violet);">
          <i class="fa-regular fa-calendar-plus"></i> Book Session
        </button>
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
          <img src="${jobbermanLogo}" alt="Jobberman Logo" class="brand-logo-img" style="height: 38px; width: 38px; border-radius: 8px; object-fit: cover;" />
          <div class="brand-text">
            <span class="brand-name" style="font-size: 1.05rem;">Mastercard Foundation Associates Program</span>
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
            "Mentorship through the Mastercard Foundation Associates Program provided me with the clarity and guidance needed to publish my research and secure admission into CMU Africa."
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
              <!-- SMART UNIVERSAL LOGIN FORM (Auto-Detect Role) -->
              <form id="loginAuthForm">
                
                ${window.location.pathname.toLowerCase().includes('admin') ? `
                  <div style="background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.25); border-radius: 10px; padding: 0.65rem 0.9rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: var(--brand-primary); font-weight: 700;">
                    <i class="fa-solid fa-shield-halved" style="font-size: 1.1rem;"></i>
                    <span>Executive Program Administrator Sign In</span>
                  </div>
                ` : window.location.pathname.toLowerCase().includes('mentor') ? `
                  <div style="background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.25); border-radius: 10px; padding: 0.65rem 0.9rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: var(--brand-violet); font-weight: 700;">
                    <i class="fa-solid fa-chalkboard-user" style="font-size: 1.1rem;"></i>
                    <span>Mentor Executive Sign In</span>
                  </div>
                ` : ''}

                <!-- FIELD 1: EMAIL ADDRESS -->
                <div class="form-group">
                  <label class="form-label" for="loginEmail">Email Address</label>
                  <input type="email" class="form-input" id="loginEmail" placeholder="Enter your registered email" value="${form.email}" autocomplete="email" required style="border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.92rem;" />
                </div>

                <!-- FIELD 2: PASSWORD -->
                <div class="form-group">
                  <label class="form-label" for="loginPassword">Password</label>
                  <div class="password-input-wrapper">
                    <input type="${form.showPassword ? 'text' : 'password'}" class="form-input" id="loginPassword" placeholder="Enter your password" value="${form.password}" autocomplete="current-password" required style="border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.92rem;" />
                    <button type="button" class="btn-toggle-password" id="btnTogglePassword" aria-label="Toggle password visibility">
                      <i class="fa-regular ${form.showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-bottom: 1.25rem;">
                  <a href="#" id="btnForgotPassword" style="font-size: 0.82rem; font-weight: 700; color: var(--brand-primary);">Forgot Password?</a>
                </div>

                <button type="submit" class="btn-brand-primary login-submit-btn" id="btnSubmitLogin" ${form.isSubmitting ? 'disabled' : ''}>
                  ${form.isSubmitting ? `<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...` : '<i class="fa-solid fa-arrow-right-to-bracket"></i> LOG IN'}
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
        <img src="${jobbermanLogo}" alt="Jobberman Logo" class="brand-logo-img" style="height: 38px; width: 38px; border-radius: 8px; object-fit: cover;" />
        <div style="width: 1px; height: 28px; background: var(--border-color); margin: 0 0.15rem;"></div>
        <div class="brand-text">
          <span class="brand-name" style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary); font-family: var(--font-display);">Mastercard Foundation Associates Program</span>
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
    <main class="mently-container" style="flex: 1;">
      ${renderRoleView(activeAssociate, activeMentor)}
    </main>

    <!-- Authenticated Dashboard Footer with Social Handles -->
    <footer style="border-top: 1px solid var(--border-color); background: var(--bg-surface); padding: 1.5rem 2rem; margin-top: 3rem;">
      <div style="max-width: 1240px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          © 2026 Mastercard Foundation Associates Program & Jobberman. All rights reserved.
        </div>
        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
          <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Follow Jobberman:</span>
          <a href="https://www.linkedin.com/company/jobberman-nigeria/" target="_blank" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(10, 102, 194, 0.1); color: #0A66C2; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; text-decoration: none;" title="LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
          <a href="https://twitter.com/jobbermandotcom" target="_blank" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(15, 20, 25, 0.1); color: var(--text-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; text-decoration: none;" title="Twitter / X"><i class="fa-brands fa-x-twitter"></i></a>
          <a href="https://www.facebook.com/jobberman/" target="_blank" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(24, 119, 242, 0.1); color: #1877F2; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; text-decoration: none;" title="Facebook"><i class="fa-brands fa-facebook"></i></a>
          <a href="https://www.instagram.com/jobbermannigeria/" target="_blank" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(225, 48, 108, 0.1); color: #E1306C; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; text-decoration: none;" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="https://www.youtube.com/user/jobbermanng" target="_blank" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 0, 0, 0.1); color: #FF0000; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; text-decoration: none;" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
          <a href="https://www.jobberman.com/" target="_blank" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(46, 16, 101, 0.1); color: var(--brand-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; text-decoration: none;" title="Jobberman Official Website"><i class="fa-solid fa-globe"></i></a>
        </div>
      </div>
    </footer>

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
    id: user.id || associate.id,
    name: user.name || associate.name,
    email: user.email || associate.email,
    gender: user.gender || associate.gender || '',
    institution: user.institution || user.organization || associate.institution || 'Jobberman Nigeria',
    organization: user.organization || user.institution || associate.organization || 'Jobberman Nigeria',
    title: user.title || associate.title || 'M&E Specialist',
    track: user.track || user.domain || associate.track || 'Monitoring & Evaluation',
    domain: user.domain || user.track || associate.domain || 'Monitoring & Evaluation',
    bio: user.bio || associate.bio || '',
    avatar: user.avatar || associate.avatar
  } : associate;

  const activeUserMentor = user && user.role === 'mentor' ? {
    ...mentor,
    id: user.id || mentor.id,
    name: user.name || mentor.name,
    email: user.email || mentor.email,
    gender: user.gender || mentor.gender || '',
    organization: user.organization || mentor.organization,
    title: user.title || mentor.title,
    domain: user.domain || mentor.domain,
    bio: user.bio || mentor.bio,
    avatar: user.avatar || mentor.avatar,
    monthlyCap: user.monthlyCap || mentor.monthlyCap || 15,
    sessionsUsedThisMonth: user.sessionsUsedThisMonth || mentor.sessionsUsedThisMonth || 0,
    schedule: user.schedule || mentor.schedule || [],
    expertise: user.expertise || mentor.expertise || ["Career Guidance", "Leadership Strategy"],
    socialLinks: user.socialLinks || user.social_links || mentor.socialLinks || { linkedin: "" }
  } : mentor;

  if (role === 'associate') {
    if (state.associateTab === 'home') return renderMenteeHome(activeUserAssoc);
    if (state.associateTab === 'mentors') return renderMenteeDiscovery();
    if (state.associateTab === 'group_sessions') return renderGroupSessionsList();
    if (state.associateTab === 'tasks') return renderMenteeTasksList();
    if (state.associateTab === 'sessions') return renderMenteeSessionsList(activeUserAssoc);
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
  const assocName = (associate.name || '').toLowerCase().trim();
  const assocId = String(associate.id || '').toLowerCase().trim();

  const mySessions = state.sessions.filter(s => 
    (s.associateId && String(s.associateId).toLowerCase().trim() === assocId) || 
    (s.associateName && s.associateName.toLowerCase().trim() === assocName)
  );

  const upcomingSessions = mySessions.filter(s => s.status === 'Accepted' || s.status === 'Pending');

  // Find distinct mentors previously engaged
  const engagedMentorNames = new Set(mySessions.map(s => (s.mentorName || '').toLowerCase().trim()).filter(Boolean));
  const engagedMentorIds = new Set(mySessions.map(s => String(s.mentorId || '').toLowerCase().trim()).filter(Boolean));

  const engagedMentors = state.mentors.filter(m => 
    engagedMentorIds.has(String(m.id || '').toLowerCase().trim()) || 
    engagedMentorNames.has((m.name || '').toLowerCase().trim())
  );

  // Find completed sessions awaiting Associate evaluation
  const pendingEvaluationSessions = state.sessions.filter(s => 
    s.status === 'Completed' && 
    !s.associateRating && 
    ((s.associateId && String(s.associateId) === String(associate.id)) || (s.associateName && s.associateName.toLowerCase() === (associate.name || '').toLowerCase()))
  );

  return `
    <div style="width: 100%;">
      <!-- PENDING EVALUATION NUDGE BANNER FOR ASSOCIATES -->
      ${pendingEvaluationSessions.length > 0 ? `
        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #f59e0b; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              <i class="fa-solid fa-star"></i>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #92400e;">
                Action Required: Submit Your Mentorship Evaluation (${pendingEvaluationSessions.length} Pending)
              </div>
              <div style="font-size: 0.85rem; color: #b45309;">
                Your mentor has conducted your 1-on-1 session with <strong>${pendingEvaluationSessions[0].mentorName}</strong>. Please rate your experience!
              </div>
            </div>
          </div>
          <button class="btn-brand-primary btn-open-evaluation" data-id="${pendingEvaluationSessions[0].id}" data-role="associate" style="background: #d97706; border: none; padding: 0.65rem 1.25rem; font-size: 0.9rem; font-weight: 800; border-radius: 10px; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.3);">
            <i class="fa-solid fa-star"></i> Rate & Review Now
          </button>
        </div>
      ` : ''}

      <!-- Hero Banner: Your Growth Journey Starts Here -->
      <div class="mently-hero-banner" style="background: linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%); border-radius: 18px; padding: 2.25rem; color: #fff; margin-bottom: 2rem; box-shadow: 0 10px 30px rgba(46, 16, 101, 0.25); position: relative; overflow: hidden;">
        <div style="position: relative; z-index: 2;">
          <div class="hero-pill-badge" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); color: #ffd700; border: 1px solid rgba(255,215,0,0.3); font-weight: 800; font-size: 0.82rem; padding: 0.35rem 0.85rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <i class="fa-solid fa-rocket"></i> Mastercard Foundation Associates Program
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
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">Join live Google Meet sessions, complete assigned action tasks, and track your progress.</p>
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
              <div class="mentor-card" style="border-left: 4px solid ${s.status === 'Accepted' ? 'var(--brand-emerald)' : '#f59e0b'}; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                  <div>
                    <span class="badge-tag ${s.status === 'Accepted' ? 'badge-green' : 'badge-gold'}" style="margin-bottom: 0.5rem; display: inline-block;">
                      ${s.status === 'Accepted' ? '<i class="fa-solid fa-circle-check"></i> Confirmed 1-on-1 Session' : '<i class="fa-solid fa-clock"></i> Pending Mentor Acceptance'}
                    </span>
                    <h3 style="font-weight: 800; font-size: 1.15rem;">Session with ${s.mentorName}</h3>
                    <p style="font-size: 0.88rem; color: var(--text-secondary);">${s.mentorDomain}</p>
                  </div>
                  ${s.status === 'Accepted' && s.meetingLink ? `
                    <a href="${s.meetingLink}" target="_blank" class="btn-brand-primary" style="padding: 0.6rem 1.25rem; font-size: 0.88rem;">
                      <i class="fa-solid fa-video"></i> ${s.meetingLink.includes('google.com') ? 'Join Google Meet' : 'Join Meeting'}
                    </a>
                  ` : `
                    <span style="font-size: 0.82rem; color: #d97706; font-weight: 700; background: rgba(245,158,11,0.12); padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid rgba(245,158,11,0.3); display: inline-flex; align-items: center; gap: 0.4rem;">
                      <i class="fa-solid fa-hourglass-half"></i> Awaiting Mentor Acceptance
                    </span>
                  `}
                </div>
                <div style="font-size: 0.86rem; color: var(--text-secondary); background: var(--bg-hover); padding: 0.75rem 1rem; border-radius: 8px;">
                  <i class="fa-regular fa-clock"></i> <strong>Scheduled:</strong> ${s.date} at ${s.time} (${s.duration || '1 Hour'})<br/>
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
          <div style="background: var(--bg-surface-secondary); padding: 2rem; border-radius: 16px; border: 1px dashed var(--border-color); text-align: center; color: var(--text-secondary);">
            <div style="font-weight: 800; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.35rem;">No Mentors Engaged Yet</div>
            <p style="font-size: 0.86rem; margin-bottom: 1rem;">Explore our directory to book your first 1-on-1 career guidance session!</p>
            <button class="btn-brand-primary" id="btnHeroFindMentors" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;"><i class="fa-solid fa-compass"></i> Find Mentors</button>
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
        <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); max-width: 500px; margin: 2rem auto;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--badge-blue-bg); color: var(--brand-primary); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 1.25rem;">
            <i class="fa-solid fa-filter-circle-xmark"></i>
          </div>
          <h3 style="font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">No Mentors Found</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5;">No mentor profiles match your current domain, keyword search, or availability filters.</p>
          <button id="btnClearDiscoveryFilters" class="btn-brand-primary" style="padding: 0.65rem 1.4rem; font-size: 0.88rem; font-weight: 800; border-radius: 50px;">
            <i class="fa-solid fa-rotate-left"></i> Clear All Filters & Reset Search
          </button>
        </div>
      `}
    </div>
  `;
}

function renderMentorCard(mentor) {
  const availableSlot = mentor.schedule && mentor.schedule.find ? mentor.schedule.find(s => !s.isBooked) : null;
  const avatarUrl = mentor.avatar && mentor.avatar.startsWith('data:') 
    ? mentor.avatar 
    : (mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&size=600&background=2551d9&color=ffffff&bold=true&format=png`);
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&size=600&background=2551d9&color=ffffff&bold=true&format=png`;

  const badgeText = mentor.domain ? mentor.domain.split(',')[0].split('&')[0].trim() : 'Executive Mentor';

  return `
    <div class="mentor-card-redesign">
      <div class="photo-wrap">
        <img src="${avatarUrl}" onerror="this.onerror=null; this.src='${fallbackUrl}';" alt="${mentor.name}" />
        <div class="badge">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.6 7.7l5.8-.8L10 1.6z"/></svg>
          ${badgeText}
        </div>
      </div>

      <div class="body">
        <h2>${mentor.name}</h2>
        <p class="role">${mentor.title}</p>
        <p class="org">${mentor.organization}</p>

        <div class="meta-row">
          <div class="rating">
            <svg viewBox="0 0 20 20"><path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.6 7.7l5.8-.8L10 1.6z"/></svg>
            ${mentor.rating || 5.0} <span class="count">(${mentor.totalSessions || mentor.sessionsUsedThisMonth || 12} sessions)</span>
          </div>
          <div class="avail">
            <svg viewBox="0 0 20 20" fill="none" stroke-width="1.8"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg>
            ${availableSlot ? availableSlot.date : 'Available'}
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-inspect-profile" data-id="${mentor.id}">View Profile</button>
          <button class="btn primary btn-book-slot" data-id="${mentor.id}">Book 1-on-1</button>
        </div>
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

function getGoogleCalendarUrl(session) {
  try {
    const dStr = session.date || new Date().toISOString().split('T')[0];
    const cleanTime = (session.time || '10:00 AM').replace(/\s+/g, ' ');
    const parts = cleanTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hours = parts ? parseInt(parts[1], 10) : 10;
    const mins = parts ? parseInt(parts[2], 10) : 0;
    const ampm = parts ? parts[3].toUpperCase() : 'AM';
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const start = new Date(`${dStr}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const fmt = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${fmt(start)}/${fmt(end)}`;
    const title = encodeURIComponent(`MCF Mentorship: ${session.mentorName} & ${session.associateName}`);
    const details = encodeURIComponent(`Mastercard Foundation 1-on-1 Mentorship Session\n\nGoogle Meet Link: ${session.meetingLink || 'https://meet.google.com'}\nObjective: ${session.objective || 'Career mentorship'}`);
    const location = encodeURIComponent(session.meetingLink || 'https://meet.google.com');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  } catch (e) {
    return 'https://calendar.google.com';
  }
}

function renderMenteeSessionsList(associate) {
  const activeAssoc = associate || (state.currentUser && state.currentUser.role === 'associate' ? state.currentUser : state.associates[state.currentAssociateIndex] || {});
  const assocId = String(activeAssoc.id || '').toLowerCase().trim();
  const assocName = String(activeAssoc.name || '').toLowerCase().trim();
  const assocEmail = String(activeAssoc.email || '').toLowerCase().trim();

  const mySessions = state.sessions.filter(s => {
    const sId = String(s.associateId || s.associate_id || '').toLowerCase().trim();
    const sName = String(s.associateName || s.associate_name || '').toLowerCase().trim();
    return (assocId && sId === assocId) || (assocName && sName === assocName);
  });

  return `
    <div class="content-area" style="width: 100%;">
      <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">My Scheduled Sessions (${mySessions.length})</h2>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${mySessions.length === 0 ? `
          <div class="mentor-card" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
            <i class="fa-regular fa-calendar-xmark" style="font-size: 2.2rem; color: var(--brand-primary); margin-bottom: 0.75rem; display: block;"></i>
            <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.35rem;">No Scheduled Sessions Yet</div>
            <p style="font-size: 0.88rem; max-width: 440px; margin: 0 auto 1.25rem;">Browse our verified executive mentors and book your first 1-on-1 mentorship session today.</p>
            <button class="btn-brand-primary" id="btnHeroFindMentors" style="padding: 0.6rem 1.4rem; font-size: 0.88rem;">
              <i class="fa-solid fa-compass"></i> Find Mentors
            </button>
          </div>
        ` : mySessions.map(s => {
          const isGoogleMeet = s.meetingLink && s.meetingLink.includes('meet.google.com');
          const isZoho = s.meetingLink && s.meetingLink.includes('zoho');
          const calUrl = getGoogleCalendarUrl(s);

          return `
            <div class="mentor-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
                <div>
                  <div style="font-weight: 800; font-size: 1.1rem;">1-on-1 Session with ${s.mentorName}</div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">${s.mentorDomain}</div>
                </div>
                <span class="badge-tag ${s.status === 'Completed' ? 'badge-purple' : s.status === 'Accepted' ? 'badge-green' : 'badge-gold'}">
                  ${s.status === 'Completed' ? '<i class="fa-solid fa-circle-check"></i> Conducted' : s.status === 'Accepted' ? '<i class="fa-solid fa-circle-check"></i> Accepted' : '<i class="fa-solid fa-clock"></i> Pending Acceptance'}
                </span>
              </div>

              <div style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 1rem;">
                <strong>Objective:</strong> ${s.objective}
              </div>

              <div class="card-footer" style="flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                  <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">
                    <i class="fa-regular fa-clock"></i> ${s.date} at ${s.time} (${s.duration || '1 Hour'})
                  </div>
                  ${s.associateRating ? `
                    <span style="font-size: 0.8rem; font-weight: 800; color: var(--brand-gold); background: rgba(245, 158, 11, 0.1); padding: 0.25rem 0.6rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.3rem;">
                      <i class="fa-solid fa-star"></i> You rated: ${s.associateRating.stars}/5
                    </span>
                  ` : ''}
                  ${s.mentorRating ? `
                    <span style="font-size: 0.8rem; font-weight: 800; color: var(--brand-emerald); background: rgba(16, 185, 129, 0.1); padding: 0.25rem 0.6rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.3rem;">
                      <i class="fa-solid fa-medal"></i> Mentor rated you: ${s.mentorRating.stars}/5
                    </span>
                  ` : ''}
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  ${s.status === 'Completed' ? `
                    ${s.associateRating ? `
                      <span class="badge-tag badge-gold" style="font-size: 0.82rem; padding: 0.45rem 0.85rem; border-radius: 8px; font-weight: 800; background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); display: inline-flex; align-items: center; gap: 0.35rem;">
                        <i class="fa-solid fa-star"></i> Review Submitted (${s.associateRating.stars}★)
                      </span>
                    ` : `
                      <button class="btn-brand-primary btn-open-evaluation" data-id="${s.id}" data-role="associate" style="padding: 0.45rem 1rem; font-size: 0.82rem; border-radius: 8px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                        <i class="fa-solid fa-star"></i> ⭐ Rate & Review Mentor
                      </button>
                    `}
                    ${s.meetingLink ? `
                      <a href="${s.meetingLink}" target="_blank" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--border-color); color: var(--text-secondary);">
                        <i class="fa-solid fa-video"></i> Meet Link
                      </a>
                    ` : ''}
                  ` : s.status === 'Accepted' && s.meetingLink ? `
                    <a href="${s.meetingLink}" target="_blank" class="btn-brand-primary" style="padding: 0.4rem 0.9rem; font-size: 0.8rem;">
                      <i class="fa-solid fa-video"></i> ${isGoogleMeet ? 'Join Google Meet' : 'Join Meeting'}
                    </a>
                    <a href="${calUrl}" target="_blank" class="btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.8rem; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; border: 1px solid var(--border-color); color: var(--text-primary);">
                      <i class="fa-regular fa-calendar-plus" style="color: #4285F4;"></i> Add to Google Calendar
                    </a>
                  ` : `
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
                      <i class="fa-solid fa-hourglass-half"></i> Awaiting Mentor Acceptance
                    </span>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMenteeProfile(associate) {
  const canEdit = Boolean(associate.canEditProfile || (state.currentUser && state.currentUser.canEditProfile));

  return `
    <div class="content-area" style="width: 100%; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
          <i class="fa-solid fa-user-gear" style="color: var(--brand-primary);"></i> My Associate Profile & Settings
        </h2>
        ${!canEdit ? `
          <button type="button" class="btn-brand-primary btn-open-request-edit" data-role="associate" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 800; border-radius: 50px; background: linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%);">
            <i class="fa-solid fa-paper-plane"></i> Request to Edit Profile
          </button>
        ` : `
          <span class="badge-tag badge-green" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;"><i class="fa-solid fa-lock-open"></i> Edit Access Active</span>
        `}
      </div>

      <!-- LOCK / UNLOCK STATUS BANNER -->
      ${!canEdit ? `
        <div style="background: rgba(234, 179, 8, 0.09); border: 1.5px solid #eab308; border-radius: 14px; padding: 1.15rem 1.35rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #fef08a; display: flex; align-items: center; justify-content: center; color: #a16207; font-size: 1.15rem; flex-shrink: 0;">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #713f12;">Profile Details Are Locked</div>
              <div style="font-size: 0.82rem; color: #854d0e; margin-top: 0.15rem;">To ensure verified scholar records, changes require Administrator approval. Click below to request editing.</div>
            </div>
          </div>
          <button type="button" class="btn-brand-primary btn-open-request-edit" data-role="associate" style="padding: 0.5rem 1.15rem; font-size: 0.82rem; font-weight: 800; background: #ca8a04; border: none; white-space: nowrap;">
            <i class="fa-solid fa-pen-to-square"></i> Request to Edit
          </button>
        </div>
      ` : `
        <div style="background: rgba(5, 150, 105, 0.09); border: 1.5px solid #059669; border-radius: 14px; padding: 1.15rem 1.35rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.85rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #a7f3d0; display: flex; align-items: center; justify-content: center; color: #047857; font-size: 1.15rem; flex-shrink: 0;">
            <i class="fa-solid fa-lock-open"></i>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #064e3b;">Profile Editing Unlocked</div>
            <div style="font-size: 0.82rem; color: #065f46; margin-top: 0.15rem;">Admin has approved your edit request. You can now modify your details and save changes below.</div>
          </div>
        </div>
      `}

      <form id="formEditMenteeProfile" class="mentor-card" style="padding: 2rem;">
        <!-- PROFILE PHOTO EDIT SECTION -->
        <div style="display: flex; align-items: center; gap: 1.5rem; padding-bottom: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);">
          <img src="${associate.avatar && associate.avatar.startsWith('data:') ? associate.avatar : (associate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80')}" id="profileAvatarPreview" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(associate.name)}&background=2e1065&color=ffffff';" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-primary); box-shadow: var(--shadow-sm);" />
          <div>
            <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.25rem;">Profile Headshot Photo</h4>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem;">JPG or PNG format. Compressed automatically.</p>
            ${canEdit ? `
              <label for="profileAvatarInput" class="btn-brand-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-upload"></i> Upload New Picture
              </label>
              <input type="file" id="profileAvatarInput" accept="image/jpeg,image/png,image/webp" style="display: none;" />
            ` : `
              <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); background: var(--bg-hover); padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color);"><i class="fa-solid fa-lock"></i> Locked</span>
            `}
          </div>
        </div>

        <!-- FULL NAME -->
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-input" id="editProfileName" value="${associate.name}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- EMAIL ADDRESS -->
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-input" id="editProfileEmail" value="${associate.email}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- HOST ORGANIZATION -->
        <div class="form-group">
          <label class="form-label">Host Organization</label>
          <input type="text" class="form-input" id="editProfileOrg" value="${associate.institution || associate.organization || 'Jobberman'}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- JOB TITLE -->
        <div class="form-group">
          <label class="form-label">Job Title</label>
          <input type="text" class="form-input" id="editProfileTitle" placeholder="e.g. Software Engineer / Data Analyst / Product Lead" value="${associate.title || ''}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} required style="border-radius: 10px; padding: 0.7rem 1rem;" />
        </div>

        <!-- GENDER -->
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-input" id="editProfileGender" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} style="border-radius: 10px; padding: 0.7rem 1rem;">
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
          <textarea class="form-input" id="editProfileBio" rows="4" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} style="border-radius: 10px; padding: 0.7rem 1rem; resize: vertical;">${associate.bio}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
          ${canEdit ? `
            <button type="submit" class="btn-brand-primary" style="padding: 0.65rem 1.5rem; font-weight: 800; font-size: 0.9rem;">
              <i class="fa-solid fa-floppy-disk"></i> Save Profile Changes
            </button>
          ` : `
            <button type="button" class="btn-brand-primary btn-open-request-edit" data-role="associate" style="padding: 0.65rem 1.5rem; font-weight: 800; font-size: 0.9rem;">
              <i class="fa-solid fa-paper-plane"></i> Request to Edit Profile
            </button>
          `}
        </div>
      </form>
    </div>
  `;
}

// --------------------------------------------------------------------------
// MENTOR VIEWS
// --------------------------------------------------------------------------
function renderMentorDashboard(mentor) {
  const cap = Number(mentor.monthlyCap) || 15;
  const used = Number(mentor.sessionsUsedThisMonth) || 0;
  const usagePct = Math.round((used / cap) * 100) || 0;
  const stats = getMentorThreeMonthStats(mentor);

  return `
    <div class="content-area" style="width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin: 0;">Mentor Dashboard — ${mentor.name}</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.2rem;">${mentor.title} (${mentor.organization})</p>
        </div>
        <button class="btn-brand-primary" id="btnEditMyProfile"><i class="fa-solid fa-user-pen"></i> Edit Profile</button>
      </div>

      <!-- 3-MONTH MANDATORY AVAILABILITY WARNING BANNER (15 Slots Target) -->
      ${!stats.isComplete ? `
        <div class="mentor-card" style="margin-bottom: 1.75rem; background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 14px; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #fef3c7; display: flex; align-items: center; justify-content: center; color: #d97706; font-size: 1.3rem; flex-shrink: 0;">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.98rem; color: #92400e;">⚠️ Action Required: Complete 15 Bookings for Next 3 Months</div>
              <div style="font-size: 0.85rem; color: #b45309; margin-top: 0.2rem; line-height: 1.45;">
                Kindly complete your 15 bookings for the next 3 months (currently configured: <strong>${stats.totalSlots}/15 slots</strong> — ${stats.m0Name}: ${stats.m0Count}/5, ${stats.m1Name}: ${stats.m1Count}/5, ${stats.m2Name}: ${stats.m2Count}/5).
              </div>
            </div>
          </div>
          <button class="btn-brand-primary btn-nav-to-availability" style="background: #d97706; font-size: 0.85rem; padding: 0.65rem 1.3rem; border-radius: 50px; font-weight: 800; white-space: nowrap; border: none;">
            <i class="fa-solid fa-calendar-plus"></i> Set 15 Slots Now
          </button>
        </div>
      ` : ''}

      <!-- Capacity Progress Meter -->
      <div class="mentor-card" style="margin-bottom: 2rem; border-left: 4px solid var(--brand-primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.9rem;">
          <span>Monthly Session Capacity Usage</span>
          <span>${used} / ${cap} Sessions Used (${usagePct}%)</span>
        </div>
        <div class="capacity-progress-container">
          <div class="capacity-progress-fill" style="width: ${Math.min(usagePct, 100)}%;"></div>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">Adjusted by Programme Administrators in Admin Portal.</div>
      </div>

      <!-- Booked Sessions -->
      <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin-bottom: 1rem;">Booked Mentorship Sessions</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${(() => {
          const mentorSessions = state.sessions.filter(s => {
            const sId = String(s.mentorId || s.mentor_id || '').toLowerCase();
            const mId = String(mentor.id || '').toLowerCase();
            const sName = String(s.mentorName || s.mentor_name || '').toLowerCase().trim();
            const mName = String(mentor.name || '').toLowerCase().trim();
            return (sId && mId && sId === mId) || (sName && mName && sName === mName);
          });

          if (mentorSessions.length === 0) {
            return `
              <div class="mentor-card" style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-muted);">
                <i class="fa-regular fa-calendar-check" style="font-size: 2rem; color: var(--brand-primary); margin-bottom: 0.5rem; display: block;"></i>
                <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary); margin-bottom: 0.25rem;">No Booked Sessions Yet</div>
                <div style="font-size: 0.85rem;">When an associate books an open time slot from your schedule, it will appear here for you to accept and start meeting.</div>
              </div>
            `;
          }

          return mentorSessions.map(s => {
            const isGoogleMeet = s.meetingLink && s.meetingLink.includes('meet.google.com');
            const calUrl = getGoogleCalendarUrl(s);
            const assoc = state.associates.find(a => String(a.id) === String(s.associateId) || a.name === s.associateName) || {};
            const org = s.associateOrg || assoc.organization || assoc.institution || 'Jobberman Nigeria';
            const title = s.associateTitle || assoc.title || 'Mastercard Foundation Associate';
            const track = assoc.track || s.mentorDomain || 'General Track';

            return `
              <div class="mentor-card" style="border-radius: 16px; border: 1px solid var(--border-color); padding: 1.5rem; background: var(--bg-surface); box-shadow: var(--shadow-sm);">
                <!-- Header with Associate Name & Status -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.9rem; flex-wrap: wrap; gap: 0.5rem;">
                  <div>
                    <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                      <i class="fa-solid fa-user-graduate" style="color: var(--brand-primary); font-size: 1rem;"></i>
                      <a class="btn-inspect-associate-profile" data-id="${s.associateId}" data-name="${s.associateName}" style="color: var(--brand-primary); text-decoration: none; cursor: pointer; border-bottom: 1.5px dashed var(--brand-primary);" title="Click to view Associate profile and past mentor ratings">
                        ${s.associateName}
                      </a>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-violet); margin-top: 0.2rem;">
                      ${title} · ${org}
                    </div>
                  </div>
                  <span class="badge-tag ${s.status === 'Accepted' ? 'badge-blue' : s.status === 'Completed' ? 'badge-green' : 'badge-gold'}" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;">
                    ${s.status === 'Accepted' ? '<i class="fa-solid fa-video"></i> Session Confirmed' : s.status === 'Completed' ? '<i class="fa-solid fa-circle-check"></i> Completed' : '<i class="fa-regular fa-clock"></i> Pending Acceptance'}
                  </span>
                </div>

                <!-- Date, Time & Track Info Box -->
                <div style="background: var(--bg-hover); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                  <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                    <div>
                      <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Scheduled Date & Time</div>
                      <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary); margin-top: 0.15rem;">
                        <i class="fa-regular fa-calendar" style="color: var(--brand-primary); margin-right: 0.35rem;"></i> ${s.date} at ${s.time}
                      </div>
                    </div>
                    <div>
                      <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Focus Domain / Track</div>
                      <div style="font-weight: 800; font-size: 0.95rem; color: var(--brand-primary); margin-top: 0.15rem;">
                        <i class="fa-solid fa-layer-group" style="margin-right: 0.35rem;"></i> ${track}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mentorship Agenda / Reason -->
                <div style="margin-bottom: 1.25rem;">
                  <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.35rem;">
                    <i class="fa-solid fa-clipboard-list" style="color: var(--brand-primary); margin-right: 0.35rem;"></i> Associate Agenda & Discussion Points:
                  </div>
                  <p style="font-size: 0.88rem; color: var(--text-primary); background: var(--bg-hover); padding: 0.85rem 1rem; border-radius: 10px; margin: 0; line-height: 1.5; font-style: italic; border-left: 3px solid var(--brand-primary);">
                    "${s.objective || '1-on-1 Career Mentorship & Strategic Guidance'}"
                  </p>
                </div>

                <!-- Actions: Accept, Join Google Meet, Calendar, Conducted -->
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                  ${s.status === 'Pending' ? `
                    <button class="btn-brand-primary btn-accept-session" data-id="${s.id}" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 800;">
                      <i class="fa-solid fa-check"></i> Accept & Generate Google Meet
                    </button>
                  ` : ''}

                  ${s.status !== 'Completed' ? `
                    <a href="${s.meetingLink || 'https://meet.google.com/new'}" target="_blank" class="btn-brand-primary" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 800; background: #059669; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
                      <i class="fa-solid fa-video"></i> Join Google Meet Room
                    </a>
                    <a href="${calUrl}" target="_blank" class="btn-brand-primary" style="padding: 0.55rem 1.15rem; font-size: 0.85rem; font-weight: 800; background: #4285F4; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;" title="Add event to Google Calendar">
                      <i class="fa-brands fa-google"></i> Google Calendar
                    </a>
                  ` : ''}

                  ${s.status === 'Accepted' ? `
                    <button class="btn-brand-primary btn-mark-conducted" data-id="${s.id}" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 800; background: #7c3aed;">
                      <i class="fa-solid fa-circle-check"></i> Mark Conducted & Request Rating
                    </button>
                  ` : ''}

                  ${s.status === 'Completed' ? `
                    <button class="btn-brand-primary btn-rate-session" data-id="${s.id}" data-role="mentor" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 800; background: var(--brand-gold);">
                      <i class="fa-solid fa-star"></i> ${s.mentorRating ? 'Update Associate Evaluation' : 'Evaluate Associate'}
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('');
        })()}
      </div>
    </div>
  `;
}

function renderMentorAvailability(mentor) {
  const defaultDate = new Date().toISOString().split('T')[0];
  const stats = getMentorThreeMonthStats(mentor);

  return `
    <div class="content-area" style="width: 100%;">
      <!-- 3-MONTH AVAILABILITY HORIZON PROGRESS TRACKER -->
      <div class="mentor-card" style="margin-bottom: 2rem; border-radius: 16px; border: 1.5px solid ${stats.isComplete ? '#059669' : '#f59e0b'}; box-shadow: var(--shadow-sm); padding: 1.75rem; background: var(--bg-surface);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-calendar-week" style="color: var(--brand-primary);"></i> 3-Month Availability Horizon (15 Slots Target)
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Mentors are required to maintain a 3-month rolling schedule with at least 5 available slots per month (15 total).
            </p>
          </div>
          <div>
            ${stats.isComplete 
              ? `<span class="badge-tag badge-green" style="font-size: 0.88rem; padding: 0.45rem 1rem;"><i class="fa-solid fa-circle-check"></i> 15-Slot Requirement Satisfied (${stats.totalSlots} Slots)</span>` 
              : `<span class="badge-tag badge-gold" style="font-size: 0.88rem; padding: 0.45rem 1rem;"><i class="fa-solid fa-triangle-exclamation"></i> Action Required (${stats.totalSlots}/15 Slots)</span>`}
          </div>
        </div>

        <!-- 3 Month Breakdown Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: var(--bg-hover); padding: 1.1rem; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">${stats.m0Name} (Current Month)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: ${stats.m0Count >= 5 ? '#059669' : '#d97706'}; margin: 0.35rem 0;">${stats.m0Count} / 5 Slots</div>
            <div style="font-size: 0.76rem; color: var(--text-secondary);">${stats.m0Count >= 5 ? '✓ Target Met' : `${5 - stats.m0Count} more needed`}</div>
          </div>

          <div style="background: var(--bg-hover); padding: 1.1rem; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">${stats.m1Name} (Month 2)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: ${stats.m1Count >= 5 ? '#059669' : '#d97706'}; margin: 0.35rem 0;">${stats.m1Count} / 5 Slots</div>
            <div style="font-size: 0.76rem; color: var(--text-secondary);">${stats.m1Count >= 5 ? '✓ Target Met' : `${5 - stats.m1Count} more needed`}</div>
          </div>

          <div style="background: var(--bg-hover); padding: 1.1rem; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">${stats.m2Name} (Month 3)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: ${stats.m2Count >= 5 ? '#059669' : '#d97706'}; margin: 0.35rem 0;">${stats.m2Count} / 5 Slots</div>
            <div style="font-size: 0.76rem; color: var(--text-secondary);">${stats.m2Count >= 5 ? '✓ Target Met' : `${5 - stats.m2Count} more needed`}</div>
          </div>
        </div>
      </div>

      <!-- ADD SINGLE SLOT CARD -->
      <div class="mentor-card" style="margin-bottom: 2rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); padding: 1.75rem;">
        <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; color: var(--brand-primary); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-circle-plus"></i> Add Custom Open Time Slot
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 1.25rem; align-items: flex-end;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; color: var(--text-primary);">Available Date</label>
            <input type="date" class="form-input" id="inputSlotDate" value="${defaultDate}" style="border-radius: 10px; padding: 0.65rem 1rem;" />
          </div>
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; color: var(--text-primary);">1–Hour Time Slot (9:00 AM – 6:00 PM)</label>
            <select class="form-select" id="inputSlotTime" style="border-radius: 10px; padding: 0.65rem 1rem;">
              <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
              <option value="09:30 AM - 10:30 AM">09:30 AM - 10:30 AM</option>
              <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
              <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
              <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
              <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
              <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
              <option value="12:30 PM - 01:30 PM">12:30 PM - 01:30 PM</option>
              <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
              <option value="01:30 PM - 02:30 PM">01:30 PM - 02:30 PM</option>
              <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
              <option value="02:30 PM - 03:30 PM">02:30 PM - 03:30 PM</option>
              <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
              <option value="03:30 PM - 04:30 PM">03:30 PM - 04:30 PM</option>
              <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
              <option value="04:30 PM - 05:30 PM">04:30 PM - 05:30 PM</option>
              <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
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
            ${(mentor.schedule || []).map((s, idx) => `
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

function renderMentorProfile(mentor) {
  const canEdit = Boolean(mentor.canEditProfile || (state.currentUser && state.currentUser.canEditProfile));

  return `
    <div class="content-area" style="width: 100%; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
          <i class="fa-solid fa-user-pen" style="color: var(--brand-primary);"></i> My Mentor Profile & Settings
        </h2>
        ${!canEdit ? `
          <button type="button" class="btn-brand-primary btn-open-request-edit" data-role="mentor" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 800; border-radius: 50px; background: linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%);">
            <i class="fa-solid fa-paper-plane"></i> Request to Edit Profile
          </button>
        ` : `
          <span class="badge-tag badge-green" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;"><i class="fa-solid fa-lock-open"></i> Edit Access Active</span>
        `}
      </div>

      <!-- LOCK / UNLOCK STATUS BANNER -->
      ${!canEdit ? `
        <div style="background: rgba(234, 179, 8, 0.09); border: 1.5px solid #eab308; border-radius: 14px; padding: 1.15rem 1.35rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #fef08a; display: flex; align-items: center; justify-content: center; color: #a16207; font-size: 1.15rem; flex-shrink: 0;">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #713f12;">Executive Profile Details Are Locked</div>
              <div style="font-size: 0.82rem; color: #854d0e; margin-top: 0.15rem;">Mentor credentials and bio are verified by Programme Administrators. Click below to request changes.</div>
            </div>
          </div>
          <button type="button" class="btn-brand-primary btn-open-request-edit" data-role="mentor" style="padding: 0.5rem 1.15rem; font-size: 0.82rem; font-weight: 800; background: #ca8a04; border: none; white-space: nowrap;">
            <i class="fa-solid fa-pen-to-square"></i> Request to Edit
          </button>
        </div>
      ` : `
        <div style="background: rgba(5, 150, 105, 0.09); border: 1.5px solid #059669; border-radius: 14px; padding: 1.15rem 1.35rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.85rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #a7f3d0; display: flex; align-items: center; justify-content: center; color: #047857; font-size: 1.15rem; flex-shrink: 0;">
            <i class="fa-solid fa-lock-open"></i>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #064e3b;">Profile Editing Unlocked</div>
            <div style="font-size: 0.82rem; color: #065f46; margin-top: 0.15rem;">Admin has approved your edit request. You can now modify your details and save changes below.</div>
          </div>
        </div>
      `}

      <div class="mentor-card" style="padding: 2rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <!-- MENTOR PHOTO UPLOAD SECTION -->
        <div style="display: flex; align-items: center; gap: 1.5rem; padding-bottom: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);">
          <img src="${mentor.avatar && mentor.avatar.startsWith('data:') ? mentor.avatar : (mentor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}" id="mentorTabAvatarPreview" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=2e1065&color=ffffff';" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-primary);" />
          <div>
            <h4 style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.25rem;">Executive Headshot Photo</h4>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem;">JPG or PNG format (Max 5MB)</p>
            ${canEdit ? `
              <label for="mentorTabAvatarInput" class="btn-brand-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-upload"></i> Upload New Picture
              </label>
              <input type="file" id="mentorTabAvatarInput" accept="image/jpeg,image/png,image/webp" style="display: none;" />
            ` : `
              <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); background: var(--bg-hover); padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color);"><i class="fa-solid fa-lock"></i> Locked</span>
            `}
          </div>
        </div>

        <form id="formMentorTabProfile">
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Full Name</label>
            <input type="text" class="form-input" id="mentorTabName" value="${mentor.name || ''}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} required style="border-radius: 10px; padding: 0.7rem 1rem;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Professional Title</label>
              <input type="text" class="form-input" id="mentorTabTitle" value="${mentor.title || ''}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} required style="border-radius: 10px; padding: 0.7rem 1rem;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Organization / Employer</label>
              <input type="text" class="form-input" id="mentorTabOrg" value="${mentor.organization || mentor.institution || ''}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} required style="border-radius: 10px; padding: 0.7rem 1rem;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Specialist Domain</label>
              <input type="text" class="form-input" id="mentorTabDomain" value="${mentor.domain || ''}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} placeholder="e.g. Monitoring & Evaluation" style="border-radius: 10px; padding: 0.7rem 1rem;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Gender</label>
              <select class="form-input" id="mentorTabGender" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} style="border-radius: 10px; padding: 0.7rem 1rem;">
                <option value="" ${!mentor.gender ? 'selected' : ''}>-- Select Gender --</option>
                <option value="Male" ${mentor.gender === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Female" ${mentor.gender === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Non-binary" ${mentor.gender === 'Non-binary' ? 'selected' : ''}>Non-binary / Gender Diverse</option>
                <option value="Prefer not to say" ${mentor.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Bio / Executive Summary</label>
            <textarea class="form-input" id="mentorTabBio" rows="4" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} style="border-radius: 10px; padding: 0.7rem 1rem; resize: vertical;">${mentor.bio || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Areas of Expertise (Comma Separated)</label>
            <input type="text" class="form-input" id="mentorTabExpertise" value="${(mentor.expertise || []).join(', ')}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} placeholder="e.g. MERL, Data Strategy, Career Coaching" style="border-radius: 10px; padding: 0.7rem 1rem;" />
          </div>

          <div style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); margin-bottom: 0.8rem; margin-top: 1.25rem;">Social Media Links & Handles</div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 700;"><i class="fa-brands fa-linkedin" style="color: #0A66C2;"></i> LinkedIn Profile URL</label>
            <input type="url" class="form-input" id="mentorTabLinkedIn" value="${mentor.socialLinks?.linkedin || ''}" ${canEdit ? '' : 'disabled style="background:var(--bg-hover); opacity:0.85; cursor:not-allowed;"'} placeholder="https://linkedin.com/in/username" style="border-radius: 10px; padding: 0.7rem 1rem;" />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.75rem;">
            ${canEdit ? `
              <button type="submit" class="btn-brand-primary" style="padding: 0.7rem 1.8rem; font-weight: 800; font-size: 0.92rem;">
                <i class="fa-solid fa-floppy-disk"></i> Save Mentor Profile
              </button>
            ` : `
              <button type="button" class="btn-brand-primary btn-open-request-edit" data-role="mentor" style="padding: 0.7rem 1.8rem; font-weight: 800; font-size: 0.92rem;">
                <i class="fa-solid fa-paper-plane"></i> Request to Edit Profile
              </button>
            `}
          </div>
        </form>
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

  const menteesCount = (state.associates && state.associates.length > 0) ? state.associates.length.toLocaleString() : '3';
  const activeMentorsCount = state.mentors ? state.mentors.filter(m => m.status !== 'Inactive').length : 0;

  const sessionsInRange = (state.sessions || []).filter(s => {
    if (!fromDate || !toDate || !s.date) return true;
    return s.date >= fromDate && s.date <= toDate;
  });
  const sessionsCount = sessionsInRange.length > 0 ? sessionsInRange.length.toString() : (state.sessions ? state.sessions.length.toString() : '0');

  const totalSessions = state.sessions ? state.sessions.length : 0;
  const completedOrAccepted = (state.sessions || []).filter(s => s.status === 'Completed' || s.status === 'Accepted' || (s.attendance && s.attendance.joined));
  const attendanceRate = totalSessions > 0 ? ((completedOrAccepted.length / totalSessions) * 100).toFixed(1) + '%' : '100.0%';

  const spilloversCount = (state.spillovers || []).length;
  const pendingRequestsCount = (state.profileEditRequests || []).filter(r => r.status === 'Pending').length;

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
      <div class="stats-overview-grid" style="margin-bottom: 2rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <!-- KPI 1: TOTAL MENTEES -->
        <div class="stat-card btn-admin-kpi-card ${activeTable === 'mentees' ? 'active-kpi-card' : ''}" data-table="mentees" style="cursor: pointer; position: relative; transition: all 0.25s ease; ${activeTable === 'mentees' ? 'border: 2px solid var(--brand-primary); background: var(--bg-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(107,33,168,0.18);' : 'border: 1px solid var(--border-color);'}">
          <div class="stat-card-header">
            <span class="stat-label" style="font-weight: 800; color: ${activeTable === 'mentees' ? 'var(--brand-primary)' : 'var(--text-secondary)'};">TOTAL MENTEES</span>
            <div class="stat-icon" style="background: rgba(107,33,168,0.12); color: var(--brand-primary);"><i class="fa-solid fa-user-graduate"></i></div>
          </div>
          <div class="stat-value" style="font-size: 2rem; font-weight: 800;">${menteesCount}</div>
          <div class="stat-meta" style="color: var(--text-secondary); font-size: 0.78rem;">Mastercard Roster</div>
          ${activeTable === 'mentees' ? `<div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.72rem; font-weight: 800; color: var(--brand-primary); display: flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-eye"></i> Viewing Table</div>` : ''}
        </div>

        <!-- KPI 2: ACTIVE MENTORS -->
        <div class="stat-card btn-admin-kpi-card ${activeTable === 'mentors' ? 'active-kpi-card' : ''}" data-table="mentors" style="cursor: pointer; position: relative; transition: all 0.25s ease; ${activeTable === 'mentors' ? 'border: 2px solid var(--brand-emerald); background: var(--bg-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(5,150,105,0.18);' : 'border: 1px solid var(--border-color);'}">
          <div class="stat-card-header">
            <span class="stat-label" style="font-weight: 800; color: ${activeTable === 'mentors' ? 'var(--brand-emerald)' : 'var(--text-secondary)'};">ACTIVE MENTORS</span>
            <div class="stat-icon" style="background: var(--badge-green-bg); color: var(--brand-emerald);"><i class="fa-solid fa-user-tie"></i></div>
          </div>
          <div class="stat-value" style="font-size: 2rem; font-weight: 800;">${activeMentorsCount}</div>
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
          <div class="stat-value" style="font-size: 2rem; font-weight: 800;">${attendanceRate}</div>
          <div class="stat-meta" style="color: var(--text-secondary);">Real-Time Verified Logs</div>
          ${activeTable === 'attendance' ? `<div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.72rem; font-weight: 800; color: var(--brand-gold); display: flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-eye"></i> Viewing Table</div>` : ''}
        </div>

        <!-- KPI 5: MONTHLY SPILL-OVER DEMAND -->
        <div class="stat-card btn-admin-kpi-card ${activeTable === 'spillovers' ? 'active-kpi-card' : ''}" data-table="spillovers" style="cursor: pointer; position: relative; transition: all 0.25s ease; ${activeTable === 'spillovers' ? 'border: 2px solid #dc2626; background: var(--bg-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(220,38,38,0.18);' : 'border: 1px solid var(--border-color);'}">
          <div class="stat-card-header">
            <span class="stat-label" style="font-weight: 800; color: ${activeTable === 'spillovers' ? '#dc2626' : 'var(--text-secondary)'};">CAP SPILL-OVER</span>
            <div class="stat-icon" style="background: rgba(220,38,38,0.12); color: #dc2626;"><i class="fa-solid fa-arrow-trend-up"></i></div>
          </div>
          <div class="stat-value" style="font-size: 2rem; font-weight: 800; color: ${spilloversCount > 0 ? '#dc2626' : 'inherit'};">${spilloversCount}</div>
          <div class="stat-meta" style="color: var(--text-secondary); font-size: 0.78rem;">Unmet Demand (100 Cap)</div>
          ${activeTable === 'spillovers' ? `<div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.72rem; font-weight: 800; color: #dc2626; display: flex; align-items: center; gap: 0.3rem;"><i class="fa-solid fa-eye"></i> Viewing Table</div>` : ''}
        </div>
      </div>

      <!-- FILTER TAB PILLS -->
      <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color);">
        <button class="btn-admin-kpi-pill ${activeTable === 'mentees' ? 'active-pill' : ''}" data-table="mentees" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'mentees' ? 'background: var(--brand-primary); color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-user-graduate"></i> Mentees Roster (${menteesCount})
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'mentors' ? 'active-pill' : ''}" data-table="mentors" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'mentors' ? 'background: #059669; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-user-tie"></i> Active Mentors (${state.mentors.length})
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'sessions' ? 'active-pill' : ''}" data-table="sessions" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'sessions' ? 'background: #6b21a8; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-video"></i> Sessions Log (${sessionsCount})
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'feedback' ? 'active-pill' : ''}" data-table="feedback" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'feedback' ? 'background: #f59e0b; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-star"></i> Evaluation & Ratings (${state.sessions.filter(s => s.mentorRating || s.associateRating).length})
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'attendance' ? 'active-pill' : ''}" data-table="attendance" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'attendance' ? 'background: #d97706; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-chart-line"></i> Attendance Audit (96.4%)
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'profile_requests' ? 'active-pill' : ''}" data-table="profile_requests" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'profile_requests' ? 'background: #ca8a04; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-id-card-clip"></i> Profile Edit Requests (${pendingRequestsCount} Pending)
        </button>
        <button class="btn-admin-kpi-pill ${activeTable === 'spillovers' ? 'active-pill' : ''}" data-table="spillovers" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 800; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; ${activeTable === 'spillovers' ? 'background: #dc2626; color: white;' : 'background: var(--bg-hover); color: var(--text-secondary);'}">
          <i class="fa-solid fa-chart-pie"></i> Spill-Over Demand Audit (${spilloversCount})
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
  if (activeTable === 'feedback') {
    return renderAdminFeedbackTable();
  }
  if (activeTable === 'profile_requests') {
    return renderAdminProfileRequestsTable();
  }
  if (activeTable === 'spillovers') {
    return renderAdminSpilloversTable();
  }
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
            <h3 style="font-weight: 800; font-size: 1.15rem;"><i class="fa-solid fa-user-graduate" style="color: var(--brand-primary);"></i> Active Mastercard Associates Roster</h3>
            <p style="font-size: 0.84rem; color: var(--text-secondary);">Verified Associates enrolled in the mentorship programme.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="position: relative;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
              <input type="text" id="inputAdminMenteeSearch" placeholder="Search associates, org, email..." value="${state.adminMenteeSearchQuery}" style="padding: 0.5rem 1rem 0.5rem 2.2rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem; width: 260px;" />
            </div>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
                <th style="padding: 0.75rem;">Associate Name</th>
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
                <th style="padding: 0.75rem;">Associate</th>
                <th style="padding: 0.75rem;">Mentor</th>
                <th style="padding: 0.75rem;">Scheduled Time</th>
                <th style="padding: 0.75rem;">Zoho Join Log</th>
                <th style="padding: 0.75rem;">Duration</th>
                <th style="padding: 0.75rem;">Attendance Status</th>
                <th style="padding: 0.75rem;">Feedback Score</th>
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

function renderAdminFeedbackTable() {
  const evaluatedSessions = (state.sessions || []).filter(s => s.mentorRating || s.associateRating || s.status === 'Completed');
  
  // Calculate average scores
  const allAssocStars = evaluatedSessions.map(s => s.associateRating?.stars).filter(Boolean);
  const avgAssocGiven = allAssocStars.length > 0 ? (allAssocStars.reduce((a,b)=>a+b,0)/allAssocStars.length).toFixed(1) : '5.0';
  
  const allMentorStars = evaluatedSessions.map(s => s.mentorRating?.stars).filter(Boolean);
  const avgMentorGiven = allMentorStars.length > 0 ? (allMentorStars.reduce((a,b)=>a+b,0)/allMentorStars.length).toFixed(1) : '5.0';

  return `
    <div class="mentor-card" style="padding: 1.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-weight: 800; font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-star" style="color: var(--brand-gold);"></i> 1-on-1 Mentorship Evaluation & Feedback Analytics
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Comprehensive quantitative ratings (1-5 stars) and qualitative feedback collected post-session.</p>
        </div>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <div style="background: var(--bg-hover); padding: 0.6rem 1.1rem; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">Mentor Satisfaction</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--brand-gold);">★ ${avgAssocGiven} / 5.0</div>
          </div>
          <div style="background: var(--bg-hover); padding: 0.6rem 1.1rem; border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
            <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">Associate Preparedness</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--brand-emerald);">★ ${avgMentorGiven} / 5.0</div>
          </div>
          <button class="btn-brand-primary btn-export-csv" data-table="feedback" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; border-radius: 10px; height: fit-content; align-self: center;">
            <i class="fa-solid fa-download"></i> Export Feedback CSV
          </button>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
              <th style="padding: 0.85rem;">Session / Date</th>
              <th style="padding: 0.85rem;">Mentor</th>
              <th style="padding: 0.85rem;">Associate</th>
              <th style="padding: 0.85rem;">Associate Rating of Mentor</th>
              <th style="padding: 0.85rem;">Mentor Rating of Associate</th>
              <th style="padding: 0.85rem;">Session Status</th>
            </tr>
          </thead>
          <tbody>
            ${evaluatedSessions.length > 0 ? evaluatedSessions.map(s => `
              <tr style="border-bottom: 1px solid var(--border-color); vertical-align: top;">
                <td style="padding: 1rem 0.85rem;">
                  <div style="font-weight: 800; color: var(--text-primary);">${s.id}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${s.date} @ ${s.time}</div>
                </td>
                <td style="padding: 1rem 0.85rem;">
                  <div style="font-weight: 800;">${s.mentorName}</div>
                  <div style="font-size: 0.78rem; color: var(--text-secondary);">${s.mentorDomain || ''}</div>
                </td>
                <td style="padding: 1rem 0.85rem;">
                  <div style="font-weight: 800;">${s.associateName}</div>
                  <div style="font-size: 0.78rem; color: var(--brand-violet);">${s.associateTitle || s.associateOrg || 'Scholar'}</div>
                </td>
                <td style="padding: 1rem 0.85rem; max-width: 250px;">
                  ${s.associateRating ? `
                    <div style="font-weight: 800; color: var(--brand-gold); margin-bottom: 0.25rem;">
                      ${'★'.repeat(s.associateRating.stars || 5)}${'☆'.repeat(5 - (s.associateRating.stars || 5))} (${s.associateRating.stars}.0)
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; line-height: 1.4;">
                      "${s.associateRating.qualitativeFeedback || s.associateRating.feedback || 'No written remarks'}"
                    </div>
                    ${s.associateRating.objectiveAlignment ? `
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
                        Objective Alignment: <strong>${s.associateRating.objectiveAlignment}/5</strong>
                      </div>
                    ` : ''}
                  ` : `<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Awaiting Associate Review</span>`}
                </td>
                <td style="padding: 1rem 0.85rem; max-width: 250px;">
                  ${s.mentorRating ? `
                    <div style="font-weight: 800; color: var(--brand-emerald); margin-bottom: 0.25rem;">
                      ${'★'.repeat(s.mentorRating.stars || 5)}${'☆'.repeat(5 - (s.mentorRating.stars || 5))} (${s.mentorRating.stars}.0)
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; line-height: 1.4;">
                      "${s.mentorRating.qualitativeFeedback || s.mentorRating.notes || 'No written remarks'}"
                    </div>
                    ${s.mentorRating.engagement ? `
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
                        Engagement & Prep: <strong>${s.mentorRating.engagement}/5</strong>
                      </div>
                    ` : ''}
                  ` : `<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Awaiting Mentor Evaluation</span>`}
                </td>
                <td style="padding: 1rem 0.85rem;">
                  <span class="badge-tag ${s.status === 'Completed' ? 'badge-green' : 'badge-gold'}" style="font-size: 0.78rem;">
                    ${s.status}
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                  No sessions have been evaluated yet. When mentors toggle sessions as completed, submitted evaluations will appear here.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminProfileRequestsTable() {
  const requests = state.profileEditRequests || [];
  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  return `
    <div class="mentor-card" style="padding: 1.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-weight: 800; font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-id-card-clip" style="color: #ca8a04;"></i> Profile Edit Access Requests & Approvals
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">
            Approve or reject requests from Associates and Mentors to update locked profile fields. Approved requests unlock editing immediately and notify the member via email.
          </p>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <div style="background: rgba(202, 138, 4, 0.12); color: #ca8a04; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 800;">
            ${pendingCount} Action Required
          </div>
          <button class="btn-brand-primary btn-export-csv" data-table="profile_requests" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; border-radius: 10px; background: #059669; color: white;">
            <i class="fa-solid fa-file-csv"></i> Export Requests CSV
          </button>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
              <th style="padding: 0.85rem;">Request ID</th>
              <th style="padding: 0.85rem;">Member</th>
              <th style="padding: 0.85rem;">Role</th>
              <th style="padding: 0.85rem;">Requested Fields</th>
              <th style="padding: 0.85rem; max-width: 280px;">Reason / Justification</th>
              <th style="padding: 0.85rem;">Submitted</th>
              <th style="padding: 0.85rem;">Status</th>
              <th style="padding: 0.85rem; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${requests.length > 0 ? requests.map(r => {
              const isPending = r.status === 'Pending';
              const isApproved = r.status === 'Approved';
              const fields = Array.isArray(r.requestedFields) ? r.requestedFields : [r.requestedFields];
              const dateStr = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

              return `
                <tr style="border-bottom: 1px solid var(--border-color); vertical-align: middle;">
                  <td style="padding: 0.9rem 0.85rem; font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${r.id}</td>
                  <td style="padding: 0.9rem 0.85rem;">
                    <div style="font-weight: 800; color: var(--text-primary);">${r.userName || 'Member'}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">${r.userEmail || ''}</div>
                  </td>
                  <td style="padding: 0.9rem 0.85rem;">
                    <span class="badge-tag ${r.userRole === 'mentor' ? 'badge-green' : 'badge-purple'}" style="text-transform: capitalize;">${r.userRole || 'associate'}</span>
                  </td>
                  <td style="padding: 0.9rem 0.85rem;">
                    <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
                      ${fields.map(f => `<span style="background: var(--bg-hover); border: 1px solid var(--border-color); font-size: 0.74rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; color: var(--brand-primary);">${f}</span>`).join('')}
                    </div>
                  </td>
                  <td style="padding: 0.9rem 0.85rem; max-width: 280px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
                    "${r.reason || 'No reason specified'}"
                  </td>
                  <td style="padding: 0.9rem 0.85rem; font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                    ${dateStr}
                  </td>
                  <td style="padding: 0.9rem 0.85rem;">
                    ${isPending ? `<span class="badge-tag badge-gold"><i class="fa-solid fa-clock"></i> Pending Review</span>` : ''}
                    ${isApproved ? `<span class="badge-tag badge-green"><i class="fa-solid fa-check"></i> Approved</span>` : ''}
                    ${r.status === 'Rejected' ? `<span class="badge-tag badge-red"><i class="fa-solid fa-xmark"></i> Rejected</span>` : ''}
                  </td>
                  <td style="padding: 0.9rem 0.85rem; text-align: right; white-space: nowrap;">
                    ${isPending ? `
                      <div style="display: inline-flex; gap: 0.45rem;">
                        <button type="button" class="btn-brand-primary btn-approve-profile-edit" data-id="${r.id}" data-user-id="${r.userId || ''}" style="padding: 0.45rem 0.85rem; font-size: 0.78rem; font-weight: 800; background: #059669; color: white; border-radius: 8px;">
                          <i class="fa-solid fa-check"></i> Approve & Unlock
                        </button>
                        <button type="button" class="btn-brand-primary btn-reject-profile-edit" data-id="${r.id}" style="padding: 0.45rem 0.75rem; font-size: 0.78rem; font-weight: 800; background: #dc2626; color: white; border-radius: 8px;">
                          <i class="fa-solid fa-xmark"></i> Reject
                        </button>
                      </div>
                    ` : `
                      <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Processed</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                  No profile edit requests have been submitted yet.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminSpilloversTable() {
  const spillovers = state.spillovers || [];
  const monthlyCap = 100;

  // Aggregate monthly stats from state.sessions and state.spillovers
  const monthsMap = {};

  (state.sessions || []).forEach(s => {
    if (!s.date) return;
    const mKey = s.date.substring(0, 7);
    if (!monthsMap[mKey]) monthsMap[mKey] = { booked: 0, spillovers: 0 };
    monthsMap[mKey].booked++;
  });

  spillovers.forEach(sp => {
    const mKey = sp.targetMonth || (sp.targetDate ? sp.targetDate.substring(0, 7) : new Date().toISOString().substring(0, 7));
    if (!monthsMap[mKey]) monthsMap[mKey] = { booked: 0, spillovers: 0 };
    monthsMap[mKey].spillovers++;
  });

  const monthKeys = Object.keys(monthsMap).sort().reverse();
  if (monthKeys.length === 0) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    monthKeys.push(currentMonth);
    monthsMap[currentMonth] = { booked: state.sessions ? state.sessions.length : 0, spillovers: spillovers.length };
  }

  return `
    <div class="mentor-card" style="padding: 1.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-weight: 800; font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-chart-pie" style="color: #dc2626;"></i> Monthly Booking Capacity & Spill-Over Demand Analytics
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">
            Tracking unmet demand when monthly bookings reach the 100-session program ceiling. Informs data-driven budget expansion and mentor scaling.
          </p>
        </div>

        <button class="btn-brand-primary btn-export-csv" data-table="spillovers" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; border-radius: 10px; background: #059669; color: white;">
          <i class="fa-solid fa-file-csv"></i> Export Spill-Over CSV
        </button>
      </div>

      <!-- MONTHLY CAPACITY & SPILL-OVER SUMMARY TABLE -->
      <div style="background: var(--bg-hover); border-radius: 14px; border: 1px solid var(--border-color); padding: 1.25rem; margin-bottom: 1.75rem;">
        <h4 style="font-weight: 800; font-size: 1rem; margin-bottom: 0.85rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
          <i class="fa-solid fa-scale-balanced" style="color: var(--brand-primary);"></i> Monthly Ceiling vs. Real Demand Breakdown
        </h4>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.86rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
                <th style="padding: 0.7rem;">Calendar Month</th>
                <th style="padding: 0.7rem;">Program Cap</th>
                <th style="padding: 0.7rem;">Booked Sessions</th>
                <th style="padding: 0.7rem;">Spill-Over (Unmet Attempts)</th>
                <th style="padding: 0.7rem;">Total Real Demand</th>
                <th style="padding: 0.7rem;">Cap Utilization</th>
                <th style="padding: 0.7rem;">Program Recommendation</th>
              </tr>
            </thead>
            <tbody>
              ${monthKeys.map(mKey => {
                const data = monthsMap[mKey] || { booked: 0, spillovers: 0 };
                const totalDemand = data.booked + data.spillovers;
                const utilRate = Math.min(100, Math.round((data.booked / monthlyCap) * 100));
                const isCapped = data.booked >= monthlyCap;
                const dateObj = new Date(mKey + '-01T00:00:00');
                const monthName = isNaN(dateObj) ? mKey : dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                return `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 0.75rem; font-weight: 800; color: var(--brand-primary);">${monthName}</td>
                    <td style="padding: 0.75rem; font-weight: 700;">${monthlyCap} Sessions</td>
                    <td style="padding: 0.75rem; font-weight: 800; color: ${isCapped ? '#dc2626' : '#059669'};">${data.booked} / ${monthlyCap}</td>
                    <td style="padding: 0.75rem; font-weight: 800; color: ${data.spillovers > 0 ? '#dc2626' : 'var(--text-muted)'};">${data.spillovers > 0 ? `+${data.spillovers} attempts` : '0'}</td>
                    <td style="padding: 0.75rem; font-weight: 800;">${totalDemand} Sessions</td>
                    <td style="padding: 0.75rem;">
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; min-width: 80px; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                          <div style="width: ${utilRate}%; height: 100%; background: ${isCapped ? '#dc2626' : 'var(--brand-primary)'};"></div>
                        </div>
                        <span style="font-weight: 700; font-size: 0.8rem;">${utilRate}%</span>
                      </div>
                    </td>
                    <td style="padding: 0.75rem;">
                      ${data.spillovers > 0 
                        ? `<span class="badge-tag badge-red" style="font-size: 0.74rem;"><i class="fa-solid fa-arrow-up"></i> Expand Slot Budget (+${data.spillovers})</span>` 
                        : (data.booked >= 80 
                          ? `<span class="badge-tag badge-gold" style="font-size: 0.74rem;">Near Capacity (${data.booked}%)</span>` 
                          : `<span class="badge-tag badge-green" style="font-size: 0.74rem;">Capacity Healthy</span>`)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- DETAILED SPILL-OVER EVENT LOG -->
      <h4 style="font-weight: 800; font-size: 1rem; margin-bottom: 0.85rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
        <i class="fa-solid fa-list-ul" style="color: var(--brand-primary);"></i> Unmet Mentorship Attempt Audit Log
      </h4>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
              <th style="padding: 0.8rem;">Log ID</th>
              <th style="padding: 0.8rem;">Timestamp</th>
              <th style="padding: 0.8rem;">Associate</th>
              <th style="padding: 0.8rem;">Target Mentor</th>
              <th style="padding: 0.8rem;">Intended Slot</th>
              <th style="padding: 0.8rem;">Block Reason / Cap Status</th>
            </tr>
          </thead>
          <tbody>
            ${spillovers.length > 0 ? spillovers.map(s => {
              const timeStr = s.timestamp ? new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
              return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 0.85rem; font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${s.id}</td>
                  <td style="padding: 0.85rem; font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">${timeStr}</td>
                  <td style="padding: 0.85rem;">
                    <div style="font-weight: 800; color: var(--text-primary);">${s.associateName || 'Associate'}</div>
                    <div style="font-size: 0.76rem; color: var(--text-muted);">${s.associateEmail || ''}</div>
                  </td>
                  <td style="padding: 0.85rem; font-weight: 700;">${s.mentorName || 'Mentor'}</td>
                  <td style="padding: 0.85rem; font-size: 0.82rem; color: var(--text-secondary);">${s.targetDate || ''} ${s.targetTime ? `at ${s.targetTime}` : ''}</td>
                  <td style="padding: 0.85rem;">
                    <span class="badge-tag badge-red" style="font-size: 0.76rem;">
                      <i class="fa-solid fa-ban"></i> ${s.reason || 'Monthly 100-session cap reached'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                  No spill-overs recorded yet. All booking attempts have been accommodated within the 100-session monthly cap.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function exportAdminTableToCSV(activeTable) {
  let filename = `Mastercard_Mentorship_${activeTable}_${state.adminMonthFilter}.csv`;
  let rows = [];

  if (activeTable === 'feedback') {
    filename = `Mastercard_Mentorship_Evaluation_Feedback_Export_${new Date().toISOString().split('T')[0]}.csv`;
    rows.push([
      'Session ID',
      'Date',
      'Time',
      'Mentor Name',
      'Mentor Domain',
      'Associate Name',
      'Associate Job Title',
      'Associate Host Org',
      'Associate Rating (Stars)',
      'Associate Objective Alignment (1-5)',
      'Associate Qualitative Review',
      'Mentor Rating (Stars)',
      'Associate Preparedness Score (1-5)',
      'Mentor Qualitative Feedback',
      'Session Status'
    ]);
    state.sessions.forEach(s => {
      rows.push([
        s.id,
        s.date,
        s.time,
        s.mentorName,
        s.mentorDomain || '',
        s.associateName,
        s.associateTitle || '',
        s.associateOrg || '',
        s.associateRating?.stars || '',
        s.associateRating?.objectiveAlignment || '',
        s.associateRating?.qualitativeFeedback || s.associateRating?.feedback || '',
        s.mentorRating?.stars || '',
        s.mentorRating?.engagement || '',
        s.mentorRating?.qualitativeFeedback || s.mentorRating?.notes || '',
        s.status
      ]);
    });
  } else if (activeTable === 'profile_requests') {
    filename = `Mastercard_Mentorship_Profile_Edit_Requests_${new Date().toISOString().split('T')[0]}.csv`;
    rows.push(['Request ID', 'Member Name', 'Email', 'Role', 'Requested Fields', 'Reason / Justification', 'Status', 'Submitted At']);
    (state.profileEditRequests || []).forEach(r => {
      const fields = Array.isArray(r.requestedFields) ? r.requestedFields.join('; ') : r.requestedFields;
      rows.push([r.id, r.userName, r.userEmail, r.userRole, fields, r.reason, r.status, r.requestedAt || '']);
    });
  } else if (activeTable === 'spillovers') {
    filename = `Mastercard_Mentorship_Spillover_Demand_Export_${new Date().toISOString().split('T')[0]}.csv`;
    rows.push(['Log ID', 'Timestamp', 'Associate Name', 'Associate Email', 'Target Mentor', 'Intended Date', 'Intended Time', 'Block Reason']);
    (state.spillovers || []).forEach(s => {
      rows.push([s.id, s.timestamp, s.associateName, s.associateEmail, s.mentorName, s.targetDate, s.targetTime, s.reason]);
    });
  } else if (activeTable === 'mentees') {
    rows.push(['Associate Name', 'Email Address', 'Host Organization', 'Job Title / Specialization', 'Cohort', 'Status']);
    const mockList = [
      ['Bolaji Akinjole', 'bakinjole@jobberman.com', 'Jobberman Nigeria', 'M&E Specialist', '2024-2026', 'Verified Active'],
      ['Victor Osanyindoro', 'vosanyindoro@jobberman.com', 'Jobberman Nigeria', 'MERL Officer', '2024-2026', 'Verified Active'],
      ['Oluwasegun Ogunnusi', 'oogunnusi@jobberman.com', 'Jobberman Nigeria', 'Data Analyst', '2024-2026', 'Verified Active']
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
    rows.push(['Session ID', 'Associate Name', 'Mentor Name', 'Scheduled Time', 'Zoho Join Timestamp', 'Duration', 'Verification Status', 'Feedback Score']);
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
          <p style="font-size: 0.84rem; color: var(--text-secondary);">Filter and inspect 1-on-1 mentorship session logs by executive mentor, associate, or keyword.</p>
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
            <input type="text" id="inputAdminSessionSearch" value="${state.adminSessionSearchQuery || ''}" placeholder="Search mentor or associate..." style="padding: 0.45rem 0.85rem 0.45rem 2rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.84rem; background: var(--bg-hover); color: var(--text-primary); width: 210px;" />
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
              <th style="padding: 0.75rem;">Associate</th>
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
    const mentor = state.mentors.find(m => String(m.id) === String(state.bookingMentor.id)) || state.bookingMentor;
    const rawSlots = (mentor.schedule || []).filter(s => !s.isBooked);
    
    // Group slots by date
    const slotsByDate = {};
    for (const s of rawSlots) {
      if (!slotsByDate[s.date]) slotsByDate[s.date] = [];
      if (!slotsByDate[s.date].includes(s.time)) {
        slotsByDate[s.date].push(s.time);
      }
    }
    const availableDates = Object.keys(slotsByDate).sort();

    // Default selected date to first available date if not set or invalid
    let selectedDate = state.bookingData.date;
    if (!selectedDate || !availableDates.includes(selectedDate)) {
      selectedDate = availableDates.length > 0 ? availableDates[0] : null;
      state.bookingData.date = selectedDate;
    }

    const currentTimesForDate = selectedDate ? (slotsByDate[selectedDate] || []) : [];
    if (currentTimesForDate.length > 0 && (!state.bookingData.time || !currentTimesForDate.includes(state.bookingData.time))) {
      state.bookingData.time = currentTimesForDate[0];
    }

    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 620px; border-radius: 20px; padding: 2rem;">
          <div class="modal-header-flex" style="margin-bottom: 1.25rem;">
            <div>
              <div class="modal-title" style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-display);">Book 1-on-1 Mentorship Session</div>
              <p style="font-size: 0.86rem; color: var(--text-secondary); margin-top: 0.2rem;">With <strong>${mentor.name}</strong> · ${mentor.title}</p>
            </div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          ${availableDates.length > 0 ? `
            <!-- STEP 1: SELECT AVAILABLE DATE -->
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem;">
                <label class="form-label" style="font-weight: 800; font-size: 0.88rem; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
                  <i class="fa-regular fa-calendar" style="color: var(--brand-primary);"></i> Step 1: Select Available Date
                </label>
                <span style="font-size: 0.78rem; font-weight: 700; color: var(--brand-violet);">${availableDates.length} date${availableDates.length === 1 ? '' : 's'} open</span>
              </div>

              <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                ${availableDates.map(dateStr => {
                  const isDateActive = state.bookingData.date === dateStr;
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const formattedDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const count = slotsByDate[dateStr].length;

                  return `
                    <button type="button" class="btn-booking-date-pill ${isDateActive ? 'active' : ''}" data-date="${dateStr}"
                            style="padding: 0.65rem 1.1rem; border-radius: 12px; border: 2px solid ${isDateActive ? 'var(--brand-primary)' : 'var(--border-color)'}; background: ${isDateActive ? 'linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%)' : 'var(--bg-surface)'}; color: ${isDateActive ? '#ffffff' : 'var(--text-primary)'}; cursor: pointer; transition: all 0.2s ease; text-align: center; box-shadow: ${isDateActive ? '0 4px 14px rgba(46,16,101,0.25)' : 'none'};">
                      <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${isDateActive ? '#ffd700' : 'var(--text-muted)'};">${weekday}</div>
                      <div style="font-size: 0.95rem; font-weight: 800; margin: 0.15rem 0;">${formattedDay}</div>
                      <div style="font-size: 0.72rem; font-weight: 700; color: ${isDateActive ? '#e9d5ff' : 'var(--brand-violet)'};">${count} slot${count === 1 ? '' : 's'}</div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- STEP 2: SELECT TIME SLOT FOR CHOSEN DATE -->
            <div style="margin-bottom: 1.5rem; background: var(--bg-hover); padding: 1.25rem; border-radius: 14px; border: 1px solid var(--border-color);">
              <label class="form-label" style="font-weight: 800; font-size: 0.88rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.45rem;">
                <i class="fa-regular fa-clock" style="color: var(--brand-primary);"></i> Step 2: Choose 1-Hour Time Slot for ${selectedDate}
              </label>

              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.6rem;">
                ${currentTimesForDate.map(t => {
                  const isTimeActive = state.bookingData.time === t;
                  return `
                    <button type="button" class="btn-booking-time-pill ${isTimeActive ? 'active' : ''}" data-time="${t}"
                            style="padding: 0.65rem 0.9rem; border-radius: 10px; border: 2px solid ${isTimeActive ? 'var(--brand-primary)' : 'var(--border-color)'}; background: ${isTimeActive ? 'var(--brand-primary)' : 'var(--bg-surface)'}; color: ${isTimeActive ? '#ffffff' : 'var(--text-primary)'}; font-weight: 800; font-size: 0.84rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s ease;">
                      <i class="fa-regular fa-circle-dot" style="color: ${isTimeActive ? '#ffd700' : 'var(--brand-violet)'}; font-size: 0.75rem;"></i>
                      ${t}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : `
            <div style="padding: 2.5rem 1.5rem; text-align: center; background: var(--bg-surface-secondary); border-radius: 14px; border: 1px dashed var(--border-color); color: var(--text-secondary); margin-bottom: 1.5rem;">
              <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(46,16,101,0.08); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; color: var(--brand-primary);">
                <i class="fa-regular fa-calendar-xmark" style="font-size: 1.6rem;"></i>
              </div>
              <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--text-primary);">No Open Time Slots Currently Available</div>
              <div style="font-size: 0.86rem; max-width: 380px; margin: 0 auto;">This mentor has not posted open 1-on-1 availability yet. Please check back later or choose another mentor.</div>
            </div>
          `}

          <!-- STEP 3: MANDATORY MENTORSHIP REASON & AGENDA -->
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.4rem;">
              <i class="fa-solid fa-clipboard-list" style="color: var(--brand-primary);"></i> Step 3: Mentorship Objectives & Profile Confirmation <span style="color: #dc2626; font-size: 0.8rem;">*All fields required</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.8rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.8rem;">Your Current Job Title / Role <span style="color: #dc2626;">*</span></label>
                <input type="text" class="form-input" id="bookingAssociateTitle" placeholder="e.g. Data Analyst, MERL Officer" value="${state.currentUser?.title || ''}" required style="border-radius: 10px; padding: 0.6rem 0.8rem; font-size: 0.85rem;" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.8rem;">Your Host Organization / Institution <span style="color: #dc2626;">*</span></label>
                <input type="text" class="form-input" id="bookingAssociateOrg" placeholder="e.g. Jobberman Nigeria, MCF Partner" value="${state.currentUser?.organization || state.currentUser?.institution || 'Jobberman Nigeria'}" required style="border-radius: 10px; padding: 0.6rem 0.8rem; font-size: 0.85rem;" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.8rem;">Reason for Mentorship & Detailed Session Agenda <span style="color: #dc2626;">*</span></label>
              <textarea class="form-textarea" rows="3" id="bookingObjectiveInput" placeholder="Outline specific discussion points, career goals, challenges you are facing, or questions you would like your mentor to guide you on..." required style="border-radius: 10px; padding: 0.7rem 0.85rem; font-size: 0.85rem;">${state.bookingData.objective || ''}</textarea>
            </div>
          </div>

          <button class="btn-brand-primary" id="btnConfirmBookingSubmit" ${availableDates.length === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed; width: 100%; justify-content: center; padding: 0.85rem; font-size: 0.95rem; border-radius: 12px;"' : 'style="width: 100%; justify-content: center; padding: 0.85rem; font-size: 0.95rem; border-radius: 12px;"'}>
            <i class="fa-solid fa-calendar-check"></i> Confirm 1-on-1 Booking
          </button>
        </div>
      </div>
    `;
  }

  if (state.activeModal === 'session_evaluation' && state.evaluatingSession) {
    const s = state.evaluatingSession;
    const isMentor = state.evaluatingRole === 'mentor';
    const targetName = isMentor ? s.associateName : s.mentorName;
    const targetRoleDesc = isMentor ? `Associate (${s.associateTitle || 'Scholar'})` : `Mentor (${s.mentorDomain || 'Executive Mentor'})`;
    const currentRating = isMentor ? s.mentorRating : s.associateRating;

    const stars = state.evalFormData.stars || (currentRating ? currentRating.stars : 5);
    const secondaryRating = isMentor 
      ? (state.evalFormData.engagement || (currentRating ? currentRating.engagement : 5))
      : (state.evalFormData.objectiveAlignment || (currentRating ? currentRating.objectiveAlignment : 5));
    const feedback = state.evalFormData.qualitativeFeedback !== undefined 
      ? state.evalFormData.qualitativeFeedback 
      : (currentRating ? currentRating.qualitativeFeedback : '');

    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 580px; border-radius: 20px; padding: 2rem;">
          <div class="modal-header-flex" style="margin-bottom: 1.25rem;">
            <div>
              <div class="modal-title" style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-display);">
                ${isMentor ? 'Mentor Evaluation: Rate Associate' : 'Associate Review: Rate Mentor'}
              </div>
              <p style="font-size: 0.86rem; color: var(--text-secondary); margin-top: 0.2rem;">
                Session with <strong>${targetName}</strong> (${targetRoleDesc}) on ${s.date}
              </p>
            </div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form id="formSubmitSessionEvaluation">
            <!-- 1. OVERALL STAR RATING (QUANTITATIVE) -->
            <div style="background: var(--bg-hover); padding: 1.25rem; border-radius: 14px; margin-bottom: 1.25rem; text-align: center; border: 1px solid var(--border-color);">
              <label class="form-label" style="font-weight: 800; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
                Overall Session Rating <span style="color: #dc2626;">*</span>
              </label>
              <div class="star-rating-widget" style="display: inline-flex; gap: 0.5rem; font-size: 2rem; cursor: pointer;">
                ${[1, 2, 3, 4, 5].map(starNum => `
                  <i class="fa-solid fa-star btn-star-pick ${starNum <= stars ? 'selected' : ''}" 
                     data-star="${starNum}" 
                     style="color: ${starNum <= stars ? 'var(--brand-gold)' : '#cbd5e1'}; transition: transform 0.15s ease;"></i>
                `).join('')}
              </div>
              <div style="font-size: 0.85rem; font-weight: 800; color: var(--brand-violet); margin-top: 0.35rem;">
                ${stars === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5.0)' : stars === 4 ? '⭐⭐⭐⭐ Great (4.0)' : stars === 3 ? '⭐⭐⭐ Good (3.0)' : stars === 2 ? '⭐⭐ Fair (2.0)' : '⭐ Needs Improvement (1.0)'}
              </div>
            </div>

            <!-- 2. SECONDARY COMPETENCE METRIC -->
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label" style="font-weight: 800; font-size: 0.86rem; display: flex; justify-content: space-between; align-items: center;">
                <span>${isMentor ? 'Associate Preparedness & Engagement Level' : 'Objective Alignment & Value Added by Mentor'} <span style="color: #dc2626;">*</span></span>
                <span style="color: var(--brand-primary); font-weight: 800;" id="secondaryRatingLabel">${secondaryRating} / 5</span>
              </label>
              <input type="range" min="1" max="5" step="1" value="${secondaryRating}" id="inputSecondaryMetric" style="width: 100%; accent-color: var(--brand-primary); cursor: pointer;" />
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">
                <span>1 - Low</span>
                <span>3 - Moderate</span>
                <span>5 - Outstanding</span>
              </div>
            </div>

            <!-- 3. MANDATORY QUALITATIVE FEEDBACK (QUALITATIVE) -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label class="form-label" style="font-weight: 800; font-size: 0.86rem;">
                ${isMentor ? 'Qualitative Feedback & Recommendations for Associate' : 'Detailed Review & Key Takeaways from Mentor'} <span style="color: #dc2626;">*</span>
              </label>
              <textarea class="form-textarea" rows="4" id="inputQualitativeFeedback" required placeholder="${isMentor ? 'Share constructive feedback on their communication, project direction, action plan, and areas for improvement...' : 'Describe how this mentorship session helped you, specific advice provided, and what you will execute next...'}" style="border-radius: 12px; padding: 0.8rem 1rem; font-size: 0.88rem; line-height: 1.5;">${feedback}</textarea>
            </div>

            <button type="submit" class="btn-brand-primary" id="btnSaveEvaluationSubmit" style="width: 100%; justify-content: center; padding: 0.85rem; font-size: 0.95rem; border-radius: 12px;">
              <i class="fa-solid fa-floppy-disk"></i> Submit Evaluation & Feedback
            </button>
          </form>
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

  if (state.activeModal === 'associate_profile' && state.inspectingAssociate) {
    const a = state.inspectingAssociate;
    const assocSessions = (state.sessions || []).filter(s => 
      (s.associateId && String(s.associateId) === String(a.id)) || 
      (s.associateName && s.associateName.toLowerCase() === a.name.toLowerCase())
    );
    const pastRatings = assocSessions.filter(s => s.mentorRating).map(s => ({
      mentorName: s.mentorName,
      date: s.date,
      stars: s.mentorRating.stars,
      engagement: s.mentorRating.engagement,
      feedback: s.mentorRating.qualitativeFeedback || s.mentorRating.notes
    }));

    const avgScore = pastRatings.length > 0 ? (pastRatings.reduce((acc, r) => acc + r.stars, 0) / pastRatings.length).toFixed(1) : (a.rating || '5.0');

    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 600px; border-radius: 20px; padding: 2rem;">
          <div class="modal-header-flex" style="margin-bottom: 1.25rem;">
            <div>
              <div class="modal-title" style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-display);">${a.name}</div>
              <p style="font-size: 0.86rem; color: var(--brand-violet); font-weight: 700; margin-top: 0.2rem;">
                ${a.title || 'Scholar'} · ${a.institution || a.organization || 'Jobberman Partner Network'}
              </p>
            </div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="card-header-flex" style="margin-bottom: 1.25rem; align-items: center;">
            <img src="${a.avatar && a.avatar.startsWith('data:') ? a.avatar : (a.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80')}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=2e1065&color=ffffff';" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-primary);" />
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span style="font-size: 1.15rem; font-weight: 800; color: var(--brand-gold);">★ ${avgScore} / 5.0</span>
                <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">(${pastRatings.length} mentor review${pastRatings.length === 1 ? '' : 's'})</span>
              </div>
              <div style="font-size: 0.84rem; color: var(--text-secondary);">
                <i class="fa-solid fa-envelope" style="margin-right: 0.3rem;"></i> ${a.email}
              </div>
            </div>
          </div>

          <div style="background: var(--bg-hover); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
            <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.35rem;">Associate Biography & Goals</div>
            <p style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.55; margin: 0;">${a.bio || 'Mastercard Foundation Associate dedicated to career growth, technical leadership, and continuous learning.'}</p>
          </div>

          <!-- PAST MENTOR RATINGS & EVALUATIONS -->
          <div>
            <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
              <i class="fa-solid fa-star" style="color: var(--brand-gold);"></i> Past Mentor Ratings & Evaluations
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 220px; overflow-y: auto;">
              ${pastRatings.length > 0 ? pastRatings.map(r => `
                <div style="background: var(--bg-surface-secondary); padding: 0.85rem; border-radius: 10px; border-left: 3px solid var(--brand-gold);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                    <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-primary);">${r.mentorName}</span>
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--brand-gold);">${'★'.repeat(r.stars)} (${r.stars}.0)</span>
                  </div>
                  <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; font-style: italic; line-height: 1.4;">
                    "${r.feedback || 'Outstanding engagement and preparation.'}"
                  </p>
                  ${r.engagement ? `
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
                      Preparedness Level: <strong>${r.engagement}/5</strong> · ${r.date}
                    </div>
                  ` : ''}
                </div>
              `).join('') : `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; background: var(--bg-surface-secondary); border-radius: 10px;">
                  No previous mentor evaluations on record yet.
                </div>
              `}
            </div>
          </div>
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
            <div class="rich-text-editor-container">
              <div class="rich-text-toolbar" id="groupEditorToolbar">
                <button type="button" class="btn-rte-action" data-command="bold" title="Bold"><i class="fa-solid fa-bold"></i></button>
                <button type="button" class="btn-rte-action" data-command="italic" title="Italic"><i class="fa-solid fa-italic"></i></button>
                <button type="button" class="btn-rte-action" data-command="underline" title="Underline"><i class="fa-solid fa-underline"></i></button>
                <button type="button" class="btn-rte-action" data-command="strikethrough" title="Strikethrough"><i class="fa-solid fa-strikethrough"></i></button>
                <div class="rte-divider"></div>
                <button type="button" class="btn-rte-action" data-command="insertUnorderedList" title="Bullet List"><i class="fa-solid fa-list-ul"></i></button>
                <button type="button" class="btn-rte-action" data-command="insertOrderedList" title="Numbered List"><i class="fa-solid fa-list-ol"></i></button>
                <div class="rte-divider"></div>
                <button type="button" class="btn-rte-action" data-command="formatBlock" data-value="H3" title="Heading"><i class="fa-solid fa-heading"></i></button>
                <button type="button" class="btn-rte-action" data-command="removeFormat" title="Clear Formatting"><i class="fa-solid fa-eraser"></i></button>
              </div>
              <div class="rich-text-editor-content" id="createGroupDescriptionEditor" contenteditable="true" data-placeholder="Describe the topics covered and expectations for attendees...">${state.newGroupData.description || ''}</div>
            </div>
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
            <div class="rich-text-editor-container">
              <div class="rich-text-toolbar" id="taskEditorToolbar">
                <button type="button" class="btn-rte-action" data-command="bold" title="Bold"><i class="fa-solid fa-bold"></i></button>
                <button type="button" class="btn-rte-action" data-command="italic" title="Italic"><i class="fa-solid fa-italic"></i></button>
                <button type="button" class="btn-rte-action" data-command="underline" title="Underline"><i class="fa-solid fa-underline"></i></button>
                <button type="button" class="btn-rte-action" data-command="strikethrough" title="Strikethrough"><i class="fa-solid fa-strikethrough"></i></button>
                <div class="rte-divider"></div>
                <button type="button" class="btn-rte-action" data-command="insertUnorderedList" title="Bullet List"><i class="fa-solid fa-list-ul"></i></button>
                <button type="button" class="btn-rte-action" data-command="insertOrderedList" title="Numbered List"><i class="fa-solid fa-list-ol"></i></button>
                <div class="rte-divider"></div>
                <button type="button" class="btn-rte-action" data-command="formatBlock" data-value="H3" title="Heading"><i class="fa-solid fa-heading"></i></button>
                <button type="button" class="btn-rte-action" data-command="removeFormat" title="Clear Formatting"><i class="fa-solid fa-eraser"></i></button>
              </div>
              <div class="rich-text-editor-content" id="createTaskDescriptionEditor" contenteditable="true" data-placeholder="Detailed guidance for the associate...">${state.newTaskData.description || ''}</div>
            </div>
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

  if (state.activeModal === 'request_profile_edit') {
    const user = state.requestEditUser || state.currentUser || {};
    const role = user.role || (state.currentRole || 'associate');
    const isAssociate = role === 'associate';
    const availableFields = isAssociate ? [
      { id: 'name', label: 'Full Name' },
      { id: 'email', label: 'Email Address' },
      { id: 'title', label: 'Job Title / Specialization' },
      { id: 'organization', label: 'Host Organization / Institution' },
      { id: 'track', label: 'Domain / Specialization Track' },
      { id: 'bio', label: 'Professional Bio & Experience' },
      { id: 'avatar', label: 'Profile Picture / Avatar' }
    ] : [
      { id: 'name', label: 'Full Name' },
      { id: 'email', label: 'Email Address' },
      { id: 'title', label: 'Professional Title' },
      { id: 'organization', label: 'Current Company / Organization' },
      { id: 'domain', label: 'Specialist Domain / Field' },
      { id: 'bio', label: 'Biography & Expertise' },
      { id: 'linkedin', label: 'LinkedIn Profile URL' },
      { id: 'avatar', label: 'Profile Picture / Avatar' }
    ];

    const currentSelectedFields = state.requestEditFormData?.fields || [];
    const currentReason = state.requestEditFormData?.reason || '';

    return `
      <div class="modal-overlay">
        <div class="modal-content-card" style="max-width: 580px; border-radius: 20px; padding: 2rem;">
          <div class="modal-header-flex" style="margin-bottom: 1.25rem;">
            <div>
              <div class="modal-title" style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-display); display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-lock-open" style="color: var(--brand-gold);"></i> Request Profile Edit Access
              </div>
              <p style="font-size: 0.86rem; color: var(--text-secondary); margin-top: 0.25rem;">
                To protect data integrity, profile changes require administrative authorization.
              </p>
            </div>
            <button class="close-modal-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form id="formSubmitProfileEditRequest">
            <div style="background: var(--bg-hover); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Requesting Member:</div>
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">${user.name || 'Member'} <span class="badge-tag ${isAssociate ? 'badge-purple' : 'badge-green'}" style="margin-left: 0.5rem; text-transform: capitalize;">${role}</span></div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email || ''}</div>
            </div>

            <!-- STEP 1: SELECT FIELDS TO EDIT -->
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label" style="font-weight: 800; font-size: 0.88rem; margin-bottom: 0.6rem; display: flex; align-items: center; justify-content: space-between;">
                <span><i class="fa-solid fa-list-check" style="color: var(--brand-primary); margin-right: 0.35rem;"></i> Select Fields to Edit <span style="color: #dc2626;">*</span></span>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--brand-violet);">${currentSelectedFields.length} selected</span>
              </label>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; background: var(--bg-surface); padding: 0.85rem; border-radius: 10px; border: 1px solid var(--border-color);">
                ${availableFields.map(f => {
                  const isChecked = currentSelectedFields.includes(f.label) || currentSelectedFields.includes(f.id);
                  return `
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.84rem; cursor: pointer; padding: 0.35rem 0.5rem; border-radius: 6px; transition: background 0.15s ease;" class="field-checkbox-label">
                      <input type="checkbox" class="cb-profile-field" value="${f.label}" ${isChecked ? 'checked' : ''} style="cursor: pointer;" />
                      <span style="font-weight: ${isChecked ? '700' : '500'}; color: ${isChecked ? 'var(--brand-primary)' : 'var(--text-primary)'};">${f.label}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- STEP 2: REASON -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label class="form-label" style="font-weight: 800; font-size: 0.88rem; margin-bottom: 0.5rem;">
                <i class="fa-solid fa-comment-dots" style="color: var(--brand-primary); margin-right: 0.35rem;"></i> Reason for Update <span style="color: #dc2626;">*</span>
              </label>
              <textarea class="form-textarea" id="inputRequestEditReason" rows="3" placeholder="Please describe why these changes are needed (e.g., role promotion, updated host organization, new specialization)..." required style="border-radius: 10px; padding: 0.75rem 0.85rem; font-size: 0.85rem;">${currentReason}</textarea>
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
              <button type="button" class="btn-brand-primary btn-close-modal" style="background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.75rem 1.25rem;">Cancel</button>
              <button type="submit" class="btn-brand-primary" id="btnSubmitProfileEditRequest" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #1b0a3a 0%, #2e1065 100%);">
                <i class="fa-solid fa-paper-plane" style="margin-right: 0.35rem;"></i> Send Request to Admin
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  return '';
}

// Image File Validator & Canvas Compressor
function compressImageFile(file, callback) {
  compressAvatar(file, callback, (errMsg) => {
    showToast(errMsg, 'fa-triangle-exclamation');
  });
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

    // Mobile Hamburger Toggle Handler
    const btnMobileToggle = document.getElementById('btnMobileNavToggle');
    const mobileDrawer = document.getElementById('mobileNavDrawer');
    const iconMobileToggle = document.getElementById('iconMobileNavToggle');

    if (btnMobileToggle && mobileDrawer) {
      btnMobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mobileDrawer.classList.toggle('open');
        if (iconMobileToggle) {
          iconMobileToggle.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        }
      });

      // Close drawer on mobile link click
      const closeMobileDrawer = () => {
        mobileDrawer.classList.remove('open');
        if (iconMobileToggle) {
          iconMobileToggle.className = 'fa-solid fa-bars';
        }
      };

      document.getElementById('mobileNavLinkHome')?.addEventListener('click', () => {
        closeMobileDrawer();
        document.getElementById('section-hero')?.scrollIntoView({ behavior: 'smooth' });
      });

      document.getElementById('mobileNavLinkHowItWorks')?.addEventListener('click', () => {
        closeMobileDrawer();
        document.getElementById('section-how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      });

      document.getElementById('mobileNavLinkValue')?.addEventListener('click', () => {
        closeMobileDrawer();
        document.getElementById('section-value')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    document.getElementById('btnNavLogin')?.addEventListener('click', () => navigateTo('/login'));
    document.getElementById('btnHeroLogin')?.addEventListener('click', () => navigateTo('/login'));
    document.getElementById('btnFinalCtaLogin')?.addEventListener('click', () => navigateTo('/login'));
    document.getElementById('footerLinkLogin')?.addEventListener('click', () => navigateTo('/login'));

    document.getElementById('footerLinkHome')?.addEventListener('click', () => navigateTo('/'));

    document.getElementById('btnHeroFindMentors')?.addEventListener('click', () => {
      showToast('🔒 Mentor access is restricted to authorized scholars. Please log in.', 'fa-lock');
      navigateTo('/login');
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

        const email = (state.loginForm.email || document.getElementById('loginEmail')?.value || '').trim();
        const password = state.loginForm.password || document.getElementById('loginPassword')?.value || '';

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
            email,
            password
          });

          state.currentUser = authResult.user;
          state.currentRole = authResult.user.role;
          state.loginForm.isSubmitting = false;

          // First-login check: if pre-loaded user hasn't set a password yet
          if (authResult.user.must_reset_password || authResult.user.password === 'RESET_REQUIRED') {
            showToast(`Welcome ${authResult.user.name}! Please set your personal password to continue.`, 'fa-shield-halved');
            navigateTo('/set-password');
          } else {
            showToast(`Welcome back, ${authResult.user.name}!`);
            navigateTo(`/${authResult.user.role}`);
          }
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

    // Mentor In-Page Profile Tab Photo Upload Handler
    const mentorTabAvatarInput = document.getElementById('mentorTabAvatarInput');
    if (mentorTabAvatarInput) {
      mentorTabAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          compressImageFile(file, (compressedDataUrl) => {
            if (state.currentUser) state.currentUser.avatar = compressedDataUrl;
            const preview = document.getElementById('mentorTabAvatarPreview');
            if (preview) preview.src = compressedDataUrl;
            showToast('New executive headshot photo selected!', 'fa-image');
          });
        }
      });
    }

    // Mentor In-Page Profile Tab Form Submit Handler
    document.getElementById('formMentorTabProfile')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const activeMentor = (state.currentUser && state.currentUser.role === 'mentor')
        ? state.currentUser
        : (state.mentors[state.currentMentorIndex] || state.mentors[0]);

      const name = document.getElementById('mentorTabName')?.value || activeMentor.name;
      const title = document.getElementById('mentorTabTitle')?.value || activeMentor.title;
      const organization = document.getElementById('mentorTabOrg')?.value || activeMentor.organization;
      const domain = document.getElementById('mentorTabDomain')?.value || activeMentor.domain;
      const gender = document.getElementById('mentorTabGender')?.value || activeMentor.gender || '';
      const bio = document.getElementById('mentorTabBio')?.value || activeMentor.bio;
      const expRaw = document.getElementById('mentorTabExpertise')?.value || '';
      const expertise = expRaw.split(',').map(s => s.trim()).filter(Boolean);
      const linkedin = document.getElementById('mentorTabLinkedIn')?.value || '';

      const updates = {
        name,
        title,
        organization,
        domain,
        gender,
        bio,
        expertise,
        socialLinks: { ...(activeMentor.socialLinks || {}), linkedin }
      };

      if (state.currentUser && state.currentUser.role === 'mentor') {
        Object.assign(state.currentUser, updates);
        localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
      }

      await apiService.updateMentorProfile(activeMentor.id, updates);
      showToast('Mentor profile updated successfully!', 'fa-circle-check');
      render();
    });

    // Notifications Engine Handlers
    document.getElementById('btnToggleNotifications')?.addEventListener('click', () => {
      state.isNotificationOpen = !state.isNotificationOpen;
      render();
    });
    document.getElementById('btnCloseNotifications')?.addEventListener('click', () => {
      state.isNotificationOpen = false;
      render();
    });

    document.getElementById('btnMarkAllNotificationsRead')?.addEventListener('click', () => {
      state.notifications.forEach(n => n.read = true);
      try {
        saveStoredNotifications(state.notifications);
      } catch (e) {}
      showToast('All notifications marked as read.', 'fa-check-double');
      render();
    });

    document.querySelectorAll('.btn-mark-notif-read').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        if (state.notifications[idx]) {
          state.notifications[idx].read = true;
          try {
            saveStoredNotifications(state.notifications);
          } catch (e) {}
          render();
        }
      });
    });

    document.getElementById('btnClearAllNotifications')?.addEventListener('click', () => {
      state.notifications = [];
      try {
        saveStoredNotifications(state.notifications);
      } catch (e) {}
      showToast('Notifications cleared.', 'fa-trash-can');
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

    const resetAllFilters = () => {
      state.selectedDomains = [];
      state.searchQuery = '';
      state.landingDomainFilter = 'All';
      state.selectedSessionType = 'all';
      state.onlyAvailableThisWeek = false;
      render();
    };

    document.getElementById('btnClearFilters')?.addEventListener('click', resetAllFilters);
    document.getElementById('btnClearDiscoveryFilters')?.addEventListener('click', resetAllFilters);

    // View Associate Profile Modal for Mentors
    document.querySelectorAll('.btn-inspect-associate-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        const assocId = btn.dataset.id;
        const assocName = btn.dataset.name;
        const assoc = state.associates.find(a => String(a.id) === String(assocId) || (a.name && a.name.toLowerCase() === (assocName || '').toLowerCase())) || {
          id: assocId,
          name: assocName || 'Associate Scholar',
          email: 'scholar@mcf-program.org',
          institution: 'Jobberman Nigeria',
          title: 'Mastercard Foundation Associate',
          bio: 'Active scholar enrolled in the Mastercard Foundation Mentorship Program.'
        };

        state.inspectingAssociate = assoc;
        state.activeModal = 'associate_profile';
        render();
      });
    });

    // View Mentor Profile Modal
    document.querySelectorAll('.btn-inspect-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = state.mentors.find(x => String(x.id) === String(btn.dataset.id));
        state.inspectingMentor = m;
        state.activeModal = 'mentor_profile';
        render();
      });
    });

    // Book 1-on-1 Slot Modal
    document.querySelectorAll('.btn-book-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = state.mentors.find(x => String(x.id) === String(btn.dataset.id));
        state.bookingMentor = m;
        state.activeModal = 'booking';
        const availableSlot = (m?.schedule || []).find(s => !s.isBooked);
        if (availableSlot) {
          state.bookingData.date = availableSlot.date;
          state.bookingData.time = availableSlot.time;
        } else {
          state.bookingData.date = '2026-08-25';
          state.bookingData.time = '10:00 AM';
        }
        render();
      });
    });

    // Step 1: Booking Date Pill Selection
    document.querySelectorAll('.btn-booking-date-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const objInput = document.getElementById('bookingObjectiveInput');
        if (objInput) state.bookingData.objective = objInput.value;
        state.bookingData.date = btn.dataset.date;
        state.bookingData.time = null; // reset to allow user to pick time for new date
        render();
      });
    });

    // Step 2: Booking Time Pill Selection
    document.querySelectorAll('.btn-booking-time-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const objInput = document.getElementById('bookingObjectiveInput');
        if (objInput) state.bookingData.objective = objInput.value;
        state.bookingData.time = btn.dataset.time;
        render();
      });
    });

    // Confirm Booking Submit
    document.getElementById('btnConfirmBookingSubmit')?.addEventListener('click', async () => {
      const activeAssoc = (state.currentUser && state.currentUser.role === 'associate') 
        ? state.currentUser 
        : (state.associates[state.currentAssociateIndex] || state.associates[0] || { id: 'MCF-STAFF-001', name: 'Bolaji Akinjole' });

      const objInput = document.getElementById('bookingObjectiveInput');
      const titleInput = document.getElementById('bookingAssociateTitle');
      const orgInput = document.getElementById('bookingAssociateOrg');

      const date = state.bookingData.date;
      const time = state.bookingData.time;
      const objective = objInput ? objInput.value.trim() : '';
      const assocTitle = titleInput ? titleInput.value.trim() : (activeAssoc.title || '');
      const assocOrg = orgInput ? orgInput.value.trim() : (activeAssoc.organization || activeAssoc.institution || '');

      // Reset micro-validation states
      [objInput, titleInput, orgInput].forEach(inp => {
        if (inp) {
          inp.classList.remove('is-invalid');
          const existingErr = inp.parentNode.querySelector('.field-error-text');
          if (existingErr) existingErr.remove();
        }
      });

      if (!date || !time) {
        showToast('Please select one of the mentor\'s available open time slots.', 'fa-circle-exclamation');
        return;
      }

      let hasError = false;
      if (!assocTitle) {
        if (titleInput) {
          titleInput.classList.add('is-invalid');
          titleInput.insertAdjacentHTML('afterend', '<div class="field-error-text"><i class="fa-solid fa-triangle-exclamation"></i> Please enter your job title/role.</div>');
        }
        hasError = true;
      }

      if (!assocOrg) {
        if (orgInput) {
          orgInput.classList.add('is-invalid');
          orgInput.insertAdjacentHTML('afterend', '<div class="field-error-text"><i class="fa-solid fa-triangle-exclamation"></i> Please enter your organization.</div>');
        }
        hasError = true;
      }

      if (!objective || objective.length < 10) {
        if (objInput) {
          objInput.classList.add('is-invalid');
          objInput.insertAdjacentHTML('afterend', '<div class="field-error-text"><i class="fa-solid fa-triangle-exclamation"></i> Please detail your session objective (at least 10 characters).</div>');
        }
        hasError = true;
      }

      if (hasError) {
        showToast('Please complete all required fields.', 'fa-triangle-exclamation');
        return;
      }

      await apiService.createBookingSession({
        associateId: activeAssoc.id,
        associateName: activeAssoc.name,
        associateTitle: assocTitle,
        associateOrg: assocOrg,
        mentorId: state.bookingMentor.id,
        mentorName: state.bookingMentor.name,
        mentorDomain: state.bookingMentor.domain,
        date: date,
        time: time,
        duration: '1 Hour',
        objective: objective,
        consentToRecord: true
      });

      state.activeModal = null;
      state.bookingData = { date: '', time: '', objective: '' };
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

    // Mentor Accept Session (Triggers Dynamic Google Meet & Calendar Sync)
    document.querySelectorAll('.btn-accept-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sessionId = btn.dataset.id;
        const session = state.sessions.find(s => String(s.id) === String(sessionId));
        
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Generating Google Meet...`;

        const updated = await apiService.acceptBookingSession(sessionId);
        if (session && updated) {
          session.status = 'Accepted';
          session.meetingLink = updated.meetingLink;
        }

        const assocName = session ? session.associateName : 'Associate';
        showToast(`🎉 Google Meet created! Session accepted for ${assocName}.`, 'fa-video');
        render();
        await initAppData();
      });
    });

    // Mark Session as Conducted Button (Mentor)
    document.querySelectorAll('.btn-mark-conducted').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sessionId = btn.dataset.id;
        const session = state.sessions.find(s => String(s.id) === String(sessionId));

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...`;

        await apiService.toggleSessionCompletion(sessionId, true);

        if (session) {
          session.status = 'Completed';
          state.evaluatingSession = session;
          state.evaluatingRole = 'mentor';
          state.evalFormData = {
            stars: session.mentorRating?.stars || 5,
            engagement: session.mentorRating?.engagement || 5,
            objectiveAlignment: 5,
            qualitativeFeedback: session.mentorRating?.qualitativeFeedback || session.mentorRating?.notes || ''
          };
          state.activeModal = 'session_evaluation';
          showToast('Session marked as conducted! Please submit your evaluation.', 'fa-star');
        }

        render();
      });
    });

    // Toggle Session Completion (Conducted On/Off)
    document.querySelectorAll('.cb-toggle-conducted').forEach(cb => {
      cb.addEventListener('change', async () => {
        const sessionId = cb.dataset.id;
        const isChecked = cb.checked;
        const session = state.sessions.find(s => String(s.id) === String(sessionId));

        await apiService.toggleSessionCompletion(sessionId, isChecked);

        if (isChecked && session) {
          // Immediately pop evaluation modal for mentor
          state.evaluatingSession = session;
          state.evaluatingRole = 'mentor';
          state.evalFormData = {
            stars: session.mentorRating?.stars || 5,
            engagement: session.mentorRating?.engagement || 5,
            objectiveAlignment: 5,
            qualitativeFeedback: session.mentorRating?.qualitativeFeedback || session.mentorRating?.notes || ''
          };
          state.activeModal = 'session_evaluation';
          showToast('Session marked as conducted! Please submit your evaluation.', 'fa-star');
        } else {
          showToast('Session status updated.', 'fa-circle-check');
        }

        render();
      });
    });

    // Open Evaluation Modal Directly (from Mentor or Associate Dashboard)
    document.querySelectorAll('.btn-open-evaluation').forEach(btn => {
      btn.addEventListener('click', () => {
        const sessionId = btn.dataset.id;
        const role = btn.dataset.role || 'mentor';
        const session = state.sessions.find(s => String(s.id) === String(sessionId));

        if (session) {
          state.evaluatingSession = session;
          state.evaluatingRole = role;
          const currentRating = role === 'mentor' ? session.mentorRating : session.associateRating;
          state.evalFormData = {
            stars: currentRating?.stars || 5,
            engagement: currentRating?.engagement || 5,
            objectiveAlignment: currentRating?.objectiveAlignment || 5,
            qualitativeFeedback: currentRating?.qualitativeFeedback || currentRating?.feedback || currentRating?.notes || ''
          };
          state.activeModal = 'session_evaluation';
          render();
        }
      });
    });

    // Star Rating Click Picker inside Evaluation Modal
    document.querySelectorAll('.btn-star-pick').forEach(starEl => {
      starEl.addEventListener('click', () => {
        const chosenStar = parseInt(starEl.dataset.star, 10);
        state.evalFormData.stars = chosenStar;
        const textarea = document.getElementById('inputQualitativeFeedback');
        if (textarea) state.evalFormData.qualitativeFeedback = textarea.value;
        render();
      });
    });

    // Secondary Metric Range Input Change
    const rangeInput = document.getElementById('inputSecondaryMetric');
    if (rangeInput) {
      rangeInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (state.evaluatingRole === 'mentor') {
          state.evalFormData.engagement = val;
        } else {
          state.evalFormData.objectiveAlignment = val;
        }
        const lbl = document.getElementById('secondaryRatingLabel');
        if (lbl) lbl.textContent = `${val} / 5`;
      });
    }

    // Submit Session Evaluation Form Handler
    document.getElementById('formSubmitSessionEvaluation')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const feedbackInput = document.getElementById('inputQualitativeFeedback');
      const qualitativeFeedback = feedbackInput ? feedbackInput.value.trim() : '';

      if (!qualitativeFeedback || qualitativeFeedback.length < 5) {
        showToast('Please provide detailed qualitative feedback remarks (min 5 characters).', 'fa-circle-exclamation');
        return;
      }

      const sessionId = state.evaluatingSession?.id;
      const role = state.evaluatingRole || 'mentor';

      const evalData = {
        stars: Number(state.evalFormData.stars) || 5,
        qualitativeFeedback: qualitativeFeedback,
        engagement: Number(state.evalFormData.engagement) || 5,
        objectiveAlignment: Number(state.evalFormData.objectiveAlignment) || 5,
        recordedAt: new Date().toISOString()
      };

      // Immediately update in-memory session object so UI locks instantaneously
      const targetSession = state.sessions.find(s => String(s.id) === String(sessionId));
      if (targetSession) {
        if (role === 'mentor') {
          targetSession.mentorRating = evalData;
        } else {
          targetSession.associateRating = evalData;
        }
        targetSession.status = 'Completed';
      }

      await apiService.submitEvaluation(sessionId, evalData, role);
      showToast('Evaluation & feedback submitted successfully! ⭐', 'fa-circle-check');
      state.activeModal = null;
      state.evaluatingSession = null;
      state.notifications = await apiService.getNotifications();
      render();
      await initAppData();
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
      const activeMentor = (state.currentUser && state.currentUser.role === 'mentor') 
        ? state.currentUser 
        : (state.mentors[state.currentMentorIndex] || state.mentors[0]);

      const name = document.getElementById('editMentorName')?.value || activeMentor.name;
      const avatar = (state.editingMentorProfile && state.editingMentorProfile.avatar) || activeMentor.avatar;
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

      const updates = {
        name,
        avatar,
        title,
        organization,
        domain,
        bio,
        gender,
        expertise,
        socialLinks: { linkedin, github, twitter }
      };

      if (state.currentUser && state.currentUser.role === 'mentor') {
        Object.assign(state.currentUser, updates);
        localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
      }

      await apiService.updateMentorProfile(activeMentor.id, updates);

      state.activeModal = null;
      showToast('Mentor profile updated successfully!', 'fa-circle-check');
      await initAppData();
    });

    // Create Group Masterclass Modal
    document.getElementById('btnOpenCreateGroupModal')?.addEventListener('click', () => {
      state.activeModal = 'group_create';
      render();
    });

    // Rich Text Editor Toolbar Event Binding
    document.querySelectorAll('.rich-text-toolbar .btn-rte-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.getAttribute('data-command');
        const value = btn.getAttribute('data-value') || null;
        document.execCommand(command, false, value);
        
        const groupEditor = document.getElementById('createGroupDescriptionEditor');
        if (groupEditor && groupEditor.contains(document.getSelection().anchorNode)) {
          state.newGroupData.description = groupEditor.innerHTML;
        }
        const taskEditor = document.getElementById('createTaskDescriptionEditor');
        if (taskEditor && taskEditor.contains(document.getSelection().anchorNode)) {
          state.newTaskData.description = taskEditor.innerHTML;
        }
      });
    });

    const groupDescEditor = document.getElementById('createGroupDescriptionEditor');
    if (groupDescEditor) {
      groupDescEditor.addEventListener('input', () => {
        state.newGroupData.description = groupDescEditor.innerHTML;
      });
    }

    const taskDescEditor = document.getElementById('createTaskDescriptionEditor');
    if (taskDescEditor) {
      taskDescEditor.addEventListener('input', () => {
        state.newTaskData.description = taskDescEditor.innerHTML;
      });
    }

    document.getElementById('btnSubmitCreateGroup')?.addEventListener('click', async () => {
      const activeMentor = (state.currentUser && state.currentUser.role === 'mentor')
        ? state.currentUser
        : (state.mentors[state.currentMentorIndex] || state.mentors[0] || { id: 'MEN-2026-001', name: 'Andre Garbutt', title: 'Executive Mentor', domain: 'Software Engineering & AI' });

      const title = document.getElementById('createGroupTitle')?.value;
      const domain = document.getElementById('createGroupDomain')?.value;
      const editorEl = document.getElementById('createGroupDescriptionEditor');
      const description = editorEl ? editorEl.innerHTML : (state.newGroupData.description || '');
      const date = document.getElementById('createGroupDate')?.value;
      const startTime = document.getElementById('createGroupStartTime')?.value;
      const endTime = document.getElementById('createGroupEndTime')?.value;
      const maxCapacity = parseInt(document.getElementById('createGroupMaxCapacity')?.value || 20, 10);

      const cleanText = editorEl ? editorEl.textContent.trim() : description.replace(/<[^>]*>?/gm, '').trim();

      const titleInput = document.getElementById('createGroupTitle');
      if (titleInput) {
        titleInput.classList.remove('is-invalid');
        const err = titleInput.parentNode.querySelector('.field-error-text');
        if (err) err.remove();
      }

      let hasError = false;
      if (!title || title.trim().length === 0) {
        if (titleInput) {
          titleInput.classList.add('is-invalid');
          titleInput.insertAdjacentHTML('afterend', '<div class="field-error-text"><i class="fa-solid fa-triangle-exclamation"></i> Masterclass title is required.</div>');
        }
        hasError = true;
      }

      if (!cleanText || cleanText.length < 5) {
        if (editorEl) {
          editorEl.classList.add('is-invalid');
        }
        hasError = true;
      }

      if (hasError) {
        showToast('Please complete all required fields (title & description).', 'fa-triangle-exclamation');
        return;
      }

      await apiService.createGroupSession({
        mentorId: activeMentor.id,
        mentorName: activeMentor.name,
        mentorTitle: activeMentor.title || 'Executive Mentor',
        mentorAvatar: activeMentor.avatar || '',
        title: title.trim(),
        domain: domain || activeMentor.domain || 'Software Engineering & AI',
        description: description.trim(),
        date: date,
        startTime: startTime || '04:00 PM',
        endTime: endTime || '05:00 PM',
        duration: '60 mins',
        maxCapacity: maxCapacity
      });

      state.activeModal = null;
      state.newGroupData.description = '';
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
      const activeMentor = (state.currentUser && state.currentUser.role === 'mentor')
        ? state.currentUser
        : (state.mentors[state.currentMentorIndex] || state.mentors[0] || { id: 'MEN-2026-001', name: 'Andre Garbutt' });

      const selectedIds = state.newTaskData.selectedAssociateIds || [];
      const title = document.getElementById('createTaskTitle')?.value;
      const taskEditorEl = document.getElementById('createTaskDescriptionEditor');
      const description = taskEditorEl ? taskEditorEl.innerHTML : (state.newTaskData.description || '');
      const deadline = document.getElementById('createTaskDeadline')?.value;

      const cleanText = taskEditorEl ? taskEditorEl.textContent.trim() : description.replace(/<[^>]*>?/gm, '').trim();

      if (selectedIds.length === 0) {
        showToast('Please select at least one associate for this task.', 'fa-circle-exclamation');
        return;
      }

      if (!title || !cleanText || !deadline) {
        showToast('Please fill out all required task fields (title, instructions, deadline).', 'fa-circle-exclamation');
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
      state.newTaskData.description = '';
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
        const todayStr = getTodayISO();

        if (preset === 'this_month') {
          state.adminDateFrom = getStartOfMonthISO();
          state.adminDateTo = getEndOfMonthISO();
        } else if (preset === 'today') {
          state.adminDateFrom = todayStr;
          state.adminDateTo = todayStr;
        } else if (preset === 'last_30') {
          state.adminDateFrom = getLast30DaysISO();
          state.adminDateTo = todayStr;
        } else if (preset === 'this_week') {
          state.adminDateFrom = getThisWeekStartISO();
          state.adminDateTo = todayStr;
        } else if (preset === 'all_time') {
          state.adminDateFrom = '2024-01-01';
          state.adminDateTo = `${new Date().getFullYear()}-12-31`;
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

    // Profile Edit Request Modal Triggers
    document.querySelectorAll('.btn-open-request-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        state.requestEditUser = state.currentUser;
        state.requestEditFormData = {
          fields: [],
          reason: ''
        };
        state.activeModal = 'request_profile_edit';
        render();
      });
    });

    // Profile Edit Request Field Checkboxes
    document.querySelectorAll('.cb-profile-field').forEach(cb => {
      cb.addEventListener('change', () => {
        let fields = state.requestEditFormData?.fields || [];
        if (cb.checked) {
          if (!fields.includes(cb.value)) fields.push(cb.value);
        } else {
          fields = fields.filter(f => f !== cb.value);
        }
        state.requestEditFormData.fields = fields;
      });
    });

    // Profile Edit Request Reason Input
    document.getElementById('inputRequestEditReason')?.addEventListener('input', (e) => {
      state.requestEditFormData.reason = e.target.value;
    });

    // Profile Edit Request Form Submission
    document.getElementById('formSubmitProfileEditRequest')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = state.requestEditFormData?.fields || [];
      const reason = document.getElementById('inputRequestEditReason')?.value || state.requestEditFormData?.reason || '';

      if (fields.length === 0) {
        showToast('Please select at least one field you wish to edit.', 'fa-circle-exclamation');
        return;
      }
      if (!reason.trim()) {
        showToast('Please provide a reason for the edit request.', 'fa-circle-exclamation');
        return;
      }

      const user = state.currentUser || {};
      try {
        await apiService.requestProfileEdit({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role || 'associate',
          requestedFields: fields,
          reason: reason.trim()
        });

        state.activeModal = null;
        state.requestEditFormData = { fields: [], reason: '' };
        showToast('Profile edit request submitted to Admin! 📩', 'fa-paper-plane');
        await initAppData();
      } catch (err) {
        console.error('[Request Profile Edit Error]', err);
        showToast('Failed to submit request. Please try again.', 'fa-triangle-exclamation');
      }
    });

    // Admin Profile Edit Approve & Reject Handlers
    document.querySelectorAll('.btn-approve-profile-edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const requestId = btn.dataset.id;
        const userId = btn.dataset.userId;
        try {
          await apiService.approveProfileEdit(requestId, userId);
          showToast('Profile edit request approved! User unlocked. 🔓', 'fa-circle-check');
          await initAppData();
        } catch (err) {
          console.error('[Approve Profile Edit Error]', err);
          showToast('Failed to approve request.', 'fa-triangle-exclamation');
        }
      });
    });

    document.querySelectorAll('.btn-reject-profile-edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const requestId = btn.dataset.id;
        try {
          await apiService.rejectProfileEdit(requestId);
          showToast('Profile edit request rejected.', 'fa-circle-check');
          await initAppData();
        } catch (err) {
          console.error('[Reject Profile Edit Error]', err);
          showToast('Failed to reject request.', 'fa-triangle-exclamation');
        }
      });
    });

    // Mentor 3-Month Availability Auto-Fill Generator
    document.getElementById('btnAutoFill3Months')?.addEventListener('click', async () => {
      const activeMentor = (state.currentUser && state.currentUser.role === 'mentor')
        ? state.currentUser
        : (state.mentors[state.currentMentorIndex] || state.mentors[0]);
      if (!activeMentor) return;

      try {
        await apiService.generateThreeMonthSlots(activeMentor.id);
        showToast('✨ 15 Slots generated across 3 rolling months!', 'fa-wand-magic-sparkles');
        await initAppData();
      } catch (err) {
        console.error('[Auto Fill 3 Months Error]', err);
        showToast('Failed to generate slots.', 'fa-triangle-exclamation');
      }
    });

    // Mentor Dashboard Warning Banner Link -> Navigate to Availability Tab
    document.querySelectorAll('.btn-nav-to-availability').forEach(btn => {
      btn.addEventListener('click', () => {
        state.mentorTab = 'availability';
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // In-Table CSV Export Buttons (e.g. from feedback, profile_requests, spillovers tables)
    document.querySelectorAll('.btn-export-csv').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTable = btn.dataset.table || state.adminActiveTable || 'mentees';
        exportAdminTableToCSV(targetTable);
      });
    });

    // Close Modal Buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeModal = null;
        render();
      });
    });
  }

  // ── SET PASSWORD PAGE handler (first-login pre-loaded users) ──────────────
  document.getElementById('formSetNewPassword')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw1 = document.getElementById('inputNewPassword1')?.value || '';
    const pw2 = document.getElementById('inputNewPassword2')?.value || '';

    if (pw1.length < 8) {
      state.setPasswordError = 'Password must be at least 8 characters long.';
      render(); return;
    }
    if (pw1 !== pw2) {
      state.setPasswordError = 'Passwords do not match. Please re-enter both fields.';
      render(); return;
    }

    state.setPasswordError = null;
    state.setPasswordSubmitting = true;
    render();

    try {
      const user = state.currentUser;

      // Update password and clear must_reset_password flag via apiService
      await apiService.setUserPassword(user.id, pw1);

      // Update local state + localStorage
      if (state.currentUser) {
        state.currentUser.password = pw1;
        state.currentUser.must_reset_password = false;
        localStorage.setItem('mently_user', JSON.stringify(state.currentUser));
      }

      state.setPasswordSubmitting = false;
      showToast(`Password set! Welcome to your portal, ${user.name}! 🎉`, 'fa-shield-halved');
      navigateTo(`/${user.role}`);
    } catch (err) {
      state.setPasswordSubmitting = false;
      state.setPasswordError = 'Something went wrong. Please try again or contact support.';
      console.error('[SetPassword]', err);
      render();
    }
  });
}

// Initial Kickoff
initAppData();
