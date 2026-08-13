# Jobberman x Mastercard Foundation Associates Mentorship Portal

> **Production-Ready Frontend & Domain Deployment Package**  
> A high-performance, responsive 1-on-1 mentorship scheduling and career development platform built for the Mastercard Foundation Scholars & Alumni Network in partnership with Jobberman.

---

## 📌 Executive Summary

The **Mastercard Foundation Associates Mentorship Portal** connects over **4,000+ Scholars and Alumni** across Sub-Saharan Africa with verified industry mentors, executives, and faculty members for **1-hour strategic mentorship sessions**.

The portal features an **ADPList-inspired ultra-clean global directory UI**, multi-role navigation, verified time slot locking, real headshot photography, dark/light theme switching, and automated Zoho Meet session link generation.

---

## ⚙️ Environment Variables Setup

The frontend reads environment variables at build time via Vite (`import.meta.env`):

| Variable | Description | Default / Example Value |
|---|---|---|
| `VITE_API_BASE_URL` | Live backend REST / GraphQL API URL | `https://api-mentorship.jobberman.com/v1` |
| `VITE_ENABLE_MOCK_DATA` | Toggle between LocalStorage demo mode (`true`) and live backend API (`false`) | `false` (Prod) / `true` (Dev) |
| `VITE_ZOHO_MEET_API_URL` | Integration endpoint for video calls | `https://meeting.zoho.com/api/v1` |
| `VITE_APP_TITLE` | Browser window title | `Jobberman x Mastercard Foundation Mentorship Portal` |

To switch environments:
- **Local Development**: `.env.development` (`VITE_ENABLE_MOCK_DATA=true`)
- **Production Domain**: `.env.production` (`VITE_ENABLE_MOCK_DATA=false`)

---

## 🚀 Deployment to Jobberman Main Domain (`mentorship.jobberman.com`)

### 1. Pre-requisites & Local Build Verification
```bash
# Install dependencies
npm install

# Run production build optimization
npm run build

# Preview build locally
npm run preview
```
The output files will be generated in the **`dist/`** directory (`dist/index.html`, `dist/assets/`).

---

### 2. Multi-Server Deployment Configurations Included

| Hosting Platform | Server Config File | Routing & Fallback Rule |
|---|---|---|
| **Nginx (VPS / Jobberman Server)** | [`nginx.conf`](./nginx.conf) | `try_files $uri $uri/ /index.html;` + SSL + Gzip |
| **Vercel** | [`vercel.json`](./vercel.json) | `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]` |
| **Netlify** | [`netlify.toml`](./netlify.toml) | `/* -> /index.html 200` |
| **Apache Web Server** | [`.htaccess`](./.htaccess) | `RewriteRule . /index.html [L]` |
| **AWS S3 + CloudFront** | [`aws-deploy.sh`](./aws-deploy.sh) | S3 Bucket Sync + CloudFront Invalidation |
| **GitHub Actions CI/CD** | [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) | Automated build & verification on push to `main` |

---

## 🔌 Live Backend API Endpoints Reference

When `VITE_ENABLE_MOCK_DATA=false`, the API service in `src/services/api.js` connects to the following endpoints:

| Action | HTTP Method | Endpoint | Payload / Parameters |
|---|---|---|---|
| Fetch Mentors | `GET` | `/v1/mentors` | — |
| Update Mentor Profile | `PUT` | `/v1/mentors/:id` | `{ name, title, bio, expertise }` |
| Add Mentor Slot | `POST` | `/v1/mentors/:id/slots` | `{ date, time }` |
| Delete Mentor Slot | `DELETE` | `/v1/mentors/:id/slots/:index` | — |
| Fetch Associates | `GET` | `/v1/associates` | — |
| Update Associate Profile | `PUT` | `/v1/associates/:id` | `{ name, email, phone, track, bio, careerGoal, skills }` |
| Fetch Sessions | `GET` | `/v1/sessions` | — |
| Create Session Booking | `POST` | `/v1/sessions/book` | `{ associateId, mentorId, date, time, objective, consentToRecord }` |
| Accept Booking & Link | `POST` | `/v1/sessions/:id/accept` | — |
| Rate Session | `POST` | `/v1/sessions/:id/rate` | `{ role, performance, feedback }` |

---

## 🔒 Security & Data Rules

1. **Locked Identifier Fields**:
   - `Associate ID` and `Organization` are strictly read-only (`disabled readonly`).
   - `Mentor ID` and `Organization` are strictly read-only.
2. **Slot Locking Mechanism**:
   - When an associate completes a booking, the slot `isBooked` flag locks the slot for subsequent users.

---

*Co-branded by Jobberman & Mastercard Foundation Scholars Program.*
