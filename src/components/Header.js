// Top Navigation Header Component
import jobbermanLogo from '../assets/jobberman-logo.png';

export function renderHeader(state) {
  const user = state.currentUser;
  const unreadNotifCount = state.notifications ? state.notifications.filter(n => !n.read).length : 0;

  return `
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
        <input type="text" class="header-search-input" placeholder="Search mentors, expertise, fields..." value="${state.searchQuery || ''}" id="headerSearchInput">
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
  `;
}
