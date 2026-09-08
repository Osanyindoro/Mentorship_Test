// Slide-down Notification Center Drawer Component

export function renderNotificationDrawer(state) {
  const notifications = state.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  return `
    <div class="notification-drawer">
      <div class="notification-header" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-weight: 800; font-size: 0.95rem;">Notifications</span>
          ${unreadCount > 0 ? `<span class="badge-tag badge-blue" style="font-size: 0.72rem; padding: 0.1rem 0.5rem;">${unreadCount} New</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          ${unreadCount > 0 ? `
            <button id="btnMarkAllNotificationsRead" style="background: transparent; color: var(--brand-primary); font-size: 0.78rem; font-weight: 800; border: none; cursor: pointer;" title="Mark all notifications as read">
              <i class="fa-solid fa-check-double"></i> Mark All Read
            </button>
          ` : ''}
          <button id="btnCloseNotifications" style="background: transparent; color: var(--text-muted); border: none; cursor: pointer; font-size: 1.1rem;"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>

      <div class="notification-list-body" style="max-height: 380px; overflow-y: auto;">
        ${notifications.length === 0 ? `
          <div style="padding: 2.5rem 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
            <i class="fa-regular fa-bell-slash" style="font-size: 2rem; margin-bottom: 0.6rem; opacity: 0.6;"></i>
            <div>No notifications yet.</div>
          </div>
        ` : notifications.map((n, idx) => `
          <div class="notification-item ${!n.read ? 'unread' : ''}" data-id="${n.id || idx}" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--border-color); background: ${!n.read ? 'var(--badge-blue-bg)' : 'transparent'}; transition: var(--transition-fast);">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
              <i class="fa-solid ${!n.read ? 'fa-circle-dot' : 'fa-circle-check'}" style="color: ${!n.read ? 'var(--brand-primary)' : 'var(--text-muted)'}; margin-top: 0.25rem; font-size: 0.9rem;"></i>
              <div>
                <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-primary);">${n.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem; line-height: 1.4;">${n.message}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">${n.timestamp || 'Just now'}</div>
              </div>
            </div>
            ${!n.read ? `
              <button class="btn-mark-notif-read" data-idx="${idx}" style="background: transparent; border: none; color: var(--brand-primary); cursor: pointer; font-size: 0.85rem; padding: 0.2rem;" title="Mark as read">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>

      ${notifications.length > 0 ? `
        <div style="padding: 0.75rem 1.1rem; border-top: 1px solid var(--border-color); text-align: center; background: var(--bg-surface);">
          <button id="btnClearAllNotifications" style="background: transparent; border: none; color: var(--brand-rose); font-size: 0.78rem; font-weight: 700; cursor: pointer;">
            <i class="fa-solid fa-trash-can"></i> Clear All Notifications
          </button>
        </div>
      ` : ''}
    </div>
  `;
}
