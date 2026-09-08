// Toast Notification Engine for Mently Platform

export function showToast(message, icon = 'fa-circle-check', duration = 3500) {
  let toastContainer = document.getElementById('mentlyToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'mentlyToastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'mently-toast';
  toast.style.cssText = `
    background: var(--bg-card, #ffffff);
    color: var(--text-primary, #0f172a);
    border: 1px solid var(--border-color, #e2e8f0);
    border-left: 4px solid var(--brand-primary, #2563eb);
    padding: 12px 18px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.88rem;
    font-weight: 700;
    pointer-events: auto;
    animation: toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 380px;
  `;

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="color: var(--brand-primary, #2563eb); font-size: 1.1rem;"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}
