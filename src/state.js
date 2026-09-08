// Application State Store & Reactive Manager
import { getStoredTheme } from './data/mockData.js';
import { apiService } from './services/api.js';
import { getStartOfMonthISO, getEndOfMonthISO } from './utils/dateHelpers.js';

function getInitialRoute() {
  const path = window.location.pathname;
  if (path === '/login') return '/login';
  if (path === '/set-password') return '/set-password';
  if (path === '/associate') return '/associate';
  if (path === '/mentor') return '/mentor';
  if (path === '/admin') return '/admin';
  return '/';
}

const initialUser = apiService.getCurrentUser();

export const state = {
  theme: getStoredTheme() || 'light',
  currentPath: getInitialRoute(),     // '/' | '/login' | '/associate' | '/mentor' | '/admin'
  currentUser: initialUser,           // null or { id, name, email, avatar, title, role }
  currentRole: initialUser ? initialUser.role : 'associate',

  // Active Navigation Tabs for Dashboards
  associateTab: 'home',               // 'home' | 'mentors' | 'group_sessions' | 'tasks' | 'sessions'
  mentorTab: 'dashboard',             // 'dashboard' | 'availability' | 'group_sessions' | 'tasks'
  adminTab: 'analytics',              // 'analytics' | 'mentors' | 'sessions'
  adminActiveTable: 'mentees',        // 'mentees' | 'mentors' | 'sessions' | 'attendance'
  adminMenteeSearchQuery: '',
  adminMonthFilter: 'current_month',
  adminDateFrom: getStartOfMonthISO(),// Dynamic Start Date (YYYY-MM-01)
  adminDateTo: getEndOfMonthISO(),    // Dynamic End Date (YYYY-MM-LastDay)
  adminDatePreset: 'this_month',      // 'custom' | 'today' | 'this_week' | 'this_month' | 'last_30' | 'all_time'
  adminSessionMentorFilter: 'ALL',    // 'ALL' or mentor ID/name
  adminSessionSearchQuery: '',
  adminRowsPerPage: 25,               // 10 | 25 | 50 | 100 | 200 | 500

  currentAssociateIndex: 0,
  currentMentorIndex: 0,
  googleUser: initialUser && initialUser.role === 'mentor' ? initialUser : null,

  isNotificationOpen: false,
  isLoadingData: true,

  // Search & Filter State
  landingDomainFilter: 'All',
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
  activeModal: null,                 // null | 'booking' | 'mentor_profile' | 'group_create' | 'task_create' | 'admin_cap' | 'edit_mentor_profile' | 'session_evaluation'
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
    date: getStartOfMonthISO(),
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
    deadline: getEndOfMonthISO()
  },

  // Collections
  associates: [],
  mentors: [],
  sessions: [],
  groupSessions: [],
  tasks: [],
  notifications: [],

  // Set Password Page
  setPasswordError: null,
  setPasswordSubmitting: false
};
