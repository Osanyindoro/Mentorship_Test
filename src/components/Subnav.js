// Navigation Subbar Component for Mently Platform

export function renderSubnav(state) {
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
