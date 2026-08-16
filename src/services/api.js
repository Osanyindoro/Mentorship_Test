// Mently Mentorship Platform - Integration-Ready API Service Layer (Supabase + Local Fallback)
import {
  getStoredSessions, saveStoredSessions,
  getStoredGroupSessions, saveStoredGroupSessions,
  getStoredTasks, saveStoredTasks,
  getStoredNotifications, saveStoredNotifications,
  getStoredAssociates, saveStoredAssociates,
  getStoredMentors, saveStoredMentors
} from '../data/mockData.js';
import { getSupabaseClient } from './supabase.js';

const env = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : {};
const API_BASE_URL = env.VITE_API_BASE_URL || '/v1';
const USE_MOCK = false; // Primary Supabase DB mode enabled

console.log(`[Mently API Service] Supabase Connected: https://wbzkaealhtsawfqvzccq.supabase.co`);

export const apiService = {
  getCurrentUser() {
    const userStr = localStorage.getItem('mently_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('mently_auth_token');
    localStorage.removeItem('mently_user');
    window.location.href = '/login';
  },

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

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const fetchUserPromise = supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase auth timeout')), 3000)
        );

        const { data, error } = await Promise.race([fetchUserPromise, timeoutPromise]);

        if (data && !error) {
          if (data.password && data.password !== password) {
            throw new Error("Invalid email or password.");
          }
          const userObj = {
            id: data.id,
            role: data.role,
            name: data.name,
            email: data.email,
            institution: data.institution || data.organization || 'Mastercard Foundation Partner',
            organization: data.organization || data.institution || 'Jobberman Partner Network',
            title: data.title || 'Scholar',
            track: data.track || data.domain || 'Software Engineering & AI',
            domain: data.domain || data.track || 'Software Engineering & AI',
            bio: data.bio || '',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
            schedule: data.schedule || []
          };
          const token = `mcf_supa_${Date.now()}`;
          localStorage.setItem('mently_auth_token', token);
          localStorage.setItem('mently_user', JSON.stringify(userObj));
          return { token, user: userObj };
        }
      } catch (err) {
        console.warn('[Supabase Auth Check]', err.message);
        if (err.message && err.message.includes('Invalid email or password')) throw err;
      }
    }

    // Local Storage Mock Fallback
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
        id: "ADM-001",
        role: "admin",
        name: "Program Administrator",
        email: cleanEmail,
        institution: "Mastercard Foundation HQ",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
      };
      actualRole = 'admin';
    }

    if (!userAccount) {
      const newUser = {
        id: selectedRole === 'associate' ? `MCF-2026-REG-${Math.floor(100 + Math.random() * 900)}` : `MEN-REG-${Math.floor(100 + Math.random() * 900)}`,
        role: selectedRole,
        name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: cleanEmail,
        institution: 'Jobberman Partner Network',
        organization: 'Jobberman Partner Network',
        title: selectedRole === 'associate' ? 'Mastercard Foundation Scholar' : 'Executive Mentor',
        track: 'Software Engineering & AI',
        domain: 'Software Engineering & AI',
        bio: 'Active Mastercard Foundation portal member.',
        avatar: selectedRole === 'associate' ? 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        schedule: selectedRole === 'mentor' ? [{ id: Date.now(), date: '2026-08-22', time: '10:00 AM', isBooked: false, bookedBy: null }] : []
      };
      userAccount = newUser;
      actualRole = selectedRole;

      if (selectedRole === 'associate') {
        associates.unshift(newUser);
        saveStoredAssociates(associates);
      } else if (selectedRole === 'mentor') {
        mentors.unshift(newUser);
        saveStoredMentors(mentors);
      }
    }

    const token = `mcf_token_${Date.now()}`;
    const responsePayload = { token, user: { ...userAccount, role: actualRole } };

    localStorage.setItem('mently_auth_token', token);
    localStorage.setItem('mently_user', JSON.stringify(responsePayload.user));

    return responsePayload;
  },

  async register({ selectedRole, name, email, password, institutionOrOrg, title, trackOrDomain, bio, avatar }) {
    if (!name || !name.trim()) throw new Error("Please provide your full name.");
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error("Please enter a valid email address.");
    if (!password || password.length < 6) throw new Error("Password must be at least 6 characters long.");

    const newId = selectedRole === 'associate' ? `MCF-2026-REG-${Math.floor(100 + Math.random() * 900)}` : `MEN-REG-${Math.floor(100 + Math.random() * 900)}`;

    const userObj = {
      id: newId,
      role: selectedRole || 'associate',
      name: name.trim(),
      email: cleanEmail,
      password: password,
      institution: institutionOrOrg || 'Jobberman Partner Network',
      organization: institutionOrOrg || 'Jobberman Partner Network',
      title: title || (selectedRole === 'associate' ? 'Mastercard Foundation Scholar' : 'Executive Mentor'),
      track: trackOrDomain || 'Software Engineering & AI',
      domain: trackOrDomain || 'Software Engineering & AI',
      bio: bio || 'Active Mastercard Foundation portal member.',
      avatar: avatar && avatar.trim() !== '' ? avatar : (selectedRole === 'associate' ? 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'),
      schedule: selectedRole === 'mentor' ? [{ id: Date.now(), date: '2026-08-22', time: '10:00 AM', isBooked: false, bookedBy: null }] : []
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('users').insert([userObj]);
        if (error) console.warn('[Supabase Register Warning]', error.message);
      } catch (err) {
        console.warn('[Supabase Register Error]', err.message);
      }
    }

    // Save locally for instant reactivity
    if (selectedRole === 'associate') {
      const associates = getStoredAssociates();
      associates.unshift(userObj);
      saveStoredAssociates(associates);
    } else {
      const mentors = getStoredMentors();
      mentors.unshift(userObj);
      saveStoredMentors(mentors);
    }

    const token = `mcf_supa_${Date.now()}`;
    localStorage.setItem('mently_auth_token', token);
    localStorage.setItem('mently_user', JSON.stringify(userObj));

    return { token, user: userObj };
  },

  async getAssociates() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'associate');
        if (data && data.length > 0 && !error) {
          return data.map(u => ({
            ...u,
            careerGoal: u.career_goal || u.careerGoal || '',
            skills: u.skills || [],
            socialLinks: u.social_links || u.socialLinks || {}
          }));
        }

        // Auto-seed default associates into Supabase if empty
        const defaultAssocs = getStoredAssociates().map(u => ({
          id: u.id,
          role: 'associate',
          name: u.name,
          email: u.email,
          password: u.password || 'password123',
          phone: u.phone || '+233 24 555 0192',
          institution: u.institution || 'Ashesi University / Carnegie Mellon Africa',
          organization: u.institution || 'Jobberman Partner Network',
          cohort: u.cohort || '2024-2026 Cohort',
          title: u.title || 'Scholar',
          track: u.track || 'Software Engineering & Data Science',
          domain: u.track || 'Software Engineering & Data Science',
          bio: u.bio || '',
          avatar: u.avatar,
          skills: u.skills || ["Python", "Machine Learning", "System Design"],
          career_goal: u.careerGoal || "Lead AI Research & Development in Africa.",
          schedule: u.schedule || []
        }));

        try {
          await supabase.from('users').insert(defaultAssocs);
        } catch (e) {
          console.warn('[Supabase Seed Associates]', e.message);
        }
        return defaultAssocs;
      } catch (err) {
        console.warn('[Supabase Associates Fetch]', err.message);
      }
    }
    return getStoredAssociates();
  },

  async getMentors() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'mentor');
        if (data && data.length > 0 && !error) {
          return data.map(u => ({
            ...u,
            rating: u.rating || 5.0,
            totalSessions: u.totalSessions || 42,
            expertise: u.expertise || ["AI / Machine Learning", "Career Guidance"],
            socialLinks: u.social_links || u.socialLinks || { linkedin: "https://linkedin.com" }
          }));
        }

        // Auto-seed default mentors into Supabase if empty
        const defaultMentors = getStoredMentors().map(u => ({
          id: u.id,
          role: 'mentor',
          name: u.name,
          email: u.email,
          password: u.password || 'password123',
          phone: u.phone || '+234 80 918 2736',
          institution: u.organization || 'DeepMind / CMU Africa Faculty',
          organization: u.organization || 'DeepMind / CMU Africa Faculty',
          title: u.title || 'Executive Mentor',
          track: u.domain || 'Software Engineering & AI',
          domain: u.domain || 'Software Engineering & AI',
          bio: u.bio || '',
          avatar: u.avatar,
          expertise: u.expertise || ["AI / Machine Learning", "PhD Advice"],
          social_links: u.socialLinks || { linkedin: "https://linkedin.com/in/samuelosei" },
          schedule: u.schedule || []
        }));

        try {
          await supabase.from('users').insert(defaultMentors);
        } catch (e) {
          console.warn('[Supabase Seed Mentors]', e.message);
        }
        return defaultMentors;
      } catch (err) {
        console.warn('[Supabase Mentors Fetch]', err.message);
      }
    }
    return getStoredMentors();
  },

  async getSessions() {
    return this.fetchSessions();
  },

  async getGroupSessions() {
    return getStoredGroupSessions();
  },

  async getTasks() {
    return getStoredTasks();
  },

  async getNotifications() {
    return getStoredNotifications();
  },

  async fetchAssociates() {
    return this.getAssociates();
  },

  async fetchMentors() {
    return this.getMentors();
  },

  async fetchSessions() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sessions').select('*');
        if (data && data.length > 0 && !error) return data;
      } catch (err) {
        console.warn('[Supabase Sessions Fetch]', err.message);
      }
    }
    return getStoredSessions();
  },

  async updateMentorMonthlyCap(mentorId, newCap) {
    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      mentor.monthlyCap = parseInt(newCap, 10);
      saveStoredMentors(mentors);
    }
    return mentor;
  },

  async addMentorSlot(mentorId, slotData) {
    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      if (!mentor.schedule) mentor.schedule = [];
      mentor.schedule.push({ ...slotData, isBooked: false, bookedBy: null });
      saveStoredMentors(mentors);
    }

    const supabase = getSupabaseClient();
    if (supabase && mentor) {
      try {
        await supabase.from('users').update({ schedule: mentor.schedule }).eq('id', mentorId);
      } catch (err) {
        console.warn('[Supabase Add Slot]', err.message);
      }
    }
    return mentor;
  },

  async removeMentorSlot(mentorId, slotIndex) {
    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor && mentor.schedule && mentor.schedule[slotIndex]) {
      mentor.schedule.splice(slotIndex, 1);
      saveStoredMentors(mentors);
    }

    const supabase = getSupabaseClient();
    if (supabase && mentor) {
      try {
        await supabase.from('users').update({ schedule: mentor.schedule }).eq('id', mentorId);
      } catch (err) {
        console.warn('[Supabase Remove Slot]', err.message);
      }
    }
    return mentor;
  },

  async createBookingSession(bookingData) {
    const sessions = getStoredSessions();
    const newSession = {
      id: `SES-${Math.floor(8000 + Math.random() * 1000)}`,
      ...bookingData,
      status: 'Pending',
      meetingLink: `https://meet.zoho.com/mcf-mentorship-ses-${Math.floor(8000 + Math.random() * 1000)}`
    };
    sessions.unshift(newSession);
    saveStoredSessions(sessions);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('sessions').insert([newSession]);
      } catch (err) {
        console.warn('[Supabase Create Session]', err.message);
      }
    }
    return newSession;
  },

  async acceptBookingSession(sessionId) {
    const sessions = getStoredSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'Accepted';
      saveStoredSessions(sessions);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('sessions').update({ status: 'Accepted' }).eq('id', sessionId);
      } catch (err) {
        console.warn('[Supabase Accept Session]', err.message);
      }
    }
    return session;
  },

  async joinGroupSession(groupId, associateName) {
    const groups = getStoredGroupSessions();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.enrolledCount = (group.enrolledCount || 0) + 1;
      saveStoredGroupSessions(groups);
    }
    return group;
  },

  async updateTaskStatus(taskId, status) {
    const tasks = getStoredTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      saveStoredTasks(tasks);
    }
    return task;
  }
};
