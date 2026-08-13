import http.server
import socketserver
import json
import sqlite3
import hashlib
import secrets
import time
import os

PORT = 5000
DB_FILE = os.path.join(os.path.dirname(__file__), "mentorship.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            institution TEXT,
            title TEXT,
            track TEXT,
            bio TEXT,
            avatar TEXT
        )
    ''')

    # Mentors Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mentors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            organization TEXT NOT NULL,
            domain TEXT NOT NULL,
            bio TEXT,
            avatar TEXT,
            rating REAL DEFAULT 5.0,
            total_sessions INTEGER DEFAULT 0,
            expertise_json TEXT
        )
    ''')

    # Schedule Slots Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS schedule_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mentor_id TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            is_booked INTEGER DEFAULT 0,
            booked_by_associate_id TEXT
        )
    ''')

    # Sessions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            associate_id TEXT NOT NULL,
            associate_name TEXT NOT NULL,
            mentor_id TEXT NOT NULL,
            mentor_name TEXT NOT NULL,
            mentor_domain TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            duration TEXT DEFAULT '1 Hour',
            objective TEXT,
            consent_to_record INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Pending',
            meeting_link TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Password Resets Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS password_resets (
            token TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            expires_at REAL NOT NULL
        )
    ''')

    # Seed Initial Data if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        pw_hash = hashlib.sha256("password123".encode()).hexdigest()
        
        cursor.execute('''
            INSERT INTO users (id, role, email, password_hash, name, institution, title, track, bio, avatar)
            VALUES ('MCF-2026-089', 'associate', 'amina.kwame@ashesi.edu.gh', ?, 'Amina Kwame', 'Ashesi University / Carnegie Mellon Africa', 'Mastercard Foundation Scholar & Tech Fellow', 'Software Engineering & Data Science', 'Passionate about building scalable AI tools.', '/assets/assoc_amina.jpg')
        ''', (pw_hash,))

        cursor.execute('''
            INSERT INTO users (id, role, email, password_hash, name, institution, title, track, bio, avatar)
            VALUES ('MEN-101', 'mentor', 'samuel.osei@mcf-mentors.org', ?, 'Dr. Samuel Osei', 'DeepMind / CMU Africa Faculty', 'Principal AI Scientist', 'Software Engineering & AI', '15+ years experience in AI.', '/assets/mentor_samuel.jpg')
        ''', (pw_hash,))

        cursor.execute('''
            INSERT INTO mentors (id, name, email, title, organization, domain, bio, avatar, rating, total_sessions, expertise_json)
            VALUES ('MEN-101', 'Dr. Samuel Osei', 'samuel.osei@mcf-mentors.org', 'Principal AI Scientist & Former Google Lead', 'DeepMind / CMU Africa Faculty', 'Software Engineering & AI', '15+ years experience in AI, NLP.', '/assets/mentor_samuel.jpg', 4.9, 42, ?)
        ''', (json.dumps(["AI / Machine Learning", "PhD Advice", "Career Roadmap"]),))

        cursor.execute("INSERT INTO schedule_slots (mentor_id, date, time, is_booked) VALUES ('MEN-101', '2026-08-18', '10:00 AM', 0)")
        cursor.execute("INSERT INTO schedule_slots (mentor_id, date, time, is_booked) VALUES ('MEN-101', '2026-08-18', '02:30 PM', 0)")

    conn.commit()
    conn.close()

init_db()

class RESTRequestHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, data, code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        if self.path.startswith("/v1/health"):
            conn.close()
            return self.send_json({"status": "healthy", "service": "Jobberman x MCF Mentorship Python Backend"})

        elif self.path.startswith("/v1/mentors"):
            cursor.execute("SELECT * FROM mentors")
            mentor_rows = cursor.fetchall()
            cursor.execute("SELECT * FROM schedule_slots")
            slot_rows = cursor.fetchall()
            conn.close()

            mentors = []
            for m in mentor_rows:
                m_slots = [{"id": s[0], "date": s[2], "time": s[3], "isBooked": bool(s[4]), "bookedBy": s[5]} for s in slot_rows if s[1] == m[0]]
                mentors.append({
                    "id": m[0],
                    "name": m[1],
                    "email": m[2],
                    "title": m[3],
                    "organization": m[4],
                    "domain": m[5],
                    "bio": m[6],
                    "avatar": m[7],
                    "rating": m[8],
                    "totalSessions": m[9],
                    "expertise": json.loads(m[10] or "[]"),
                    "schedule": m_slots
                })
            return self.send_json(mentors)

        elif self.path.startswith("/v1/sessions"):
            cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC")
            rows = cursor.fetchall()
            conn.close()

            sessions = [{
                "id": r[0],
                "associateId": r[1],
                "associateName": r[2],
                "mentorId": r[3],
                "mentorName": r[4],
                "mentorDomain": r[5],
                "date": r[6],
                "time": r[7],
                "duration": r[8],
                "objective": r[9],
                "consentToRecord": bool(r[10]),
                "status": r[11],
                "meetingLink": r[12]
            } for r in rows]

            return self.send_json(sessions)

        conn.close()
        self.send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b'{}'
        data = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        if self.path == "/v1/auth/login":
            email = (data.get("email") or "").strip().lower()
            password = data.get("password") or ""
            pw_hash = hashlib.sha256(password.encode()).hexdigest()

            cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
            user = cursor.fetchone()
            conn.close()

            if user and user[3] == pw_hash:
                token = secrets.token_hex(32)
                return self.send_json({
                    "token": token,
                    "user": {
                        "id": user[0],
                        "role": user[1],
                        "email": user[2],
                        "name": user[4],
                        "institution": user[5],
                        "organization": user[5],
                        "title": user[6],
                        "track": user[7],
                        "bio": user[8],
                        "avatar": user[9]
                    }
                })
            else:
                return self.send_json({"error": "Invalid email or password"}, 401)

        elif self.path == "/v1/auth/forgot-password":
            email = (data.get("email") or "").strip().lower()
            token = secrets.token_hex(16)
            expires_at = time.time() + (15 * 60)

            cursor.execute("INSERT OR REPLACE INTO password_resets (token, email, expires_at) VALUES (?, ?, ?)", (token, email, expires_at))
            conn.commit()
            conn.close()

            reset_url = f"https://mentorship-jobberman.vercel.app/reset-password?token={token}"
            print(f"[Python API Auth] Password reset dispatched for {email}: {reset_url}")

            return self.send_json({"message": "Password reset link sent to your email", "resetLinkDemo": reset_url})

        elif self.path == "/v1/sessions":
            assoc_id = data.get("associateId")
            assoc_name = data.get("associateName", "Associate Scholar")
            mentor_id = data.get("mentorId")
            date = data.get("date")
            t_slot = data.get("time")
            objective = data.get("objective", "1-Hour Mentorship Session")
            consent = 1 if data.get("consentToRecord") else 0

            cursor.execute("SELECT name, domain FROM mentors WHERE id = ?", (mentor_id,))
            mentor = cursor.fetchone()

            if not mentor:
                conn.close()
                return self.send_json({"error": "Mentor not found"}, 404)

            session_id = f"SES-{secrets.randbelow(9000) + 1000}"

            cursor.execute('''
                INSERT INTO sessions (id, associate_id, associate_name, mentor_id, mentor_name, mentor_domain, date, time, duration, objective, consent_to_record, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1 Hour', ?, ?, 'Pending')
            ''', (session_id, assoc_id, assoc_name, mentor_id, mentor[0], mentor[1], date, t_slot, objective, consent))

            cursor.execute("UPDATE schedule_slots SET is_booked = 1, booked_by_associate_id = ? WHERE mentor_id = ? AND date = ? AND time = ?", (assoc_id, mentor_id, date, t_slot))

            conn.commit()
            conn.close()

            return self.send_json({"message": "Session booked! Slot locked.", "sessionId": session_id, "status": "Pending"}, 201)

        conn.close()
        self.send_json({"error": "Endpoint not found"}, 404)

print(f"[Python API] Server starting on http://localhost:{PORT}/v1")
with socketserver.TCPServer(("", PORT), RESTRequestHandler) as httpd:
    httpd.serve_forever()
