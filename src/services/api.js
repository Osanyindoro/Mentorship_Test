import {
  getStoredSessions, saveStoredSessions,
  getStoredGroupSessions, saveStoredGroupSessions,
  getStoredTasks, saveStoredTasks,
  getStoredNotifications, saveStoredNotifications,
  getStoredAssociates, saveStoredAssociates,
  getStoredMentors, saveStoredMentors,
  getStoredProfileEditRequests, saveStoredProfileEditRequests,
  getStoredSpillovers, saveStoredSpillovers
} from '../data/mockData.js';
import { getSupabaseClient } from './supabase.js';
import { emailService } from './emailService.js';

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

  // Authentication API Layer (Smart Universal Auto-Detect + Role-Aware)
  async login({ selectedRole, email, password }) {
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
          setTimeout(() => reject(new Error('Supabase auth timeout')), 3500)
        );

        const { data, error } = await Promise.race([fetchUserPromise, timeoutPromise]);

        if (data && !error) {
          if (data.password && data.password !== password) {
            throw new Error("Invalid email or password.");
          }
          const userRole = (data.role || 'associate').toLowerCase();
          const userObj = {
            id: data.id,
            role: userRole,
            name: data.name,
            email: data.email,
            password: data.password || '',
            gender: data.gender || '',
            must_reset_password: data.must_reset_password || false,
            institution: data.institution || data.organization || 'Mastercard Foundation Partner',
            organization: data.organization || data.institution || 'Jobberman Partner Network',
            title: data.title || (userRole === 'mentor' ? 'Executive Mentor' : userRole === 'admin' ? 'Program Administrator' : 'Scholar'),
            track: data.track || data.domain || 'Software Engineering & AI',
            domain: data.domain || data.track || 'Software Engineering & AI',
            bio: data.bio || '',
            avatar: data.avatar || (userRole === 'mentor' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'),
            schedule: data.schedule || [],
            monthlyCap: data.monthly_cap || data.monthlyCap || 15,
            sessionsUsedThisMonth: data.sessions_used || data.sessionsUsedThisMonth || 0,
            expertise: data.expertise || ["Career Guidance", "Leadership Strategy"],
            socialLinks: data.social_links || data.socialLinks || { linkedin: "https://linkedin.com" },
            canEditProfile: data.can_edit_profile || data.canEditProfile || false
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

    // Local Storage Mock Fallback with Universal Auto-Detect
    const associates = getStoredAssociates();
    const mentors = getStoredMentors();

    const foundAssoc = associates.find(a => a.email.toLowerCase() === cleanEmail);
    const foundMentor = mentors.find(m => m.email.toLowerCase() === cleanEmail || (m.googleEmail && m.googleEmail.toLowerCase() === cleanEmail));
    const isAdmin = cleanEmail === 'admin@mcf-portal.org' || cleanEmail === 'admin@mcf.org' || cleanEmail === 'bakinjole@jobberman.com';

    if (foundAssoc) {
      if (foundAssoc.password && foundAssoc.password !== password) {
        throw new Error("Invalid email or password.");
      }
      const token = `mcf_token_${Date.now()}`;
      const payload = { token, user: { ...foundAssoc, role: 'associate' } };
      localStorage.setItem('mently_auth_token', token);
      localStorage.setItem('mently_user', JSON.stringify(payload.user));
      return payload;
    } else if (foundMentor) {
      if (foundMentor.password && foundMentor.password !== password) {
        throw new Error("Invalid email or password.");
      }
      const token = `mcf_token_${Date.now()}`;
      const payload = { token, user: { ...foundMentor, role: 'mentor' } };
      localStorage.setItem('mently_auth_token', token);
      localStorage.setItem('mently_user', JSON.stringify(payload.user));
      return payload;
    } else if (isAdmin) {
      const adminUser = {
        id: "ADM-001",
        role: "admin",
        name: "Program Administrator",
        email: cleanEmail,
        institution: "Mastercard Foundation HQ",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
      };
      const token = `mcf_token_${Date.now()}`;
      const payload = { token, user: adminUser };
      localStorage.setItem('mently_auth_token', token);
      localStorage.setItem('mently_user', JSON.stringify(adminUser));
      return payload;
    }

    throw new Error("Account not found. Please verify your email and password or register a new profile.");
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
            status: u.status || 'Active',
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
            schedule: u.schedule || [],
            canEditProfile: u.can_edit_profile || u.canEditProfile || false
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
    let mentorsList = [];

    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'mentor');
        if (data && data.length > 0 && !error) {
          const LEGACY_DUMMY_IDS = new Set(['MEN-101', 'MEN-102', 'MEN-103', 'MEN-104']);
          const LEGACY_DUMMY_NAMES = new Set(['Dr. Samuel Osei', 'Nia Temilade', 'Prof. Kenneth Kiprono', 'Fatima El-Mansouri']);

          mentorsList = data
            .filter(u => !LEGACY_DUMMY_IDS.has(u.id) && !LEGACY_DUMMY_NAMES.has(u.name))
            .map(u => ({
              id: u.id,
              role: 'mentor',
              name: u.name || '',
              email: u.email || '',
              password: u.password || '',
              gender: u.gender || '',
              status: u.status || 'Active',
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
              schedule: u.schedule || [],
              canEditProfile: u.can_edit_profile || u.canEditProfile || false
            }));
        }
      } catch (err) {
        console.warn('[Supabase Mentors Fetch]', err.message);
      }
    }

    if (mentorsList.length === 0) {
      mentorsList = getStoredMentors();
    }

    // Deduplicate mentors strictly by email and normalized name to eliminate any duplicate entries
    const seenKeys = new Set();
    const uniqueMentors = [];

    for (const m of mentorsList) {
      const key = (m.email ? m.email.toLowerCase().trim() : '') || (m.name ? m.name.toLowerCase().trim() : m.id);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueMentors.push(m);
      }
    }

    return uniqueMentors;
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
    let supaSessions = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sessions').select('*');
        if (data && data.length > 0 && !error) {
          supaSessions = data.map(s => ({
            id: s.id,
            associateId: s.associateId || s.associate_id || '',
            associateName: s.associateName || s.associate_name || 'Associate',
            associateTitle: s.associateTitle || s.associate_title || 'Mastercard Foundation Associate',
            associateOrg: s.associateOrg || s.associate_org || 'Jobberman Nigeria',
            mentorId: s.mentorId || s.mentor_id || '',
            mentorName: s.mentorName || s.mentor_name || 'Mentor',
            mentorDomain: s.mentorDomain || s.mentor_domain || '',
            date: s.date,
            time: s.time,
            duration: s.duration || '1 Hour',
            objective: s.objective || '',
            status: s.status || 'Pending',
            meetingLink: s.meetingLink || s.meeting_link || s.meetingUrl || '',
            createdAt: s.created_at || s.createdAt || '',
            associateRating: s.associate_rating || s.associateRating || null,
            mentorRating: s.mentor_rating || s.mentorRating || null,
            completedAt: s.completed_at || s.completedAt || null
          }));
        }
      } catch (err) {
        console.warn('[Supabase Sessions Fetch]', err.message);
      }
    }

    const localSessions = getStoredSessions();
    if (supaSessions.length === 0) return localSessions;

    // Merge Supabase sessions with local sessions so freshly booked sessions are never lost
    const seenIds = new Set(supaSessions.map(s => s.id));
    for (const ls of localSessions) {
      if (!seenIds.has(ls.id)) {
        supaSessions.unshift(ls);
        seenIds.add(ls.id);
      }
    }
    saveStoredSessions(supaSessions);
    return supaSessions;
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
    const targetDate = bookingData.date || '';
    const targetMonth = targetDate.substring(0, 7); // e.g. "2026-08"

    // 🛑 GLOBAL MONTHLY CAP ENFORCEMENT (100 Sessions per calendar month)
    const sessionsInMonth = sessions.filter(s => {
      const sMonth = (s.date || '').substring(0, 7);
      return sMonth === targetMonth && s.status !== 'Cancelled';
    });

    const GLOBAL_MONTHLY_CAP = 100;
    if (sessionsInMonth.length >= GLOBAL_MONTHLY_CAP) {
      // Record spill-over / unmet demand
      await this.logSpillover({
        associateId: bookingData.associateId,
        associateName: bookingData.associateName,
        associateEmail: bookingData.associateEmail || '',
        mentorId: bookingData.mentorId,
        mentorName: bookingData.mentorName,
        targetMonth: targetMonth,
        targetDate: bookingData.date,
        targetTime: bookingData.time,
        reason: `Monthly platform cap of ${GLOBAL_MONTHLY_CAP} sessions reached for ${targetMonth}`
      });

      const monthLabel = targetDate ? new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'this month';
      throw new Error(`Monthly Capacity Reached: The monthly cap of ${GLOBAL_MONTHLY_CAP} sponsored mentorship sessions has been reached for ${monthLabel}. All funded slots for this month are taken. Please select a time slot in the following month.`);
    }

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

    // Generate in-app notifications for Mentor & Associate
    const notifs = getStoredNotifications();
    notifs.unshift({
      id: `NOTIF-${Date.now()}-M`,
      userId: newSession.mentorId,
      recipientName: newSession.mentorName,
      title: "New 1-on-1 Session Booked!",
      message: `${newSession.associateName} (${newSession.associateTitle || 'Associate'}) booked a session for ${newSession.date} at ${newSession.time}.`,
      timestamp: "Just now",
      type: "booking",
      read: false
    });
    notifs.unshift({
      id: `NOTIF-${Date.now()}-A`,
      userId: newSession.associateId,
      recipientName: newSession.associateName,
      title: "Session Request Sent",
      message: `Your mentorship request with ${newSession.mentorName} for ${newSession.date} at ${newSession.time} was submitted.`,
      timestamp: "Just now",
      type: "booking",
      read: false
    });
    saveStoredNotifications(notifs);

    // 📧 Trigger Live Resend Email Notification to Mentor
    const targetMentorEmail = mentor?.email || mentor?.googleEmail || 'osanyindoro@gmail.com';
    emailService.sendSessionBookedToMentor({
      mentorEmail: targetMentorEmail,
      mentorName: newSession.mentorName,
      associateName: newSession.associateName,
      associateTitle: newSession.associateTitle || 'Associate',
      associateOrg: newSession.associateOrg || 'Jobberman Partner Network',
      date: newSession.date,
      time: newSession.time,
      objective: newSession.objective || '1-on-1 Career Mentorship'
    }).catch(err => console.warn('[Email Dispatch Warning]', err));

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

    // Generate in-app acceptance notification for Associate
    if (session) {
      const notifs = getStoredNotifications();
      notifs.unshift({
        id: `NOTIF-${Date.now()}-ACC`,
        userId: session.associateId,
        recipientName: session.associateName,
        title: "Session Accepted! 🎉",
        message: `${session.mentorName} accepted your 1-on-1 session for ${session.date} at ${session.time}. Google Meet link generated.`,
        timestamp: "Just now",
        type: "acceptance",
        read: false
      });
      saveStoredNotifications(notifs);

      // 📧 Trigger Live Resend Email Notification to Associate
      const associates = getStoredAssociates();
      const targetAssoc = associates.find(a => String(a.id) === String(session.associateId) || a.name === session.associateName);
      const targetAssocEmail = targetAssoc?.email || 'osanyindoro@gmail.com';

      emailService.sendSessionAcceptedToAssociate({
        associateEmail: targetAssocEmail,
        associateName: session.associateName,
        mentorName: session.mentorName,
        date: session.date,
        time: session.time,
        meetingLink: googleMeetLink
      }).catch(err => console.warn('[Email Dispatch Warning]', err));
    }

    return session;
  },

  async toggleSessionCompletion(sessionId, isCompleted) {
    const sessions = getStoredSessions();
    const session = sessions.find(s => s.id === sessionId);
    const newStatus = isCompleted ? 'Completed' : 'Accepted';
    const completedAt = isCompleted ? new Date().toISOString() : null;

    if (session) {
      session.status = newStatus;
      session.completedAt = completedAt;
      saveStoredSessions(sessions);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('sessions')
          .update({ 
            status: newStatus,
            completed_at: completedAt
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('[Supabase Toggle Session Completion]', err.message);
      }
    }

    // When marked as conducted, instantly notify the Associate to fill their post-session evaluation form
    if (isCompleted && session) {
      const notifs = getStoredNotifications();
      notifs.unshift({
        id: `NOTIF-${Date.now()}-EVAL-NUDGE`,
        userId: session.associateId,
        recipientName: session.associateName,
        title: "Session Completed! Please Rate Your Mentor ⭐",
        message: `${session.mentorName} marked your 1-on-1 session on ${session.date} as completed. Please fill out your short evaluation and star rating.`,
        timestamp: "Just now",
        type: "evaluation_nudge",
        sessionId: session.id,
        read: false
      });
      saveStoredNotifications(notifs);

      // 📧 Trigger Live Resend Email Evaluation Request to Associate
      const associates = getStoredAssociates();
      const targetAssoc = associates.find(a => String(a.id) === String(session.associateId) || a.name === session.associateName);
      const targetAssocEmail = targetAssoc?.email || 'osanyindoro@gmail.com';

      emailService.sendEvaluationRequestToAssociate({
        associateEmail: targetAssocEmail,
        associateName: session.associateName,
        mentorName: session.mentorName,
        sessionId: session.id
      }).catch(err => console.warn('[Email Dispatch Warning]', err));
    }

    return session;
  },

  /**
   * ⏰ 2x Monthly Automated Booking Inactivity Reminder Engine
   * Checks all associates and dispatches email & in-app alerts if they haven't booked a session this month
   */
  async checkAndDispatchMonthlyReminders() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[currentMonth];

    // Check if reminder already ran in this 15-day cycle (1st-15th = cycle 1, 16th-end = cycle 2)
    const cycleKey = `mcf_reminder_cycle_${currentYear}_${currentMonth}_${now.getDate() <= 15 ? 'mid1' : 'mid2'}`;
    const lastRan = localStorage.getItem(cycleKey);
    if (lastRan) {
      return { skipped: true, reason: 'Already checked for this 15-day cycle' };
    }

    const associates = await this.getAssociates();
    const sessions = await this.fetchSessions();

    const dispatched = [];

    for (const assoc of associates) {
      // Check if associate has booked any session this month
      const hasBookedThisMonth = sessions.some(s => {
        const isMySession = String(s.associateId) === String(assoc.id) || (s.associateName && s.associateName.toLowerCase() === assoc.name.toLowerCase());
        if (!isMySession) return false;
        const sessionDate = new Date(s.date);
        return sessionDate.getFullYear() === currentYear && sessionDate.getMonth() === currentMonth;
      });

      if (!hasBookedThisMonth && assoc.email) {
        // Dispatch In-App Notification
        const notifs = getStoredNotifications();
        notifs.unshift({
          id: `NOTIF-${Date.now()}-REMINDER-${assoc.id}`,
          userId: assoc.id,
          recipientName: assoc.name,
          title: `Book Your ${currentMonthName} Mentorship Session! 🚀`,
          message: `You haven't scheduled your 1-on-1 mentorship session for ${currentMonthName} yet. Connect with verified mentors today!`,
          timestamp: "Just now",
          type: "monthly_reminder",
          read: false
        });
        saveStoredNotifications(notifs);

        // Dispatch Resend Email
        emailService.sendMonthlyBookingReminder({
          associateEmail: assoc.email,
          associateName: assoc.name,
          monthName: currentMonthName
        }).catch(() => {});

        dispatched.push(assoc.name);
      }
    }

    localStorage.setItem(cycleKey, new Date().toISOString());
    console.log(`[Monthly Reminder Engine] Dispatched 2x monthly reminder to ${dispatched.length} inactive associates.`);
    return { success: true, count: dispatched.length, associates: dispatched };
  },

  async submitEvaluation(sessionId, evalPayload, role) {
    // evalPayload: { stars: number, qualitativeFeedback: string, engagement: number, objectiveAlignment: number }
    const sessions = getStoredSessions();
    const session = sessions.find(s => s.id === sessionId);
    const timestamp = new Date().toISOString();

    const formattedEval = {
      ...evalPayload,
      recordedAt: timestamp
    };

    if (session) {
      if (role === 'mentor') {
        session.mentorRating = formattedEval;
      } else {
        session.associateRating = formattedEval;
      }
      session.status = 'Completed';
      saveStoredSessions(sessions);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const updateData = { status: 'Completed' };
        if (role === 'mentor') {
          updateData.mentor_rating = formattedEval;
        } else {
          updateData.associate_rating = formattedEval;
        }
        await supabase.from('sessions').update(updateData).eq('id', sessionId);

        // Recalculate average rating for the evaluated target
        if (role === 'associate' && session && session.mentorId) {
          // Associate rated the mentor -> update mentor's average rating in 'users'
          const { data: mentorSessions } = await supabase.from('sessions').select('associate_rating').eq('mentor_id', session.mentorId);
          if (mentorSessions && mentorSessions.length > 0) {
            const ratings = mentorSessions.map(s => s.associate_rating?.stars).filter(Boolean);
            if (ratings.length > 0) {
              const avg = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
              await supabase.from('users').update({ rating: avg, total_sessions: ratings.length }).eq('id', session.mentorId);
            }
          }
        } else if (role === 'mentor' && session && session.associateId) {
          // Mentor rated the associate -> update associate's rating in 'users'
          const { data: assocSessions } = await supabase.from('sessions').select('mentor_rating').eq('associate_id', session.associateId);
          if (assocSessions && assocSessions.length > 0) {
            const ratings = assocSessions.map(s => s.mentor_rating?.stars).filter(Boolean);
            if (ratings.length > 0) {
              const avg = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
              await supabase.from('users').update({ rating: avg }).eq('id', session.associateId);
            }
          }
        }
      } catch (err) {
        console.warn('[Supabase Submit Evaluation]', err.message);
      }
    }

    // Trigger in-app notification
    if (session) {
      const notifs = getStoredNotifications();
      const recipientId = role === 'mentor' ? session.associateId : session.mentorId;
      const rName = role === 'mentor' ? session.associateName : session.mentorName;
      const reviewer = role === 'mentor' ? session.mentorName : session.associateName;

      notifs.unshift({
        id: `NOTIF-${Date.now()}-REV`,
        userId: recipientId,
        recipientName: rName,
        title: "Session Feedback Received! ⭐",
        message: `${reviewer} submitted their evaluation for your 1-on-1 session (${evalPayload.stars} Stars).`,
        timestamp: "Just now",
        type: "feedback",
        read: false
      });
      saveStoredNotifications(notifs);
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

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('tasks').update({ status }).eq('id', taskId);
      } catch (err) {
        console.warn('[Supabase Update Task Status]', err.message);
      }
    }
    return task;
  },

  async createTask(taskData) {
    const tasks = getStoredTasks();
    const newTask = {
      id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
      mentorId: taskData.mentorId,
      mentorName: taskData.mentorName,
      associateId: taskData.associateId,
      associateName: taskData.associateName,
      title: taskData.title,
      description: taskData.description,
      deadline: taskData.deadline,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    tasks.unshift(newTask);
    saveStoredTasks(tasks);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('tasks').insert([newTask]);
      } catch (err) {
        console.warn('[Supabase Create Task]', err.message);
      }
    }
    return newTask;
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
  },

  // --------------------------------------------------------------------------
  // PROFILE EDIT REQUESTS (Admin Controlled Workflow)
  // --------------------------------------------------------------------------
  async requestProfileEdit({ userId, userName, userEmail, userRole, requestedFields, reason }) {
    const requests = getStoredProfileEditRequests();
    const newRequest = {
      id: `REQ-EDIT-${Date.now()}`,
      userId: userId || '',
      userName: userName || 'Member',
      userEmail: userEmail || '',
      userRole: userRole || 'associate',
      requestedFields: Array.isArray(requestedFields) ? requestedFields : [requestedFields],
      reason: reason || '',
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };
    requests.unshift(newRequest);
    saveStoredProfileEditRequests(requests);

    // In-app notification for Admin
    const notifs = getStoredNotifications();
    notifs.unshift({
      id: `NOTIF-${Date.now()}-EDIT-REQ`,
      userId: "ADM-001",
      recipientName: "Program Administrator",
      title: "New Profile Edit Request 📝",
      message: `${newRequest.userName} (${newRequest.userRole}) requested to edit: ${newRequest.requestedFields.join(', ')}.`,
      timestamp: "Just now",
      type: "profile_edit_request",
      read: false
    });
    saveStoredNotifications(notifs);

    // 📧 Trigger Live Resend Email Notification to Admin
    emailService.sendProfileEditRequestToAdmin({
      userName: newRequest.userName,
      userRole: newRequest.userRole,
      userEmail: newRequest.userEmail,
      requestedFields: newRequest.requestedFields,
      reason: newRequest.reason
    }).catch(err => console.warn('[Email Dispatch Warning]', err));

    return newRequest;
  },

  async getProfileEditRequests() {
    return getStoredProfileEditRequests();
  },

  async approveProfileEdit(requestId, userId) {
    const requests = getStoredProfileEditRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.status = 'Approved';
      req.approvedAt = new Date().toISOString();
      saveStoredProfileEditRequests(requests);
    }

    const targetUserId = userId || (req ? req.userId : null);

    // Unlock profile editing for user in Supabase
    const supabase = getSupabaseClient();
    if (supabase && targetUserId) {
      try {
        await supabase.from('users').update({ can_edit_profile: true }).eq('id', targetUserId);
      } catch (err) {
        console.warn('[Supabase Unlock Edit]', err.message);
      }
    }

    // Unlock locally in associates/mentors
    const associates = getStoredAssociates();
    const assoc = associates.find(a => a.id === targetUserId || (req && a.email === req.userEmail));
    if (assoc) {
      assoc.canEditProfile = true;
      saveStoredAssociates(associates);
    }

    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === targetUserId || (req && m.email === req.userEmail));
    if (mentor) {
      mentor.canEditProfile = true;
      saveStoredMentors(mentors);
    }

    // Update current logged-in user in localStorage if matched
    const currentUserStr = localStorage.getItem('mently_user');
    if (currentUserStr) {
      try {
        const cu = JSON.parse(currentUserStr);
        if (cu.id === targetUserId || (req && cu.email === req.userEmail)) {
          cu.canEditProfile = true;
          localStorage.setItem('mently_user', JSON.stringify(cu));
        }
      } catch (e) {}
    }

    // In-app notification to the member
    if (req) {
      const notifs = getStoredNotifications();
      notifs.unshift({
        id: `NOTIF-${Date.now()}-EDIT-APP`,
        userId: targetUserId,
        recipientName: req.userName,
        title: "Profile Edit Approved! 🔓",
        message: "Your request to edit your profile was approved by the Administrator. You can now update your details.",
        timestamp: "Just now",
        type: "profile_edit_approved",
        read: false
      });
      saveStoredNotifications(notifs);

      // 📧 Send Email to User
      emailService.sendProfileEditApprovedToUser({
        userEmail: req.userEmail,
        userName: req.userName,
        userRole: req.userRole
      }).catch(err => console.warn('[Email Dispatch Warning]', err));
    }

    return req;
  },

  async rejectProfileEdit(requestId, rejectionReason = "Profile information is already up-to-date.") {
    const requests = getStoredProfileEditRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.status = 'Rejected';
      req.rejectedReason = rejectionReason;
      req.rejectedAt = new Date().toISOString();
      saveStoredProfileEditRequests(requests);

      const notifs = getStoredNotifications();
      notifs.unshift({
        id: `NOTIF-${Date.now()}-EDIT-REJ`,
        userId: req.userId,
        recipientName: req.userName,
        title: "Profile Edit Request Update",
        message: `Your request to edit your profile was reviewed: ${rejectionReason}`,
        timestamp: "Just now",
        type: "profile_edit_rejected",
        read: false
      });
      saveStoredNotifications(notifs);
    }
    return req;
  },

  // --------------------------------------------------------------------------
  // SPILL-OVER / UNMET DEMAND ENGINE (Global 100-Session Monthly Cap)
  // --------------------------------------------------------------------------
  async logSpillover(spillData) {
    const spillovers = getStoredSpillovers();
    const newSpillover = {
      id: `SPIL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      associateId: spillData.associateId || '',
      associateName: spillData.associateName || 'Associate',
      associateEmail: spillData.associateEmail || '',
      mentorId: spillData.mentorId || '',
      mentorName: spillData.mentorName || 'Mentor',
      targetMonth: spillData.targetMonth || new Date().toISOString().substring(0, 7),
      targetDate: spillData.targetDate || '',
      targetTime: spillData.targetTime || '',
      reason: spillData.reason || 'Monthly 100-session capacity cap reached',
      timestamp: new Date().toISOString()
    };
    spillovers.unshift(newSpillover);
    saveStoredSpillovers(spillovers);
    return newSpillover;
  },

  async getSpillovers() {
    return getStoredSpillovers();
  },

  // --------------------------------------------------------------------------
  // 3-MONTH MENTOR AVAILABILITY GENERATOR (15 SLOTS TOTAL)
  // --------------------------------------------------------------------------
  async generateThreeMonthSlots(mentorId) {
    const now = new Date();
    const standardTimes = [
      "10:00 AM - 11:00 AM",
      "02:00 PM - 03:00 PM",
      "04:00 PM - 05:00 PM",
      "11:30 AM - 12:30 PM",
      "03:30 PM - 04:30 PM"
    ];

    const targetSlots = [];
    const pad = (n) => String(n).padStart(2, '0');

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const year = now.getFullYear();
      const month = now.getMonth() + monthOffset;
      const targetDateObj = new Date(year, month, 1);
      const targetYear = targetDateObj.getFullYear();
      const targetMonth = targetDateObj.getMonth();

      let day = 6;
      let count = 0;
      while (count < 5 && day <= 28) {
        const date = new Date(targetYear, targetMonth, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const dateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(day)}`;
          targetSlots.push({
            id: Date.now() + Math.floor(Math.random() * 100000) + count + (monthOffset * 10),
            date: dateStr,
            time: standardTimes[count % standardTimes.length],
            isBooked: false,
            bookedBy: null
          });
          count++;
        }
        day += (dayOfWeek === 2 ? 3 : (dayOfWeek === 4 ? 4 : 2));
      }
    }

    const supabase = getSupabaseClient();
    if (supabase && mentorId) {
      try {
        const { data: userRecord } = await supabase.from('users').select('schedule').eq('id', mentorId).single();
        const existing = (userRecord && Array.isArray(userRecord.schedule)) ? userRecord.schedule : [];
        const existingBooked = existing.filter(s => s.isBooked);
        const combined = [...existingBooked, ...targetSlots];
        await supabase.from('users').update({ schedule: combined }).eq('id', mentorId);
      } catch (err) {
        console.warn('[Supabase 3-Month Auto-Fill]', err.message);
      }
    }

    const mentors = getStoredMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      const existingBooked = (mentor.schedule || []).filter(s => s.isBooked);
      mentor.schedule = [...existingBooked, ...targetSlots];
      saveStoredMentors(mentors);
      return mentor.schedule;
    }

    return targetSlots;
  }
};
