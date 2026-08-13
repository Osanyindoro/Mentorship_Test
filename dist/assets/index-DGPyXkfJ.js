(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))t(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const f of n.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&t(f)}).observe(document,{childList:!0,subtree:!0});function o(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function t(i){if(i.ep)return;i.ep=!0;const n=o(i);fetch(i.href,n)}})();const N=[{id:"MCF-2026-089",password:"password123",name:"Amina Kwame",email:"amina.kwame@ashesi.edu.gh",phone:"+233 24 555 0192",title:"Mastercard Foundation Scholar & Tech Fellow",institution:"Ashesi University / Carnegie Mellon Africa",cohort:"2024-2026 Cohort",track:"Software Engineering & Data Science",bio:"Passionate about building scalable AI tools for healthcare in Sub-Saharan Africa. Seeking guidance on career positioning, graduate school applications, and tech leadership.",skills:["Python","Machine Learning","System Design","Community Building"],careerGoal:"Lead AI Research & Development for health tech startups in Africa.",avatar:"/assets/assoc_amina.jpg"},{id:"MCF-2026-042",password:"password123",name:"Kofi Mensah",email:"kofi.mensah@ala.org",phone:"+234 80 312 9041",title:"Mastercard Foundation Associate",institution:"University of Toronto / African Leadership Academy",cohort:"2025-2026 Cohort",track:"Fintech & Financial Inclusion",bio:"Focusing on decentralized finance mechanisms and mobile money interoperability across West African markets.",skills:["Fintech","Financial Modeling","Strategy","Python"],careerGoal:"Founder of cross-border payment solutions for SME merchants.",avatar:"/assets/assoc_kofi.jpg"},{id:"MCF-2026-108",password:"password123",name:"Zainab Hassan",email:"zainab.hassan@uct.ac.za",phone:"+27 61 992 4810",title:"Mastercard Foundation Public Health Scholar",institution:"University of Cape Town",cohort:"2024-2026 Cohort",track:"Public Health & Social Impact",bio:"Epidemiology research associate specializing in maternal health policy and data-driven disease intervention.",skills:["Biostatistics","R","Policy Writing","Grant Management"],careerGoal:"Senior Health Policy Advisor at WHO or African CDC.",avatar:"/assets/assoc_amina.jpg"}],O=[{id:"MEN-101",name:"Dr. Samuel Osei",email:"samuel.osei@mcf-mentors.org",phone:"+234 80 918 2736",title:"Principal AI Scientist & Former Google Research Lead",organization:"DeepMind / CMU Africa Faculty",domain:"Software Engineering & AI",bio:"15+ years experience in Artificial Intelligence, NLP for African languages, and mentoring Mastercard Foundation scholars into global PhD programs and top tech firms.",avatar:"/assets/mentor_samuel.jpg",rating:4.9,totalSessions:42,expertise:["AI / Machine Learning","PhD Application Advice","Tech Career Roadmap","Research Publication"],schedule:[{date:"2026-08-12",time:"10:00 AM",isBooked:!1},{date:"2026-08-12",time:"02:30 PM",isBooked:!0,bookedBy:"Amina Kwame"},{date:"2026-08-14",time:"11:00 AM",isBooked:!1},{date:"2026-08-14",time:"04:00 PM",isBooked:!1},{date:"2026-08-18",time:"09:30 AM",isBooked:!1}]},{id:"MEN-102",name:"Nia Temilade",email:"nia.temilade@mcf-mentors.org",phone:"+234 81 234 5678",title:"VP of Product Management & Venture Partner",organization:"Paystack / Flutterwave Mentor Network",domain:"Fintech & Product",bio:"Product strategist who scaled payments infrastructure across 6 African countries. Specializes in product management mock interviews, resume strategy, and startup pitching.",avatar:"/assets/mentor_nia.jpg",rating:5,totalSessions:38,expertise:["Product Strategy","Fintech Leadership","Interview Prep","Venture Capital"],schedule:[{date:"2026-08-13",time:"09:00 AM",isBooked:!1},{date:"2026-08-15",time:"01:00 PM",isBooked:!0,bookedBy:"Kofi Mensah"},{date:"2026-08-19",time:"04:30 PM",isBooked:!1}]},{id:"MEN-103",name:"Prof. Kenneth Kiprono",email:"kenneth.kiprono@mcf-mentors.org",phone:"+254 71 890 1234",title:"Global Health Policy Director & WHO Consultant",organization:"African CDC Liaison / Oxford Fellow",domain:"Public Health & Social Impact",bio:"Dedicated mentor guiding Mastercard Foundation Associates into public sector advisory, global development fellowships, and impactful community health programs.",avatar:"/assets/mentor_kenneth.jpg",rating:4.85,totalSessions:29,expertise:["Public Health Policy","Grant Writing","Global Development","Leadership"],schedule:[{date:"2026-08-11",time:"11:00 AM",isBooked:!1},{date:"2026-08-16",time:"03:00 PM",isBooked:!1},{date:"2026-08-20",time:"06:00 PM",isBooked:!1}]},{id:"MEN-104",name:"Fatima El-Mansouri",email:"fatima.el@mcf-mentors.org",phone:"+212 66 123 4567",title:"Head of Data Engineering & Cloud Architecture",organization:"Microsoft Africa Development Centre",domain:"Software Engineering & Data",bio:"Cloud solutions expert passionate about building technical capacity across Africa. Mentors on system design, distributed data pipelines, and navigating corporate tech roles.",avatar:"/assets/mentor_fatima.jpg",rating:4.95,totalSessions:51,expertise:["Cloud Architecture","Data Engineering","Technical System Design","Women in Tech"],schedule:[{date:"2026-08-12",time:"08:30 AM",isBooked:!1},{date:"2026-08-17",time:"12:00 PM",isBooked:!1},{date:"2026-08-21",time:"03:30 PM",isBooked:!1}]}],L=[{id:"SES-8801",associateId:"MCF-2026-089",associateName:"Amina Kwame",mentorId:"MEN-101",mentorName:"Dr. Samuel Osei",mentorDomain:"Software Engineering & AI",date:"2026-08-12",time:"02:30 PM",duration:"1 Hour",objective:"Review my PhD statement of purpose for Machine Learning programs and get guidance on structuring my publication draft.",consentToRecord:!0,status:"Accepted",meetingLink:"https://meet.zoho.com/mcf-mentorship-ses-8801",createdAt:"2026-08-02",associateRating:{performance:5,objectiveAlignment:5,feedback:"Dr. Samuel provided invaluable line-by-line feedback on my research statement!"},mentorRating:{engagement:5,preparedness:5,notes:"Amina was thoroughly prepared with clear questions and draft materials."}},{id:"SES-8802",associateId:"MCF-2026-042",associateName:"Kofi Mensah",mentorId:"MEN-102",mentorName:"Nia Temilade",mentorDomain:"Fintech & Product",date:"2026-08-15",time:"01:00 PM",duration:"1 Hour",objective:"Discuss product roadmap validation for cross-border payment platform for SMEs.",consentToRecord:!1,status:"Pending",meetingLink:null,createdAt:"2026-08-03",associateRating:null,mentorRating:null}],T="mcf_portal_sessions_v3",I="mcf_portal_associates_v3",E="mcf_portal_mentors_v3",F="mcf_portal_theme_v3";function k(){const a=localStorage.getItem(T);return a?JSON.parse(a):(localStorage.setItem(T,JSON.stringify(L)),L)}function A(a){localStorage.setItem(T,JSON.stringify(a))}function M(){const a=localStorage.getItem(I);return a?JSON.parse(a):(localStorage.setItem(I,JSON.stringify(N)),N)}function G(a){localStorage.setItem(I,JSON.stringify(a))}function h(){const a=localStorage.getItem(E);return a?JSON.parse(a):(localStorage.setItem(E,JSON.stringify(O)),O)}function S(a){localStorage.setItem(E,JSON.stringify(a))}function q(){return localStorage.getItem(F)||"light"}function K(a){localStorage.setItem(F,a)}const C={VITE_API_BASE_URL:"https://api-mentorship.jobberman.com/v1",VITE_ENABLE_MOCK_DATA:"false"},P=typeof import.meta<"u"&&import.meta&&C?C:{},H=P.VITE_API_BASE_URL||"https://api-mentorship.jobberman.com/v1",g=!(P.VITE_ENABLE_MOCK_DATA==="false"||P.VITE_ENABLE_MOCK_DATA===!1);console.log(`[Jobberman Mentorship API Service] Configured Base URL: ${H} (Mock Mode: ${g})`);async function v(a,s={}){const o=localStorage.getItem("mcf_auth_token"),t={"Content-Type":"application/json",Accept:"application/json",...o?{Authorization:`Bearer ${o}`}:{},...s.headers},i=await fetch(`${H}${a}`,{...s,headers:t});if(!i.ok){const n=await i.text();throw new Error(`API Error [${i.status}]: ${n||i.statusText}`)}return i.json()}const p={async getMentors(){if(g)return h();try{return await v("/mentors")}catch(a){return console.warn("[API Fallback] Falling back to LocalStorage mentors:",a.message),h()}},async updateMentorProfile(a,s){if(g){const o=h(),t=o.findIndex(i=>i.id===a);return t!==-1&&(o[t]={...o[t],...s},S(o)),o[t]}return v(`/mentors/${a}`,{method:"PUT",body:JSON.stringify(s)})},async addMentorSlot(a,s){if(g){const o=h(),t=o.find(i=>i.id===a);return t&&(t.schedule.push({...s,isBooked:!1}),S(o)),t}return v(`/mentors/${a}/slots`,{method:"POST",body:JSON.stringify(s)})},async removeMentorSlot(a,s){if(g){const o=h(),t=o.find(i=>i.id===a);return t&&t.schedule[s]&&(t.schedule.splice(s,1),S(o)),t}return v(`/mentors/${a}/slots/${s}`,{method:"DELETE"})},async getAssociates(){if(g)return M();try{return await v("/associates")}catch(a){return console.warn("[API Fallback] Falling back to LocalStorage associates:",a.message),M()}},async updateAssociateProfile(a,s){if(g){const o=M(),t=o.findIndex(i=>i.id===a);return t!==-1&&(o[t]={...o[t],...s},G(o)),o[t]}return v(`/associates/${a}`,{method:"PUT",body:JSON.stringify(s)})},async getSessions(){if(g)return k();try{return await v("/sessions")}catch(a){return console.warn("[API Fallback] Falling back to LocalStorage sessions:",a.message),k()}},async createBookingSession(a){if(g){const s=k(),o=h(),t={id:`SES-${Math.floor(1e3+Math.random()*9e3)}`,...a,status:"Pending",meetingLink:null,createdAt:new Date().toISOString().split("T")[0],associateRating:null,mentorRating:null},i=o.find(n=>n.id===a.mentorId);if(i){const n=i.schedule.find(f=>f.date===a.date&&f.time===a.time);n&&(n.isBooked=!0,n.bookedBy=a.associateName,S(o))}return s.unshift(t),A(s),t}return v("/sessions/book",{method:"POST",body:JSON.stringify(a)})},async acceptBookingSession(a){if(g){const s=k(),o=s.find(t=>t.id===a);return o&&(o.status="Accepted",o.meetingLink=`https://meet.zoho.com/mcf-mentorship-${o.id.toLowerCase()}`,A(s)),o}return v(`/sessions/${a}/accept`,{method:"POST"})},async submitSessionRating(a,s,o){if(g){const t=k(),i=t.find(n=>n.id===a);return i&&(s==="associate"?i.associateRating=o:i.mentorRating=o,A(t)),i}return v(`/sessions/${a}/rate`,{method:"POST",body:JSON.stringify({role:s,...o})})}},e={theme:q(),currentRole:"associate",currentAssociateIndex:0,currentMentorIndex:0,associateTab:"mentors",mentorTab:"dashboard",isNavDropdownOpen:!1,associates:[],mentors:[],sessions:[],isLoadingData:!0,searchQuery:"",selectedDomains:[],onlyAvailableThisWeek:!1,activeModal:null,bookingMentor:null,bookingData:{date:null,time:null,duration:"1 Hour",objective:"",consentToRecord:!1},inspectingAssociate:null,ratingSession:null,newSlotDate:"2026-08-18",newSlotTime:"10:00 AM"};document.documentElement.setAttribute("data-theme",e.theme);const _=document.getElementById("app");function y(a,s="fa-circle-check"){const o=document.querySelector(".toast-notification");o&&o.remove();const t=document.createElement("div");t.className="toast-notification",t.innerHTML=`
    <i class="fa-solid ${s}" style="color: var(--jobberman-cobalt); font-size: 1.2rem;"></i>
    <div>
      <div style="font-weight: 800; font-size: 0.9rem; margin-bottom: 0.1rem;">Jobberman x MCF Portal</div>
      <div style="font-size: 0.82rem; color: var(--text-secondary);">${a}</div>
    </div>
  `,document.body.appendChild(t),setTimeout(()=>{t.style.opacity="0",t.style.transform="translateY(10px)",setTimeout(()=>t.remove(),300)},4e3)}function W(){e.theme=e.theme==="dark"?"light":"dark",K(e.theme),document.documentElement.setAttribute("data-theme",e.theme),d()}async function V(){try{e.isLoadingData=!0,d();const[a,s,o]=await Promise.all([p.getAssociates(),p.getMentors(),p.getSessions()]);e.associates=a||[],e.mentors=s||[],e.sessions=o||[]}catch(a){console.error("Failed to load application data:",a)}finally{e.isLoadingData=!1,d()}}function U(){const a=e.associates[e.currentAssociateIndex]||{name:"Associate",id:"MCF-000",avatar:"/assets/assoc_amina.jpg"},s=e.mentors[e.currentMentorIndex]||{name:"Mentor",organization:"Partner",avatar:"/assets/mentor_samuel.jpg"},o={mentors:"Explore Mentors",home:"Home Feed",profile:"My Profile",sessions:"My Sessions"},t={mentors:"fa-users-viewfinder",home:"fa-house",profile:"fa-user-gear",sessions:"fa-calendar-check"},i={dashboard:"Dashboard & Requests",profile:"My Profile",availability:"Availability Manager"},n={dashboard:"fa-chart-line",profile:"fa-user-pen",availability:"fa-calendar-plus"};return`
    <header class="header">
      <div class="brand-container">
        <!-- Navigation Dropdown Button -->
        ${e.currentRole==="associate"?`
          <div class="nav-dropdown-wrapper">
            <button class="nav-dropdown-btn" id="btn-toggle-nav-dropdown">
              <i class="fa-solid ${t[e.associateTab]}"></i>
              <span>${o[e.associateTab]}</span>
              <i class="fa-solid fa-chevron-down" style="font-size:0.75rem;"></i>
            </button>

            ${e.isNavDropdownOpen?`
              <div class="nav-dropdown-menu">
                <div class="nav-dropdown-item ${e.associateTab==="mentors"?"active":""}" data-assoc-tab="mentors">
                  <i class="fa-solid fa-users-viewfinder"></i> Explore Mentors
                </div>
                <div class="nav-dropdown-item ${e.associateTab==="home"?"active":""}" data-assoc-tab="home">
                  <i class="fa-solid fa-house"></i> Home Feed
                </div>
                <div class="nav-dropdown-item ${e.associateTab==="profile"?"active":""}" data-assoc-tab="profile">
                  <i class="fa-solid fa-user-gear"></i> My Profile
                </div>
                <div class="nav-dropdown-item ${e.associateTab==="sessions"?"active":""}" data-assoc-tab="sessions">
                  <i class="fa-solid fa-calendar-check"></i> My Sessions
                </div>
              </div>
            `:""}
          </div>
        `:e.currentRole==="mentor"?`
          <div class="nav-dropdown-wrapper">
            <button class="nav-dropdown-btn" id="btn-toggle-nav-dropdown">
              <i class="fa-solid ${n[e.mentorTab]}"></i>
              <span>${i[e.mentorTab]}</span>
              <i class="fa-solid fa-chevron-down" style="font-size:0.75rem;"></i>
            </button>

            ${e.isNavDropdownOpen?`
              <div class="nav-dropdown-menu">
                <div class="nav-dropdown-item ${e.mentorTab==="dashboard"?"active":""}" data-mentor-tab="dashboard">
                  <i class="fa-solid fa-chart-line"></i> Dashboard & Requests
                </div>
                <div class="nav-dropdown-item ${e.mentorTab==="profile"?"active":""}" data-mentor-tab="profile">
                  <i class="fa-solid fa-user-pen"></i> My Profile
                </div>
                <div class="nav-dropdown-item ${e.mentorTab==="availability"?"active":""}" data-mentor-tab="availability">
                  <i class="fa-solid fa-calendar-plus"></i> Availability Manager
                </div>
              </div>
            `:""}
          </div>
        `:""}

        <div>
          <div class="brand-title">Jobberman <span style="color:var(--jobberman-gold);">&bull;</span> Mastercard Foundation</div>
          <div class="brand-subtitle">Associates Mentorship Portal</div>
        </div>
      </div>

      <!-- Header Search Input (ADPList Style) -->
      ${e.currentRole==="associate"&&e.associateTab==="mentors"?`
        <div class="header-search-box">
          <i class="fa-solid fa-magnifying-glass" style="color:var(--text-subtle); font-size:0.85rem;"></i>
          <input type="text" class="header-search-input" id="input-global-search" placeholder="Search mentors by name, company, or skills..." value="${e.searchQuery}">
        </div>
      `:""}

      <div class="header-actions">
        <button class="theme-toggle-btn" id="btn-toggle-theme">
          <i class="fa-solid ${e.theme==="dark"?"fa-sun":"fa-moon"}"></i>
          ${e.theme==="dark"?"Light":"Dark"}
        </button>

        <div class="role-switcher-bar">
          <button class="role-btn ${e.currentRole==="associate"?"active":""}" id="btn-role-associate">
            <i class="fa-solid fa-user-graduate"></i> Associate
          </button>
          <button class="role-btn ${e.currentRole==="mentor"?"active":""}" id="btn-role-mentor">
            <i class="fa-solid fa-chalkboard-user"></i> Mentor / Employer
          </button>
          <button class="role-btn ${e.currentRole==="admin"?"active":""}" id="btn-role-admin">
            <i class="fa-solid fa-chart-pie"></i> Admin
          </button>
        </div>

        <div class="user-profile-badge">
          ${e.currentRole==="associate"?`
            <img src="${a.avatar}" class="user-profile-avatar" alt="Avatar">
            <div class="user-profile-info">
              <span class="user-profile-name">${a.name}</span>
              <span class="user-profile-id">${a.id}</span>
            </div>
          `:e.currentRole==="mentor"?`
            <img src="${s.avatar}" class="user-profile-avatar" alt="Avatar">
            <div class="user-profile-info">
              <span class="user-profile-name">${s.name}</span>
              <span class="user-profile-id">${s.organization}</span>
            </div>
          `:`
            <div class="user-profile-avatar" style="background: var(--jobberman-gold); display:flex; align-items:center; justify-content:center; color:#0A1128; font-weight:bold;">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div class="user-profile-info">
              <span class="user-profile-name">Program Admin</span>
              <span class="user-profile-id">Mastercard Foundation HQ</span>
            </div>
          `}
        </div>
      </div>
    </header>
  `}function Q(){const a=e.associates[e.currentAssociateIndex]||{id:"MCF-000",name:"Associate",institution:"",track:"",bio:"",careerGoal:"",skills:[]},s=e.sessions.filter(t=>t.associateId===a.id);let o=e.mentors.filter(t=>{if(e.searchQuery){const i=e.searchQuery.toLowerCase(),n=t.name.toLowerCase().includes(i),f=t.organization.toLowerCase().includes(i),w=t.domain.toLowerCase().includes(i),x=t.expertise.some($=>$.toLowerCase().includes(i));if(!n&&!f&&!w&&!x)return!1}return!(e.selectedDomains.length>0&&!e.selectedDomains.some(n=>t.domain.toLowerCase().includes(n.toLowerCase()))||e.onlyAvailableThisWeek&&!(t.schedule&&t.schedule.some(n=>!n.isBooked)))});if(e.associateTab==="mentors"){const t=["Software Engineering & AI","Fintech & Product","Public Health & Social Impact","Software Engineering & Data"];return`
      <div class="adplist-layout">
        <aside class="filter-sidebar">
          <div class="sidebar-title">
            <span><i class="fa-solid fa-sliders"></i> Filters</span>
            ${e.selectedDomains.length>0||e.searchQuery||e.onlyAvailableThisWeek?`
              <button id="btn-clear-filters" style="border:none; background:none; color:var(--jobberman-cobalt); font-weight:700; font-size:0.75rem; cursor:pointer;">
                Clear All
              </button>
            `:""}
          </div>

          <div class="filter-group">
            <div class="filter-label">Domain Expertise</div>
            ${t.map(i=>{const n=e.selectedDomains.includes(i);return`
                <label class="filter-checkbox-label">
                  <input type="checkbox" value="${i}" class="filter-domain-checkbox" ${n?"checked":""}>
                  <span>${i}</span>
                </label>
              `}).join("")}
          </div>

          <div class="filter-group">
            <div class="filter-label">Availability</div>
            <label class="filter-checkbox-label">
              <input type="checkbox" id="checkbox-available-week" ${e.onlyAvailableThisWeek?"checked":""}>
              <span>Available This Week 🟢</span>
            </label>
          </div>
        </aside>

        <main class="adplist-main">
          <div class="adplist-banner">
            <div class="adplist-banner-tag">
              <i class="fa-solid fa-graduation-cap"></i> Mastercard Foundation Scholars Network
            </div>
            <h1 class="adplist-banner-title">Find your ideal mentor</h1>
            <p class="adplist-banner-desc">
              Book 1-on-1 strategic sessions with executive leaders, alumni, and tech pioneers across Sub-Saharan Africa.
            </p>
          </div>

          <div class="section-header">
            <div style="font-size: 1rem; font-weight: 800; color: var(--text-primary);">
              Showing ${o.length} Verified Mentors
            </div>
          </div>

          <div class="adplist-cards-grid">
            ${o.map(i=>{const n=i.schedule&&i.schedule.some(f=>!f.isBooked);return`
                <div class="adplist-mentor-card">
                  <div class="adplist-card-header">
                    <img src="${i.avatar}" class="adplist-avatar" alt="${i.name}">
                    <div>
                      <div class="adplist-mentor-name">${i.name}</div>
                      <div class="adplist-mentor-title">${i.title}</div>
                      <div class="adplist-mentor-org">${i.organization}</div>
                    </div>
                  </div>

                  <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1.2rem;">
                    <span class="badge-pill badge-gold"><i class="fa-solid fa-star"></i> ${i.rating} (${i.totalSessions} sessions)</span>
                    <span class="badge-pill ${n?"badge-green":"badge-blue"}">
                      ${n?"🟢 Available":"⌛ Next Week"}
                    </span>
                  </div>

                  <div class="adplist-card-footer">
                    <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:700;">1-Hour Session</span>
                    <button class="btn-adplist-primary btn-inspect-mentor" data-mentor-id="${i.id}">
                      View Profile & Book <i class="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              `}).join("")}
          </div>
        </main>
      </div>
    `}if(e.associateTab==="home")return`
      <div style="max-width:1100px; margin:0 auto; padding:2rem 1.5rem;">
        <div class="adplist-banner">
          <div class="adplist-banner-tag">
            <i class="fa-solid fa-briefcase"></i> Jobberman &bull; Mastercard Foundation
          </div>
          <h1 class="adplist-banner-title">Welcome back, ${a.name}</h1>
          <p class="adplist-banner-desc">
            Accelerate your career trajectory. Connect 1-on-1 with industry leaders, book 1-hour strategic mentorship sessions, and track your growth within the ecosystem.
          </p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
          <div class="adplist-mentor-card" style="border-left: 4px solid var(--jobberman-gold);">
            <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700;">Program Track</div>
            <div style="font-size: 1.2rem; font-weight: 800; margin-top: 0.3rem;">${a.track}</div>
          </div>
          <div class="adplist-mentor-card" style="border-left: 4px solid var(--jobberman-cobalt);">
            <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700;">Organization</div>
            <div style="font-size: 1.2rem; font-weight: 800; margin-top: 0.3rem;">${a.institution}</div>
          </div>
          <div class="adplist-mentor-card" style="border-left: 4px solid var(--badge-green-text);">
            <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700;">Booked Sessions</div>
            <div style="font-size: 1.2rem; font-weight: 800; margin-top: 0.3rem;">${s.length} Total Sessions</div>
          </div>
        </div>

        <div class="section-header">
          <h2 class="section-title"><i class="fa-solid fa-bolt"></i> Featured Mentors</h2>
          <button class="btn-adplist-primary" onclick="state.associateTab='mentors'; render();">
            Explore All Mentors <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div class="adplist-cards-grid">
          ${e.mentors.slice(0,3).map(t=>`
            <div class="adplist-mentor-card">
              <div class="adplist-card-header">
                <img src="${t.avatar}" class="adplist-avatar" alt="${t.name}">
                <div>
                  <div class="adplist-mentor-name">${t.name}</div>
                  <div class="adplist-mentor-title">${t.title}</div>
                  <div class="adplist-mentor-org">${t.organization}</div>
                </div>
              </div>
              <div class="adplist-card-footer">
                <span class="badge-pill badge-gold"><i class="fa-solid fa-star"></i> ${t.rating}</span>
                <button class="btn-adplist-primary btn-goto-mentors-page">
                  View Profile & Book <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;if(e.associateTab==="profile")return`
      <div style="max-width:900px; margin:0 auto; padding:2rem 1.5rem;">
        <div class="section-header">
          <h2 class="section-title"><i class="fa-solid fa-user-gear"></i> Associate Profile Management</h2>
          <div style="color: var(--text-secondary); font-size: 0.85rem;">
            <i class="fa-solid fa-lock" style="color:var(--danger);"></i> ID & Organization locked by HQ
          </div>
        </div>

        <div class="adplist-mentor-card" style="padding:2rem;">
          <form id="form-edit-associate-profile">
            <div class="adplist-card-header" style="margin-bottom:1.5rem; border-bottom:1px solid var(--border-light); padding-bottom:1.5rem;">
              <img src="${a.avatar}" class="associate-avatar-lg" alt="Avatar">
              <div>
                <div style="font-size: 1.5rem; font-weight: 800;">${a.name}</div>
                <div style="color: var(--jobberman-cobalt); font-weight: 700;">${a.title||"Mastercard Foundation Associate"}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
              <div class="form-group">
                <label class="form-label">Associate ID <span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span></label>
                <input type="text" class="form-input locked-input" value="${a.id}" disabled readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Organization <span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span></label>
                <input type="text" class="form-input locked-input" value="${a.institution}" disabled readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="edit-assoc-name" value="${a.name}">
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" id="edit-assoc-email" value="${a.email}">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" class="form-input" id="edit-assoc-phone" value="${a.phone}">
              </div>
              <div class="form-group">
                <label class="form-label">Program Track</label>
                <input type="text" class="form-input" id="edit-assoc-track" value="${a.track}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Biography & Background</label>
              <textarea class="form-textarea" id="edit-assoc-bio" rows="3">${a.bio}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Primary Career Objective</label>
              <input type="text" class="form-input" id="edit-assoc-goal" value="${a.careerGoal}">
            </div>

            <div class="form-group">
              <label class="form-label">Core Skills (comma separated)</label>
              <input type="text" class="form-input" id="edit-assoc-skills" value="${(a.skills||[]).join(", ")}">
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="submit" class="btn-adplist-primary">
                <i class="fa-solid fa-floppy-disk"></i> Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;if(e.associateTab==="sessions")return`
      <div style="max-width:1100px; margin:0 auto; padding:2rem 1.5rem;">
        <div class="section-header">
          <h2 class="section-title"><i class="fa-solid fa-calendar-check"></i> My Booked Mentorship Sessions</h2>
        </div>

        ${s.length===0?`
          <div class="adplist-mentor-card" style="text-align:center; padding:3rem;">
            <i class="fa-regular fa-calendar-xmark" style="font-size:2.5rem; color:var(--text-subtle); margin-bottom:1rem;"></i>
            <div style="font-size:1.1rem; font-weight:800;">No sessions booked yet</div>
            <div style="color:var(--text-secondary); font-size:0.88rem; margin-top:0.3rem;">Explore mentors to schedule your first 1-hour session!</div>
            <button class="btn-adplist-primary" onclick="state.associateTab='mentors'; render();" style="margin-top:1.5rem;">
              Browse Mentors
            </button>
          </div>
        `:`
          <div class="adplist-cards-grid">
            ${s.map(t=>`
              <div class="adplist-mentor-card" style="border-left: 4px solid ${t.status==="Accepted"?"var(--badge-green-text)":"var(--jobberman-gold)"}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.75rem;">
                  <span class="badge-pill ${t.status==="Accepted"?"badge-green":"badge-gold"}">
                    <i class="fa-solid ${t.status==="Accepted"?"fa-check":"fa-clock"}"></i> ${t.status}
                  </span>
                  <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight:700;">
                    1 Hour (Flat Rate)
                  </span>
                </div>

                <div style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.2rem;">${t.mentorName}</div>
                <div style="font-size: 0.8rem; color: var(--jobberman-cobalt); font-weight:700; margin-bottom: 0.8rem;">${t.mentorDomain}</div>

                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; background: var(--bg-main); padding:0.75rem; border-radius: var(--radius-sm);">
                  <strong>Date & Time:</strong> ${t.date} at ${t.time}<br>
                  <strong>Objective:</strong> "${t.objective}"<br>
                  <strong>Recording Consent:</strong> ${t.consentToRecord?" Enabled":" Disabled"}
                </div>

                ${t.status==="Accepted"&&t.meetingLink?`
                  <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <a href="${t.meetingLink}" target="_blank" class="btn-adplist-primary" style="justify-content:center; text-decoration:none;">
                      <i class="fa-solid fa-video"></i> Launch Zoho Meet Session
                    </a>
                    ${t.associateRating?`
                      <div style="font-size:0.78rem; color: var(--badge-green-text); text-align:center; font-weight:700;">
                        <i class="fa-solid fa-circle-check"></i> Session Evaluated (Rated ${t.associateRating.performance}/5 Stars)
                      </div>
                    `:`
                      <button class="btn-adplist-primary btn-rate-mentor" data-session-id="${t.id}" style="background:var(--bg-main); color:var(--text-primary); border:1px solid var(--border-light); font-size:0.8rem;">
                        <i class="fa-solid fa-star" style="color:var(--jobberman-gold);"></i> Rate Session Performance
                      </button>
                    `}
                  </div>
                `:`
                  <div style="font-size:0.8rem; color: var(--jobberman-gold-dark); display:flex; align-items:center; gap:0.4rem;">
                    <i class="fa-solid fa-hourglass-half"></i> Awaiting Mentor Confirmation...
                  </div>
                `}
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `}function Y(){const a=e.mentors[e.currentMentorIndex]||{id:"MEN-000",name:"Mentor",title:"",organization:"",bio:"",expertise:[],schedule:[]},s=e.sessions.filter(t=>t.mentorId===a.id&&t.status==="Pending"),o=e.sessions.filter(t=>t.mentorId===a.id&&t.status==="Accepted");if(e.mentorTab==="dashboard")return`
      <div style="max-width:1100px; margin:0 auto; padding:2rem 1.5rem;">
        <div class="adplist-banner">
          <div class="adplist-banner-tag">
            <i class="fa-solid fa-briefcase"></i> Employer & Mentor Portal
          </div>
          <h1 class="adplist-banner-title">Welcome, ${a.name}</h1>
          <p class="adplist-banner-desc">
            Review incoming Associate session requests, inspect candidate objectives, start Zoho Meet calls, and provide post-session feedback.
          </p>
        </div>

        <div style="margin-bottom: 3rem;">
          <div class="section-header">
            <h2 class="section-title"><i class="fa-solid fa-bell" style="color: var(--jobberman-gold);"></i> Pending Requests (${s.length})</h2>
          </div>

          ${s.length===0?`
            <div class="adplist-mentor-card" style="text-align: center; color: var(--text-secondary);">
              <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: var(--badge-green-text); margin-bottom: 0.5rem;"></i>
              <div>No pending requests at the moment. All caught up!</div>
            </div>
          `:`
            <div class="adplist-cards-grid">
              ${s.map(t=>{const i=e.associates.find(n=>n.id===t.associateId)||{name:t.associateName,institution:"Mastercard Foundation Partner"};return`
                  <div class="adplist-mentor-card" style="border-left: 4px solid var(--jobberman-gold);">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 0.75rem;">
                      <span class="badge-pill badge-gold"><i class="fa-solid fa-clock"></i> Pending</span>
                      <span style="font-size:0.8rem; color: var(--text-secondary); font-weight:700;">1 Hour</span>
                    </div>

                    <div style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.2rem;">${t.associateName}</div>
                    <div style="font-size: 0.8rem; color: var(--jobberman-cobalt); font-weight:700; margin-bottom: 0.75rem;">ID: ${t.associateId} &bull; ${i.institution}</div>

                    <div style="background: var(--bg-main); padding: 0.8rem; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 1rem;">
                      <strong>Requested Date:</strong> ${t.date} at ${t.time}<br>
                      <strong>Mentorship Objective:</strong> "${t.objective}"<br>
                      <strong>Recording Requested:</strong> ${t.consentToRecord?" Yes (Consent Granted)":" No"}
                    </div>

                    <div style="display:flex; gap:0.5rem;">
                      <button class="btn-adplist-primary btn-inspect-associate" data-assoc-id="${t.associateId}" style="flex:1; background:var(--bg-main); color:var(--text-primary); border:1px solid var(--border-light); font-size:0.8rem;">
                        View Profile
                      </button>
                      <button class="btn-adplist-primary btn-accept-booking" data-session-id="${t.id}" style="flex:1; font-size:0.8rem;">
                        Accept Booking
                      </button>
                    </div>
                  </div>
                `}).join("")}
            </div>
          `}
        </div>

        <div>
          <div class="section-header">
            <h2 class="section-title"><i class="fa-solid fa-calendar-days" style="color: var(--badge-green-text);"></i> Confirmed Sessions (${o.length})</h2>
          </div>

          <div class="adplist-cards-grid">
            ${o.map(t=>`
              <div class="adplist-mentor-card" style="border-left: 4px solid var(--badge-green-text);">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.75rem;">
                  <span class="badge-pill badge-green"><i class="fa-solid fa-circle-check"></i> Confirmed</span>
                  <span style="font-size:0.8rem; color: var(--text-secondary); font-weight:700;">1 Hour</span>
                </div>

                <div style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.2rem;">${t.associateName}</div>
                <div style="font-size: 0.8rem; color: var(--jobberman-cobalt); font-weight:700; margin-bottom: 0.75rem;">Scheduled: ${t.date} at ${t.time}</div>

                <div style="background: var(--bg-main); padding: 0.8rem; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 1rem;">
                  <strong>Objective:</strong> "${t.objective}"<br>
                  <strong>Recording Status:</strong> ${t.consentToRecord?" Enabled":" Disabled"}
                </div>

                <a href="${t.meetingLink}" target="_blank" class="btn-adplist-primary" style="margin-bottom: 0.6rem; justify-content: center; text-decoration:none;">
                  <i class="fa-solid fa-video"></i> Start Zoho Meet Call
                </a>

                ${t.mentorRating?`
                  <div style="font-size:0.78rem; color: var(--badge-green-text); text-align:center; font-weight:700;">
                    <i class="fa-solid fa-circle-check"></i> Associate Rated (${t.mentorRating.engagement}/5 Stars)
                  </div>
                `:`
                  <button class="btn-adplist-primary btn-rate-associate" data-session-id="${t.id}" style="background:var(--bg-main); color:var(--text-primary); border:1px solid var(--border-light); font-size:0.8rem;">
                    <i class="fa-solid fa-star" style="color:var(--jobberman-gold);"></i> Evaluate Associate
                  </button>
                `}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;if(e.mentorTab==="profile")return`
      <div style="max-width:900px; margin:0 auto; padding:2rem 1.5rem;">
        <div class="section-header">
          <h2 class="section-title"><i class="fa-solid fa-user-pen"></i> Mentor / Employer Profile Management</h2>
          <div style="color: var(--text-secondary); font-size: 0.85rem;">
            <i class="fa-solid fa-lock" style="color:var(--danger);"></i> ID & Organization locked by Verification
          </div>
        </div>

        <div class="adplist-mentor-card" style="padding:2rem;">
          <form id="form-edit-mentor-profile">
            <div class="adplist-card-header" style="margin-bottom:1.5rem; border-bottom:1px solid var(--border-light); padding-bottom:1.5rem;">
              <img src="${a.avatar}" class="associate-avatar-lg" alt="Avatar">
              <div>
                <div style="font-size: 1.5rem; font-weight: 800;">${a.name}</div>
                <div style="color: var(--jobberman-cobalt); font-weight: 700;">${a.title}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
              <div class="form-group">
                <label class="form-label">Mentor ID <span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span></label>
                <input type="text" class="form-input locked-input" value="${a.id}" disabled readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Organization <span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span></label>
                <input type="text" class="form-input locked-input" value="${a.organization}" disabled readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="edit-mentor-name" value="${a.name}">
              </div>
              <div class="form-group">
                <label class="form-label">Designation / Title</label>
                <input type="text" class="form-input" id="edit-mentor-title" value="${a.title}">
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" id="edit-mentor-email" value="${a.email}">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" class="form-input" id="edit-mentor-phone" value="${a.phone||""}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Mentor Biography</label>
              <textarea class="form-textarea" id="edit-mentor-bio" rows="3">${a.bio}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Expertise Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-mentor-expertise" value="${(a.expertise||[]).join(", ")}">
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="submit" class="btn-adplist-primary">
                <i class="fa-solid fa-floppy-disk"></i> Update Profile Details
              </button>
            </div>
          </form>
        </div>
      </div>
    `;if(e.mentorTab==="availability")return`
      <div style="max-width:1000px; margin:0 auto; padding:2rem 1.5rem;">
        <div class="section-header">
          <h2 class="section-title"><i class="fa-solid fa-calendar-plus"></i> Mentor Availability Manager</h2>
          <div style="color: var(--text-secondary); font-size: 0.85rem;">
            Set your open dates & 1-hour time slots for Associate booking
          </div>
        </div>

        <div class="adplist-mentor-card" style="margin-bottom: 2rem; padding:1.5rem;">
          <div style="font-size: 1.05rem; font-weight: 800; margin-bottom: 1rem; color: var(--jobberman-cobalt);">
            <i class="fa-solid fa-plus-circle"></i> Add Open Time Slot
          </div>
          <form id="form-add-availability-slot" style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-end;">
            <div class="form-group" style="flex:1; min-width:200px; margin-bottom:0;">
              <label class="form-label">Available Date</label>
              <input type="date" class="form-input" id="input-slot-date" value="${e.newSlotDate}" required>
            </div>
            <div class="form-group" style="flex:1; min-width:200px; margin-bottom:0;">
              <label class="form-label">1-Hour Time Slot</label>
              <select class="form-input" id="input-slot-time" required>
                <option value="09:00 AM">09:00 AM - 10:00 AM</option>
                <option value="10:30 AM">10:30 AM - 11:30 AM</option>
                <option value="01:00 PM">01:00 PM - 02:00 PM</option>
                <option value="02:30 PM">02:30 PM - 03:30 PM</option>
                <option value="04:00 PM">04:00 PM - 05:00 PM</option>
                <option value="05:30 PM">05:30 PM - 06:30 PM</option>
              </select>
            </div>
            <button type="submit" class="btn-adplist-primary" style="height:44px;">
              <i class="fa-solid fa-plus"></i> Add Slot
            </button>
          </form>
        </div>

        <div class="section-header">
          <h3 style="font-size:1.1rem; font-weight:800;">My Open & Booked Schedules</h3>
        </div>

        <div class="table-container" style="border:1px solid var(--border-light); border-radius:var(--radius-md); overflow:hidden;">
          <table class="custom-table" style="width:100%; border-collapse:collapse; background:var(--bg-card); font-size:0.88rem;">
            <thead>
              <tr style="background:var(--bg-main); text-align:left;">
                <th style="padding:0.9rem; font-weight:800;">Date</th>
                <th style="padding:0.9rem; font-weight:800;">1-Hour Time Slot</th>
                <th style="padding:0.9rem; font-weight:800;">Status</th>
                <th style="padding:0.9rem; font-weight:800;">Booked Associate</th>
                <th style="padding:0.9rem; font-weight:800;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${(a.schedule||[]).map((t,i)=>`
                <tr style="border-top:1px solid var(--border-light);">
                  <td style="padding:0.9rem; font-weight:700;">${t.date}</td>
                  <td style="padding:0.9rem; font-weight:700; color:var(--jobberman-cobalt);">${t.time}</td>
                  <td style="padding:0.9rem;">
                    ${t.isBooked?'<span class="badge-pill badge-gold"><i class="fa-solid fa-lock"></i> Slot Filled</span>':'<span class="badge-pill badge-green"><i class="fa-solid fa-circle-check"></i> Available</span>'}
                  </td>
                  <td style="padding:0.9rem;">${t.bookedBy||'<span style="color:var(--text-subtle);">Open</span>'}</td>
                  <td style="padding:0.9rem;">
                    ${t.isBooked?'<span style="font-size:0.75rem; color:var(--text-subtle);">Locked</span>':`
                      <button class="btn-remove-slot" data-slot-index="${i}" style="border:none; background:none; color:#EF4444; font-weight:700; cursor:pointer;">
                        Remove
                      </button>
                    `}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function Z(){const a=e.sessions.length,s=e.sessions.filter(i=>i.status==="Accepted").length,o=e.sessions.filter(i=>i.status==="Pending").length,t=e.sessions.filter(i=>i.consentToRecord).length;return`
    <div style="max-width:1200px; margin:0 auto; padding:2rem 1.5rem;">
      <div class="adplist-banner">
        <div class="adplist-banner-tag">
          <i class="fa-solid fa-chart-line"></i> Program Administration Backend
        </div>
        <h1 class="adplist-banner-title">Mastercard Foundation Analytics & Logs</h1>
        <p class="adplist-banner-desc">
          Global oversight of mentorship session bookings, recording consent compliance, Zoho Meet links, and mutual evaluation ratings.
        </p>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
        <div class="adplist-mentor-card">
          <div style="font-size:0.8rem; color:var(--text-secondary); font-weight:700;">Total Bookings</div>
          <div style="font-size: 2rem; font-weight: 800; font-family: var(--font-display);">${a}</div>
        </div>
        <div class="adplist-mentor-card">
          <div style="font-size:0.8rem; color:var(--text-secondary); font-weight:700;">Accepted & Confirmed</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--badge-green-text); font-family: var(--font-display);">${s}</div>
        </div>
        <div class="adplist-mentor-card">
          <div style="font-size:0.8rem; color:var(--text-secondary); font-weight:700;">Pending Requests</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--jobberman-gold-dark); font-family: var(--font-display);">${o}</div>
        </div>
        <div class="adplist-mentor-card">
          <div style="font-size:0.8rem; color:var(--text-secondary); font-weight:700;">Recording Consent Rate</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--jobberman-cobalt); font-family: var(--font-display);">
            ${a>0?Math.round(t/a*100):0}%
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title"><i class="fa-solid fa-list-check"></i> Master Session History & Tracking Log</h2>
      </div>

      <div class="table-container" style="border:1px solid var(--border-light); border-radius:var(--radius-md); overflow:hidden;">
        <table class="custom-table" style="width:100%; border-collapse:collapse; background:var(--bg-card); font-size:0.85rem;">
          <thead>
            <tr style="background:var(--bg-main); text-align:left;">
              <th style="padding:0.9rem; font-weight:800;">ID</th>
              <th style="padding:0.9rem; font-weight:800;">Associate</th>
              <th style="padding:0.9rem; font-weight:800;">Mentor</th>
              <th style="padding:0.9rem; font-weight:800;">Date & Time</th>
              <th style="padding:0.9rem; font-weight:800;">Consent</th>
              <th style="padding:0.9rem; font-weight:800;">Status</th>
              <th style="padding:0.9rem; font-weight:800;">Ratings</th>
            </tr>
          </thead>
          <tbody>
            ${e.sessions.map(i=>`
              <tr style="border-top:1px solid var(--border-light);">
                <td style="padding:0.9rem; font-weight:700; color:var(--jobberman-cobalt);">${i.id}</td>
                <td style="padding:0.9rem;">
                  <div style="font-weight:700;">${i.associateName}</div>
                  <div style="font-size:0.75rem; color:var(--text-secondary);">${i.associateId}</div>
                </td>
                <td style="padding:0.9rem;">
                  <div style="font-weight:700;">${i.mentorName}</div>
                  <div style="font-size:0.75rem; color:var(--text-secondary);">${i.mentorDomain}</div>
                </td>
                <td style="padding:0.9rem;">${i.date}<br><span style="font-size:0.75rem; color:var(--text-secondary);">${i.time}</span></td>
                <td style="padding:0.9rem;">${i.consentToRecord?"🟢 Consented":"⚪ Off"}</td>
                <td style="padding:0.9rem;">
                  ${i.status==="Accepted"&&i.meetingLink?`<a href="${i.meetingLink}" target="_blank" class="btn-adplist-primary" style="font-size:0.72rem; padding:0.25rem 0.6rem; text-decoration:none;"><i class="fa-solid fa-video"></i> Zoho Meet</a>`:'<span class="badge-pill badge-gold">Pending</span>'}
                </td>
                <td style="padding:0.9rem;">
                  ${i.associateRating?`⭐ ${i.associateRating.performance}/5`:"Unrated"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function X(){if(!e.activeModal)return"";if(e.activeModal==="booking"&&e.bookingMentor){const a=e.bookingMentor,s=a.schedule||[],o=s.filter(t=>t.date===e.bookingData.date);return`
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Mentor Profile & Booking</div>
            <button class="close-btn" id="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="adplist-card-header" style="margin-bottom:1rem; border-bottom:1px solid var(--border-light); padding-bottom:1rem;">
            <img src="${a.avatar}" class="adplist-avatar" style="width:72px; height:72px;" alt="${a.name}">
            <div>
              <div style="font-size:1.35rem; font-weight:800;">${a.name}</div>
              <div style="color:var(--jobberman-cobalt); font-weight:700; font-size:0.9rem;">${a.title}</div>
              <div style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.2rem;">${a.organization} &bull; ${a.domain}</div>
              <div style="font-size:0.85rem; color:var(--jobberman-gold-dark); margin-top:0.3rem;">
                <i class="fa-solid fa-star"></i> <strong>${a.rating} Rating</strong> (${a.totalSessions} sessions completed)
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Biography & Expertise</label>
            <div style="color:var(--text-secondary); font-size:0.88rem; line-height:1.5; background:var(--bg-main); padding:0.8rem; border-radius:var(--radius-md);">${a.bio}</div>
          </div>

          <div style="border-top:1px solid var(--border-light); padding-top:1.25rem; margin-top:1.25rem;">
            <div style="font-size:1.1rem; font-weight:800; margin-bottom:1rem; color:var(--jobberman-cobalt);">
              <i class="fa-solid fa-calendar-plus"></i> Select Date & Time (1-Hour Flat Rate)
            </div>

            <div class="form-group">
              <label class="form-label">1. Available Dates</label>
              <div class="date-picker-grid">
                ${[...new Set(s.map(t=>t.date))].map(t=>`
                  <div class="selectable-pill ${e.bookingData.date===t?"selected":""}" data-booking-date="${t}">
                    <i class="fa-regular fa-calendar" style="display:block; margin-bottom:0.2rem;"></i> ${t}
                  </div>
                `).join("")}
              </div>
            </div>

            ${e.bookingData.date?`
              <div class="form-group">
                <label class="form-label">2. Select Open Time Slot</label>
                ${o.length===0?`
                  <div style="color:var(--text-secondary); font-size:0.85rem;">No open slots on this date. Please pick another date.</div>
                `:`
                  <div class="time-picker-grid">
                    ${o.map(t=>`
                      <div class="selectable-pill ${t.isBooked?"disabled":e.bookingData.time===t.time?"selected":""}" 
                           ${t.isBooked?"":`data-booking-time="${t.time}"`}>
                        <i class="fa-solid fa-clock" style="display:block; margin-bottom:0.2rem;"></i> ${t.time}
                        ${t.isBooked?'<span style="font-size:0.68rem; color:#EF4444; display:block; font-weight:800;">Slot Filled</span>':""}
                      </div>
                    `).join("")}
                  </div>
                `}
              </div>
            `:""}

            <div class="form-group">
              <label class="form-label">3. What is your mentorship objective?</label>
              <textarea class="form-textarea" id="input-booking-objective" rows="3" placeholder="Briefly describe what you hope to discuss during this 1-hour session...">${e.bookingData.objective}</textarea>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1rem; background:var(--bg-main); border-radius:var(--radius-md); margin-bottom:1.5rem;">
              <div style="font-size:0.88rem; font-weight:700;">Consent to Record Session</div>
              <input type="checkbox" id="toggle-record-consent" ${e.bookingData.consentToRecord?"checked":""} style="width:18px; height:18px; accent-color:var(--jobberman-cobalt);">
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button class="btn-adplist-primary" id="btn-submit-booking" ${!e.bookingData.date||!e.bookingData.time?'disabled style="opacity:0.5; cursor:not-allowed;"':""}>
                <i class="fa-solid fa-paper-plane"></i> Confirm 1-Hour Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    `}if(e.activeModal==="associate_profile"&&e.inspectingAssociate){const a=e.inspectingAssociate;return`
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Associate Profile Details</div>
            <button class="close-btn" id="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="adplist-card-header" style="margin-bottom:1.25rem;">
            <img src="${a.avatar}" class="adplist-avatar" style="width:68px; height:68px;" alt="Avatar">
            <div>
              <div style="font-size:1.3rem; font-weight:800;">${a.name}</div>
              <div style="color:var(--jobberman-cobalt); font-weight:700; font-size:0.9rem;">${a.id} &bull; ${a.institution}</div>
              <div style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.2rem;">${a.cohort}</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Contact Details</label>
            <div style="color:var(--text-primary); font-size:0.9rem;">
              <i class="fa-solid fa-envelope"></i> ${a.email} &bull; <i class="fa-solid fa-phone"></i> ${a.phone}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Bio & Background</label>
            <div style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">${a.bio}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Career Objective</label>
            <div style="color:var(--text-primary); font-size:0.9rem; font-weight:700;">${a.careerGoal}</div>
          </div>
        </div>
      </div>
    `}return""}function d(){if(e.isLoadingData){_.innerHTML=`
      <div style="display:flex; height:100vh; flex-direction:column; align-items:center; justify-content:center; gap:1rem; font-family:var(--font-sans);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:2.5rem; color:var(--jobberman-cobalt);"></i>
        <div style="font-weight:800; font-size:1.1rem; color:var(--text-primary);">Jobberman x Mastercard Foundation Portal</div>
        <div style="font-size:0.88rem; color:var(--text-secondary);">Connecting to API endpoints...</div>
      </div>
    `;return}_.innerHTML=`
    ${U()}
    ${e.currentRole==="associate"?Q():""}
    ${e.currentRole==="mentor"?Y():""}
    ${e.currentRole==="admin"?Z():""}
    ${X()}
  `,ee()}function ee(){const a=document.getElementById("btn-toggle-theme");a&&(a.onclick=W);const s=document.getElementById("btn-role-associate"),o=document.getElementById("btn-role-mentor"),t=document.getElementById("btn-role-admin");s&&(s.onclick=()=>{e.currentRole="associate",d()}),o&&(o.onclick=()=>{e.currentRole="mentor",d()}),t&&(t.onclick=()=>{e.currentRole="admin",d()});const i=document.getElementById("input-global-search");i&&(i.oninput=r=>{e.searchQuery=r.target.value,d();const l=document.getElementById("input-global-search");l&&(l.focus(),l.setSelectionRange(l.value.length,l.value.length))}),document.querySelectorAll(".filter-domain-checkbox").forEach(r=>{r.onchange=l=>{const c=l.target.value;l.target.checked?e.selectedDomains.includes(c)||e.selectedDomains.push(c):e.selectedDomains=e.selectedDomains.filter(m=>m!==c),d()}});const n=document.getElementById("checkbox-available-week");n&&(n.onchange=r=>{e.onlyAvailableThisWeek=r.target.checked,d()});const f=document.getElementById("btn-clear-filters");f&&(f.onclick=()=>{e.selectedDomains=[],e.searchQuery="",e.onlyAvailableThisWeek=!1,d()});const w=document.getElementById("btn-toggle-nav-dropdown");w&&(w.onclick=r=>{r.stopPropagation(),e.isNavDropdownOpen=!e.isNavDropdownOpen,d()}),document.onclick=()=>{e.isNavDropdownOpen&&(e.isNavDropdownOpen=!1,d())},document.querySelectorAll("[data-assoc-tab]").forEach(r=>{r.onclick=l=>{l.stopPropagation(),e.associateTab=l.currentTarget.dataset.assocTab,e.isNavDropdownOpen=!1,d()}}),document.querySelectorAll("[data-mentor-tab]").forEach(r=>{r.onclick=l=>{l.stopPropagation(),e.mentorTab=l.currentTarget.dataset.mentorTab,e.isNavDropdownOpen=!1,d()}}),document.querySelectorAll(".btn-goto-mentors-page").forEach(r=>{r.onclick=()=>{e.associateTab="mentors",d()}});const x=document.getElementById("form-edit-associate-profile");x&&(x.onsubmit=async r=>{r.preventDefault();const l=e.associates[e.currentAssociateIndex],c={name:document.getElementById("edit-assoc-name").value,email:document.getElementById("edit-assoc-email").value,phone:document.getElementById("edit-assoc-phone").value,track:document.getElementById("edit-assoc-track").value,bio:document.getElementById("edit-assoc-bio").value,careerGoal:document.getElementById("edit-assoc-goal").value,skills:document.getElementById("edit-assoc-skills").value.split(",").map(m=>m.trim()).filter(Boolean)};await p.updateAssociateProfile(l.id,c),e.associates=await p.getAssociates(),d(),y("Your Profile has been saved successfully!","fa-floppy-disk")});const $=document.getElementById("form-edit-mentor-profile");$&&($.onsubmit=async r=>{r.preventDefault();const l=e.mentors[e.currentMentorIndex],c={name:document.getElementById("edit-mentor-name").value,title:document.getElementById("edit-mentor-title").value,email:document.getElementById("edit-mentor-email").value,phone:document.getElementById("edit-mentor-phone").value,bio:document.getElementById("edit-mentor-bio").value,expertise:document.getElementById("edit-mentor-expertise").value.split(",").map(m=>m.trim()).filter(Boolean)};await p.updateMentorProfile(l.id,c),e.mentors=await p.getMentors(),d(),y("Mentor Profile updated successfully!","fa-floppy-disk")});const D=document.getElementById("form-add-availability-slot");D&&(D.onsubmit=async r=>{r.preventDefault();const l=e.mentors[e.currentMentorIndex],c=document.getElementById("input-slot-date").value,m=document.getElementById("input-slot-time").value;await p.addMentorSlot(l.id,{date:c,time:m}),e.mentors=await p.getMentors(),d(),y(`New 1-Hour slot added for ${c} at ${m}!`,"fa-plus")}),document.querySelectorAll(".btn-remove-slot").forEach(r=>{r.onclick=async l=>{const c=parseInt(l.currentTarget.dataset.slotIndex),m=e.mentors[e.currentMentorIndex];await p.removeMentorSlot(m.id,c),e.mentors=await p.getMentors(),d(),y("Availability slot removed.","fa-trash")}}),document.querySelectorAll(".btn-book-mentor, .btn-inspect-mentor").forEach(r=>{r.onclick=l=>{const c=l.currentTarget.dataset.mentorId,m=e.mentors.find(u=>u.id===c);if(m){e.bookingMentor=m;const u=m.schedule||[],b=u.find(J=>!J.isBooked)||u[0];e.bookingData={date:b?b.date:null,time:b?b.time:null,duration:"1 Hour",objective:"",consentToRecord:!1},e.activeModal="booking",d()}}});const B=document.getElementById("modal-close-btn");B&&(B.onclick=()=>{e.activeModal=null,d()}),document.querySelectorAll("[data-booking-date]").forEach(r=>{r.onclick=l=>{const c=l.currentTarget.dataset.bookingDate;e.bookingData.date=c;const u=(e.bookingMentor.schedule||[]).filter(b=>b.date===c&&!b.isBooked);e.bookingData.time=u.length>0?u[0].time:null,d()}}),document.querySelectorAll("[data-booking-time]").forEach(r=>{r.onclick=l=>{e.bookingData.time=l.currentTarget.dataset.bookingTime,d()}});const z=document.getElementById("input-booking-objective");z&&(z.oninput=r=>{e.bookingData.objective=r.target.value});const j=document.getElementById("toggle-record-consent");j&&(j.onchange=r=>{e.bookingData.consentToRecord=r.target.checked});const R=document.getElementById("btn-submit-booking");R&&(R.onclick=async()=>{const r=e.associates[e.currentAssociateIndex],l={associateId:r.id,associateName:r.name,mentorId:e.bookingMentor.id,mentorName:e.bookingMentor.name,mentorDomain:e.bookingMentor.domain,date:e.bookingData.date,time:e.bookingData.time,duration:"1 Hour",objective:e.bookingData.objective||"1-Hour Strategic Mentorship Session",consentToRecord:e.bookingData.consentToRecord},c=await p.createBookingSession(l);e.mentors=await p.getMentors(),e.sessions=await p.getSessions(),e.activeModal=null,e.associateTab="sessions",d(),y(`1-Hour Session booked with ${c.mentorName}! Slot locked.`,"fa-calendar-check")}),document.querySelectorAll(".btn-inspect-associate").forEach(r=>{r.onclick=l=>{const c=l.currentTarget.dataset.assocId;e.inspectingAssociate=e.associates.find(m=>m.id===c),e.activeModal="associate_profile",d()}}),document.querySelectorAll(".btn-accept-booking").forEach(r=>{r.onclick=async l=>{const c=l.currentTarget.dataset.sessionId,m=await p.acceptBookingSession(c);e.sessions=await p.getSessions(),d(),y(`Booking accepted! Zoho Meet Link generated: ${m.meetingLink}`,"fa-video")}})}V();
