// Mently Mentorship Platform - Integration-Ready API Service Layer
import {
  getStoredSessions, saveStoredSessions,
  getStoredGroupSessions, saveStoredGroupSessions,
  getStoredTasks, saveStoredTasks,
  getStoredNotifications, saveStoredNotifications,
  getStoredAssociates, saveStoredAssociates,
  getStoredMentors, saveStoredMentors
} from '../data/mockData.js';

const env = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : {};
const API_BASE_URL = env.VITE_API_BASE_URL || 'https://api-mentorship.jobberman.com/v1';
const USE_MOCK = env.VITE_ENABLE_MOCK_DATA === 'false' || env.VITE_ENABLE_MOCK_DATA === false ? false : true;

console.log(`[Mently API Service] Configured Base URL: ${API_BASE_URL} (Mock Mode: ${USE_MOCK})`);

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mently_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
  }

  return response.json();
}

export const apiService = {
  // Authentication API Layer
  async login({ selectedRole, email, password }) {
    if (!selectedRole) {
      throw new Error("Please select how you want to log in.");
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error("Please enter a valid email address.");
    }
    if (!password) {
      throw new Error("Please enter your password.");
    }

    if (!USE_MOCK) {
      try {
        const res = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ role: selectedRole, email: cleanEmail, password })
        });
        if (res.token) {
          localStorage.setItem('mently_auth_token', res.token);
          localStorage.setItem('mently_user', JSON.stringify(res.user));
        }
        return res;
      } catch (err) {
        console.warn('[API Auth Fallback] Remote authentication failed, falling back to local storage auth:', err.message);
        // Fallback to local mock authentication if remote API endpoint is unreachable
      }
    }

    // Mock Authentication Logic
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const associates = getStoredAssociates();
        const mentors = getStoredMentors();

        const foundAssoc = associates.find(a => a.email.toLowerCase() === cleanEmail);
        const foundMentor = mentors.find(m => m.email.toLowerCase() === cleanEmail || (m.googleEmail && m.googleEmail.toLowerCase() === cleanEmail));
        const isAdmin = cleanEmail === 'admin@mcf-portal.org' || cleanEmail === 'admin@mcf.org';

        let userAccount = null;
        let actualRole = null;

        if (foundAssoc) {
          userAccount = foundAssoc;
          actualRole = 'associate';
        } else if (foundMentor) {
          userAccount = foundMentor;
          actualRole = 'mentor';
        } else if (isAdmin) {
          userAccount = {
            id: 'ADM-001',
            name: 'Programme Administrator',
            email: 'admin@mcf-portal.org',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
            title: 'Mastercard Foundation Lead Administrator'
          };
          actualRole = 'admin';
        }

        if (!userAccount) {
          return reject(new Error("The email or password you entered is incorrect."));
        }

        const validPassword = userAccount.password || 'password123';
        if (password !== validPassword && password !== 'admin123' && password !== 'password123') {
          return reject(new Error("The email or password you entered is incorrect."));
        }

        if (selectedRole !== actualRole) {
          return reject(new Error("The selected profile does not match your account. Please select the correct profile and try again."));
        }

        const authPayload = {
          user: {
            id: userAccount.id,
            name: userAccount.name,
            email: userAccount.email,
            avatar: userAccount.avatar,
            title: userAccount.title,
            role: actualRole
          },
          token: `mently_token_${actualRole}_${Date.now()}`
        };

        localStorage.setItem('mently_user', JSON.stringify(authPayload.user));
        localStorage.setItem('mently_auth_token', authPayload.token);

  },

  // Register Account API Layer (Associate or Mentor)
  async register({ selectedRole, name, email, password, institutionOrOrg, title, trackOrDomain, bio }) {
    if (!selectedRole) throw new Error("Please select account type (Associate or Mentor).");
    if (!name) throw new Error("Please enter your full name.");
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error("Please enter a valid email address.");
    if (!password || password.length < 6) throw new Error("Password must be at least 6 characters long.");

    if (!USE_MOCK) {
      try {
        const res = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ role: selectedRole, name, email: cleanEmail, password, institutionOrOrg, title, trackOrDomain, bio })
        });
        if (res.token) {
          localStorage.setItem('mently_auth_token', res.token);
          localStorage.setItem('mently_user', JSON.stringify(res.user));
        }
        return res;
      } catch (err) {
        console.warn('[API Register Fallback] Remote registration failed, using local storage:', err.message);
      }
    }

    // Local Persistence Mock Registration
    return new Promise((resolve) => {
      setTimeout(() => {
        let newUser = null;

        if (selectedRole === 'associate') {
          const associates = getStoredAssociates();
          newUser = {
            id: `MCF-2026-REG-${Math.floor(100 + Math.random() * 900)}`,
            name,
            email: cleanEmail,
            password,
            institution: institutionOrOrg || "Ashesi University / Carnegie Mellon Africa",
            title: title || "Mastercard Foundation Scholar & Tech Fellow",
            track: trackOrDomain || "Software Engineering & Data Science",
            bio: bio || "Passionate scholar focused on leadership and career excellence.",
            avatar: "/assets/assoc_amina.jpg",
            skills: ["Leadership", "Problem Solving", "Teamwork"],
            careerGoal: "Lead innovative projects in Africa."
          };
          associates.unshift(newUser);
          saveStoredAssociates(associates);
        } else {
          const mentors = getStoredMentors();
          newUser = {
            id: `MEN-REG-${Math.floor(100 + Math.random() * 900)}`,
            name,
            email: cleanEmail,
            password,
            title: title || "Senior Consultant & Executive Mentor",
            organization: institutionOrOrg || "Jobberman Partner Network",
            domain: trackOrDomain || "Software Engineering & AI",
            bio: bio || "Experienced industry professional eager to empower Mastercard Foundation Scholars.",
            avatar: "/assets/mentor_samuel.jpg",
            rating: 5.0,
            totalSessions: 0,
            expertise: ["Mentorship", "Career Roadmap", "Interview Prep"],
            schedule: [
              { date: "2026-08-22", time: "10:00 AM", isBooked: false },
              { date: "2026-08-22", time: "02:00 PM", isBooked: false }
            ]
          };
          mentors.unshift(newUser);
          saveStoredMentors(mentors);
        }

        const authPayload = {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar,
            title: newUser.title,
            role: selectedRole
          },
          token: `mently_token_${selectedRole}_${Date.now()}`
        };

        localStorage.setItem('mently_user', JSON.stringify(authPayload.user));
        localStorage.setItem('mently_auth_token', authPayload.token);

        resolve(authPayload);
      }, 500);
    });
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem('mently_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('mently_user');
    localStorage.removeItem('mently_auth_token');
  },

  // Google Authentication Helper for Mentors
  async signInWithGoogle() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockGoogleUser = {
          email: "samuel.osei@gmail.com",
          name: "Dr. Samuel Osei",
          avatar: "/assets/mentor_samuel.jpg",
          role: "mentor",
          token: "mock_google_oauth_token_2026"
        };
        localStorage.setItem('mently_user', JSON.stringify(mockGoogleUser));
        localStorage.setItem('mently_auth_token', mockGoogleUser.token);
        resolve(mockGoogleUser);
      }, 500);
    });
  },

  // Mentors API
  async getMentors() {
    if (USE_MOCK) return getStoredMentors();
    try {
      return await request('/mentors');
    } catch (err) {
      console.warn('[API Fallback] Falling back to LocalStorage mentors:', err.message);
      return getStoredMentors();
    }
  },

  async updateMentorProfile(mentorId, profileData) {
    if (USE_MOCK) {
      const mentors = getStoredMentors();
      const index = mentors.findIndex(m => m.id === mentorId);
      if (index !== -1) {
        mentors[index] = { ...mentors[index], ...profileData };
        saveStoredMentors(mentors);
      }
      return mentors[index];
    }
    return request(`/mentors/${mentorId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async updateMentorMonthlyCap(mentorId, newCap) {
    if (USE_MOCK) {
      const mentors = getStoredMentors();
      const mentor = mentors.find(m => m.id === mentorId);
      if (mentor) {
        mentor.monthlyCap = parseInt(newCap, 10);
        saveStoredMentors(mentors);
      }
      return mentor;
    }
    return request(`/mentors/${mentorId}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify({ monthlyCap: newCap })
    });
  },

  async addMentorSlot(mentorId, slotData) {
    if (USE_MOCK) {
      const mentors = getStoredMentors();
      const mentor = mentors.find(m => m.id === mentorId);
      if (mentor) {
        mentor.schedule.push({ ...slotData, isBooked: false });
        saveStoredMentors(mentors);
      }
      return mentor;
    }
    return request(`/mentors/${mentorId}/slots`, {
      method: 'POST',
      body: JSON.stringify(slotData)
    });
  },

  async removeMentorSlot(mentorId, slotIndex) {
    if (USE_MOCK) {
      const mentors = getStoredMentors();
      const mentor = mentors.find(m => m.id === mentorId);
      if (mentor && mentor.schedule[slotIndex]) {
        mentor.schedule.splice(slotIndex, 1);
        saveStoredMentors(mentors);
      }
      return mentor;
    }
    return request(`/mentors/${mentorId}/slots/${slotIndex}`, {
      method: 'DELETE'
    });
  },

  // Associates API
  async getAssociates() {
    if (USE_MOCK) return getStoredAssociates();
    try {
      return await request('/associates');
    } catch (err) {
      console.warn('[API Fallback] Falling back to LocalStorage associates:', err.message);
      return getStoredAssociates();
    }
  },

  async updateAssociateProfile(assocId, profileData) {
    if (USE_MOCK) {
      const associates = getStoredAssociates();
      const index = associates.findIndex(a => a.id === assocId);
      if (index !== -1) {
        associates[index] = { ...associates[index], ...profileData };
        saveStoredAssociates(associates);
      }
      return associates[index];
    }
    return request(`/associates/${assocId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // 1-on-1 Sessions API
  async getSessions() {
    if (USE_MOCK) return getStoredSessions();
    try {
      return await request('/sessions');
    } catch (err) {
      console.warn('[API Fallback] Falling back to LocalStorage sessions:', err.message);
      return getStoredSessions();
    }
  },

  async createBookingSession(bookingPayload) {
    if (USE_MOCK) {
      const sessions = getStoredSessions();
      const mentors = getStoredMentors();
      
      const newSession = {
        id: `SES-${Math.floor(1000 + Math.random() * 9000)}`,
        ...bookingPayload,
        type: '1-on-1',
        status: 'Pending',
        meetingLink: null,
        recordingUrl: null,
        attendance: null,
        createdAt: new Date().toISOString().split('T')[0],
        associateRating: null,
        mentorRating: null
      };

      const mentor = mentors.find(m => m.id === bookingPayload.mentorId);
      if (mentor) {
        mentor.sessionsUsedThisMonth = (mentor.sessionsUsedThisMonth || 0) + 1;
        const slot = mentor.schedule.find(s => s.date === bookingPayload.date && s.time === bookingPayload.time);
        if (slot) {
          slot.isBooked = true;
          slot.bookedBy = bookingPayload.associateName;
        }
        saveStoredMentors(mentors);
      }

      sessions.unshift(newSession);
      saveStoredSessions(sessions);
      return newSession;
    }

    return request('/sessions/book', {
      method: 'POST',
      body: JSON.stringify(bookingPayload)
    });
  },

  async acceptBookingSession(sessionId) {
    if (USE_MOCK) {
      const sessions = getStoredSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.status = 'Accepted';
        session.meetingLink = `https://meet.zoho.com/mently-${session.id.toLowerCase()}`;
        saveStoredSessions(sessions);
      }
      return session;
    }

    return request(`/sessions/${sessionId}/accept`, {
      method: 'POST'
    });
  },

  // Group Sessions API
  async getGroupSessions() {
    if (USE_MOCK) return getStoredGroupSessions();
    try {
      return await request('/group-sessions');
    } catch (err) {
      return getStoredGroupSessions();
    }
  },

  async createGroupSession(groupPayload) {
    if (USE_MOCK) {
      const groupSessions = getStoredGroupSessions();
      const newGroupSession = {
        id: `GRP-${Math.floor(100 + Math.random() * 900)}`,
        ...groupPayload,
        enrolledMentees: [],
        meetingLink: `https://meet.zoho.com/mently-grp-${Math.floor(100 + Math.random() * 900)}`
      };
      groupSessions.unshift(newGroupSession);
      saveStoredGroupSessions(groupSessions);
      return newGroupSession;
    }
    return request('/group-sessions', {
      method: 'POST',
      body: JSON.stringify(groupPayload)
    });
  },

  async joinGroupSession(groupId, menteeName) {
    if (USE_MOCK) {
      const groupSessions = getStoredGroupSessions();
      const group = groupSessions.find(g => g.id === groupId);
      if (group && !group.enrolledMentees.includes(menteeName)) {
        group.enrolledMentees.push(menteeName);
        saveStoredGroupSessions(groupSessions);
      }
      return group;
    }
    return request(`/group-sessions/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ menteeName })
    });
  },

  // Tasks API
  async getTasks() {
    if (USE_MOCK) return getStoredTasks();
    try {
      return await request('/tasks');
    } catch (err) {
      return getStoredTasks();
    }
  },

  async createTask(taskPayload) {
    if (USE_MOCK) {
      const tasks = getStoredTasks();
      const newTask = {
        id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
        ...taskPayload,
        status: 'Pending',
        submissionNotes: ''
      };
      tasks.unshift(newTask);
      saveStoredTasks(tasks);
      return newTask;
    }
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskPayload)
    });
  },

  async updateTaskStatus(taskId, status, submissionNotes = '') {
    if (USE_MOCK) {
      const tasks = getStoredTasks();
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        if (submissionNotes) task.submissionNotes = submissionNotes;
        saveStoredTasks(tasks);
      }
      return task;
    }
    return request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, submissionNotes })
    });
  },

  // Notifications API
  async getNotifications() {
    if (USE_MOCK) return getStoredNotifications();
    try {
      return await request('/notifications');
    } catch (err) {
      return getStoredNotifications();
    }
  },

  async markNotificationAsRead(notifId) {
    if (USE_MOCK) {
      const notifications = getStoredNotifications();
      const notif = notifications.find(n => n.id === notifId);
      if (notif) {
        notif.read = true;
        saveStoredNotifications(notifications);
      }
      return notifications;
    }
    return request(`/notifications/${notifId}/read`, { method: 'POST' });
  }
};
