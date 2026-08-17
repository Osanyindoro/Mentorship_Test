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
          if (data.role && selectedRole && data.role !== selectedRole) {
            throw new Error(`This account is registered as a ${data.role.toUpperCase()}. Please select "${data.role.charAt(0).toUpperCase() + data.role.slice(1)}" from the login dropdown.`);
          }
          if (data.password && data.password !== password) {
            throw new Error("Invalid email or password.");
          }
          const userObj = {
            id: data.id,
            role: data.role,
            name: data.name,
            email: data.email,
            password: data.password || '',
            gender: data.gender || '',
            must_reset_password: data.must_reset_password || false,
            institution: data.institution || data.organization || 'Mastercard Foundation Partner',
            organization: data.organization || data.institution || 'Jobberman Partner Network',
            title: data.title || 'Scholar',
            track: data.track || data.domain || 'Software Engineering & AI',
            domain: data.domain || data.track || 'Software Engineering & AI',
            bio: data.bio || '',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
            schedule: data.schedule || [],
            monthlyCap: data.monthly_cap || data.monthlyCap || 15,
            sessionsUsedThisMonth: data.sessions_used || data.sessionsUsedThisMonth || 0,
            expertise: data.expertise || ["Career Guidance", "Leadership Strategy"],
            socialLinks: data.social_links || data.socialLinks || { linkedin: "https://linkedin.com" }
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

  async register({ selectedRole, name, email, password, gender, institutionOrOrg, title, trackOrDomain, bio, avatar }) {
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
      gender: gender || '',
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
            id: u.id,
            role: u.role || 'associate',
            name: u.name || '',
            email: u.email || '',
            password: u.password || '',
            gender: u.gender || '',
            must_reset_password: u.must_reset_password || false,
            phone: u.phone || '+234 801 000 0000',
            institution: u.institution || u.organization || 'Jobberman Nigeria',
            organization: u.organization || u.institution || 'Jobberman Nigeria',
            cohort: u.cohort || '2024-2026 Cohort',
            title: u.title || 'Mastercard Foundation Associate',
            track: u.track || u.domain || 'Software Engineering & AI',
            domain: u.domain || u.track || 'Software Engineering & AI',
            bio: u.bio || '',
            avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
            skills: u.skills || ["Communication", "Leadership", "Project Management"],
            careerGoal: u.career_goal || u.careerGoal || '',
            schedule: u.schedule || []
          }));
        }
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
            id: u.id,
            role: 'mentor',
            name: u.name || '',
            email: u.email || '',
            password: u.password || '',
            gender: u.gender || '',
            organization: u.organization || u.institution || 'Jobberman Partner Network',
            institution: u.institution || u.organization || 'Jobberman Partner Network',
            title: u.title || 'Executive Mentor',
            domain: u.domain || u.track || 'Software Engineering & AI',
            track: u.track || u.domain || 'Software Engineering & AI',
            bio: u.bio || '',
            avatar: u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
            rating: u.rating || 5.0,
            totalSessions: u.total_sessions || u.totalSessions || 25,
            monthlyCap: u.monthly_cap || u.monthlyCap || 15,
            sessionsUsedThisMonth: u.sessions_used || u.sessionsUsedThisMonth || 0,
            expertise: u.expertise || ["Career Guidance", "Leadership Strategy"],
            socialLinks: u.social_links || u.socialLinks || { linkedin: "https://linkedin.com" },
            schedule: u.schedule || []
          }));
        }
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

  // Save associate profile fields (including gender) to Supabase
  async updateAssociateProfile(userId, updates) {
    const supabase = getSupabaseClient();
    if (supabase && userId) {
      try {
        const payload = {};
        if (updates.name !== undefined)        payload.name = updates.name;
        if (updates.email !== undefined)       payload.email = updates.email;
        if (updates.institution !== undefined) payload.institution = updates.institution;
        if (updates.organization !== undefined) payload.organization = updates.organization;
        if (updates.title !== undefined)       payload.title = updates.title;
        if (updates.track !== undefined)       payload.track = updates.track;
        if (updates.bio !== undefined)         payload.bio = updates.bio;
        if (updates.gender !== undefined)      payload.gender = updates.gender;
        if (updates.avatar !== undefined)      payload.avatar = updates.avatar;
        const { error } = await supabase.from('users').update(payload).eq('id', userId);
        if (error) console.warn('[Supabase Update Associate Profile]', error.message);
      } catch (err) {
        console.warn('[Supabase Update Associate Profile]', err.message);
      }
    }
  },

  // Save mentor profile fields (including gender) to Supabase
  async updateMentorProfile(mentorId, updates) {
    const supabase = getSupabaseClient();
    if (supabase && mentorId) {
      try {
        const payload = {};
        if (updates.name !== undefined)         payload.name = updates.name;
        if (updates.title !== undefined)        payload.title = updates.title;
        if (updates.organization !== undefined) payload.organization = updates.organization;
        if (updates.domain !== undefined)       payload.domain = updates.domain;
        if (updates.bio !== undefined)          payload.bio = updates.bio;
        if (updates.gender !== undefined)       payload.gender = updates.gender;
        if (updates.expertise !== undefined)    payload.expertise = updates.expertise;
        if (updates.avatar !== undefined)       payload.avatar = updates.avatar;
        if (updates.socialLinks !== undefined)  payload.social_links = updates.socialLinks;
        const { error } = await supabase.from('users').update(payload).eq('id', mentorId);
        if (error) console.warn('[Supabase Update Mentor Profile]', error.message);
      } catch (err) {
        console.warn('[Supabase Update Mentor Profile]', err.message);
      }
    }
    // Also update local mock store
    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      Object.assign(mentor, updates);
      saveStoredMentors(mentors);
    }
    return mentor;
  },

  async fetchSessions() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sessions').select('*');
        if (data && data.length > 0 && !error) {
          return data.map(s => ({
            id: s.id,
            associateId: s.associateId || s.associate_id || '',
            associateName: s.associateName || s.associate_name || 'Associate',
            mentorId: s.mentorId || s.mentor_id || '',
            mentorName: s.mentorName || s.mentor_name || 'Mentor',
            mentorDomain: s.mentorDomain || s.mentor_domain || '',
            date: s.date,
            time: s.time,
            duration: s.duration || '1 Hour',
            objective: s.objective || '',
            status: s.status || 'Pending',
            meetingLink: s.meetingLink || s.meeting_link || s.meetingUrl || '',
            createdAt: s.created_at || s.createdAt || ''
          }));
        }
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
    const supabase = getSupabaseClient();
    let updatedSchedule = null;

    if (supabase && mentorId) {
      try {
        const { data: userRecord } = await supabase.from('users').select('schedule').eq('id', mentorId).single();
        const sched = (userRecord && Array.isArray(userRecord.schedule)) ? userRecord.schedule : [];
        sched.push({ ...slotData, isBooked: false, bookedBy: null });
        updatedSchedule = sched;
        await supabase.from('users').update({ schedule: sched }).eq('id', mentorId);
      } catch (err) {
        console.warn('[Supabase Add Slot]', err.message);
      }
    }

    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      if (!mentor.schedule) mentor.schedule = [];
      mentor.schedule.push({ ...slotData, isBooked: false, bookedBy: null });
      saveStoredMentors(mentors);
      if (!updatedSchedule) updatedSchedule = mentor.schedule;
    }
    return updatedSchedule;
  },

  async removeMentorSlot(mentorId, slotIndex) {
    const supabase = getSupabaseClient();
    let updatedSchedule = null;

    if (supabase && mentorId) {
      try {
        const { data: userRecord } = await supabase.from('users').select('schedule').eq('id', mentorId).single();
        if (userRecord && Array.isArray(userRecord.schedule) && userRecord.schedule[slotIndex]) {
          userRecord.schedule.splice(slotIndex, 1);
          updatedSchedule = userRecord.schedule;
          await supabase.from('users').update({ schedule: userRecord.schedule }).eq('id', mentorId);
        }
      } catch (err) {
        console.warn('[Supabase Remove Slot]', err.message);
      }
    }

    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor && mentor.schedule && mentor.schedule[slotIndex]) {
      mentor.schedule.splice(slotIndex, 1);
      saveStoredMentors(mentors);
      if (!updatedSchedule) updatedSchedule = mentor.schedule;
    }
    return updatedSchedule;
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

    // Also update mentor schedule if matched
    const mentors = getStoredMentors();
    const mentor = mentors.find(m => String(m.id) === String(bookingData.mentorId));
    if (mentor) {
      if (!mentor.schedule) mentor.schedule = [];
      const existingSlot = mentor.schedule.find(s => s.date === bookingData.date && s.time === bookingData.time);
      if (existingSlot) {
        existingSlot.isBooked = true;
        existingSlot.bookedBy = bookingData.associateName;
      } else {
        mentor.schedule.push({
          date: bookingData.date,
          time: bookingData.time,
          isBooked: true,
          bookedBy: bookingData.associateName
        });
      }
      saveStoredMentors(mentors);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const dbSessionPayload = {
          id: newSession.id,
          associate_id: newSession.associateId || '',
          associate_name: newSession.associateName || '',
          mentor_id: newSession.mentorId || '',
          mentor_name: newSession.mentorName || '',
          mentor_domain: newSession.mentorDomain || '',
          date: newSession.date,
          time: newSession.time,
          duration: newSession.duration || '1 Hour',
          objective: newSession.objective || '',
          status: 'Pending',
          meeting_link: newSession.meetingLink || ''
        };
        await supabase.from('sessions').insert([dbSessionPayload]);
        if (mentor) {
          await supabase.from('users').update({ schedule: mentor.schedule }).eq('id', mentor.id);
        }
      } catch (err) {
        console.warn('[Supabase Create Session]', err.message);
      }
    }
    return newSession;
  },

  async acceptBookingSession(sessionId) {
    // Official Google Meet instant launch room link
    const googleMeetLink = `https://meet.google.com/new`;

    const sessions = getStoredSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'Accepted';
      session.meetingLink = googleMeetLink;
      session.provider = 'Google Meet';
      saveStoredSessions(sessions);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('sessions')
          .update({ 
            status: 'Accepted',
            meeting_link: googleMeetLink
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('[Supabase Accept Session]', err.message);
      }
    }
    return session;
  },

  async createGroupSession(groupData) {
    const groups = getStoredGroupSessions();
    const newGroup = {
      id: `GRP-${Math.floor(100 + Math.random() * 900)}`,
      mentorId: groupData.mentorId,
      mentorName: groupData.mentorName,
      mentorTitle: groupData.mentorTitle || 'Executive Mentor',
      mentorAvatar: groupData.mentorAvatar || '',
      title: groupData.title,
      domain: groupData.domain || 'Software Engineering & AI',
      description: groupData.description,
      date: groupData.date,
      startTime: groupData.startTime || '04:00 PM',
      endTime: groupData.endTime || '05:00 PM',
      duration: groupData.duration || '60 mins',
      maxCapacity: groupData.maxCapacity || 20,
      enrolledMentees: [],
      enrolledCount: 0
    };
    groups.unshift(newGroup);
    saveStoredGroupSessions(groups);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('group_sessions').insert([newGroup]);
      } catch (err) {
        console.warn('[Supabase Create Group Session]', err.message);
      }
    }
    return newGroup;
  },

  async joinGroupSession(groupId, associateName) {
    const groups = getStoredGroupSessions();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      if (!group.enrolledMentees) group.enrolledMentees = [];
      if (!group.enrolledMentees.includes(associateName)) {
        group.enrolledMentees.push(associateName);
      }
      group.enrolledCount = group.enrolledMentees.length;
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
  },

  // First-login password setup for pre-loaded/seeded users
  async setUserPassword(userId, newPassword) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword, must_reset_password: false })
        .eq('id', userId);
      if (error) throw new Error(error.message);
    }
    return true;
  }
};
