# Colleague Handover & Deployment Brief
## Jobberman x Mastercard Foundation Associates Mentorship Portal

This document is designed for your colleague who will deploy the frontend on the **Jobberman domain** (e.g. `mentorship.jobberman.com`) and continue development with Antigravity AI.

---

## 📁 1. What to Send to Your Colleague

Send your colleague these **2 files**:

1. **`mentorship-platform-handover.zip`**: The complete zip containing all frontend code, CSS, assets, and server scripts.
2. **`HANDOVER_DOCUMENTATION.md`**: The technical specification and architecture guide.

---

## 🤖 2. Copy-Paste Prompt for Your Colleague's Antigravity AI

Tell your colleague to open Antigravity AI, extract the ZIP file, open the project folder, and paste the exact prompt below into their first prompt:

```text
Hi Antigravity! I am taking over the frontend deployment for the Jobberman x Mastercard Foundation Associates Mentorship Portal.

Here is the context of what has been built so far:
1. Brand & Purpose: A 1-on-1 mentorship scheduling platform for 4,000+ Mastercard Foundation scholars co-branded with Jobberman.
2. Tech Stack: Single Page Application (SPA) built with Vanilla JavaScript, HTML5, and Vanilla CSS with an ADPList-inspired design system.
3. Key Features Built:
   - Mently Design System with custom tokens, dark/light theme switching, and WCAG-compliant responsive UI.
   - Mentee Portal: Search & domain filters, 1-on-1 booking wizard with instant slot locking & Zoho Meet link generation.
   - Group Mentorship Masterclasses: Interactive group sessions with live seat capacity tracking (20 seats max).
   - Task Action Items: Mentor-assigned tasks with mentee completion tracking.
   - Mentor Portal & Google Authentication: Dedicated Google Sign-In, availability manager, and Real-Time Monthly Capacity Meter (e.g. 12 / 15 sessions used).
   - Admin Operations Portal: High-level programme analytics and Configurable Monthly Session Caps per mentor.
   - Notification Center: Header bell with unread badge counter and slide-down notification drawer.

MY CURRENT TASK:
I need to deploy this production-ready frontend onto our main server under the Jobberman domain (e.g., mentorship.jobberman.com or hosting environment like Vercel, Netlify, Nginx, or AWS S3/CloudFront).

Please help me:
1. Configure build scripts or server configuration for domain deployment (e.g., Vercel / Nginx / Apache / GitHub Pages / AWS).
2. Set up environment variables (e.g., VITE_API_BASE_URL) so the backend team can connect live API endpoints seamlessly.
3. Verify production build optimization (`npm run build`).
```

---

## 🌐 3. Domain Deployment Checklist for Your Colleague

When deploying to the Jobberman main domain:

- [ ] **Hosting Setup**: Deploy static files (`index.html`, `src/`, `assets/`) to Vercel, Netlify, AWS S3/CloudFront, or Jobberman's Nginx web server.
- [ ] **SSL / HTTPS**: Ensure SSL certificate (`https://`) is active for `mentorship.jobberman.com`.
- [ ] **CORS & API Base URL**: Define backend API endpoint variable (e.g. `https://api-mentorship.jobberman.com`) so frontend fetch requests connect to your backend database seamlessly.
- [ ] **Custom Domain DNS**: Point CNAME record `mentorship.jobberman.com` to the server IP / host.

---

*Prepared for Jobberman Engineering Handover.*
