const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'mentorship_portal.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create Users Table (Associates, Mentors, Admins)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      institution_or_org TEXT,
      title TEXT,
      track_or_domain TEXT,
      bio TEXT,
      avatar TEXT
    )
  `);

  // Create Mentors Table
  db.run(`
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
  `);

  // Create Schedule Time Slots Table
  db.run(`
    CREATE TABLE IF NOT EXISTS schedule_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      is_booked INTEGER DEFAULT 0,
      booked_by_associate_id TEXT,
      FOREIGN KEY (mentor_id) REFERENCES mentors(id)
    )
  `);

  // Create Sessions Table
  db.run(`
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      associate_rating_json TEXT,
      mentor_rating_json TEXT
    )
  `);

  // Create Password Resets Table
  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  // Seed Initial Users & Mentors if empty
  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (row && row.count === 0) {
      console.log("[Database] Seeding initial users and mentors...");
      const defaultPasswordHash = bcrypt.hashSync("password123", 10);

      // Seed Associate User
      db.run(`
        INSERT INTO users (id, role, email, password_hash, name, institution_or_org, title, track_or_domain, bio, avatar)
        VALUES ('MCF-2026-089', 'associate', 'amina.kwame@ashesi.edu.gh', ?, 'Amina Kwame', 'Ashesi University / Carnegie Mellon Africa', 'Mastercard Foundation Scholar & Tech Fellow', 'Software Engineering & Data Science', 'Passionate about building scalable AI tools for healthcare in Africa.', '/assets/assoc_amina.jpg')
      `, [defaultPasswordHash]);

      // Seed Mentor User & Mentor Record
      db.run(`
        INSERT INTO users (id, role, email, password_hash, name, institution_or_org, title, track_or_domain, bio, avatar)
        VALUES ('MEN-101', 'mentor', 'samuel.osei@mcf-mentors.org', ?, 'Dr. Samuel Osei', 'DeepMind / CMU Africa Faculty', 'Principal AI Scientist & Former Google Research Lead', 'Software Engineering & AI', '15+ years experience in Artificial Intelligence and NLP.', '/assets/mentor_samuel.jpg')
      `, [defaultPasswordHash]);

      db.run(`
        INSERT INTO mentors (id, name, email, title, organization, domain, bio, avatar, rating, total_sessions, expertise_json)
        VALUES ('MEN-101', 'Dr. Samuel Osei', 'samuel.osei@mcf-mentors.org', 'Principal AI Scientist & Former Google Research Lead', 'DeepMind / CMU Africa Faculty', 'Software Engineering & AI', '15+ years experience in AI, NLP for African languages.', '/assets/mentor_samuel.jpg', 4.9, 42, ?)
      `, [JSON.stringify(["AI / Machine Learning", "PhD Application Advice", "Tech Career Roadmap"])]);

      // Seed Slots
      db.run(`INSERT INTO schedule_slots (mentor_id, date, time, is_booked) VALUES ('MEN-101', '2026-08-18', '10:00 AM', 0)`);
      db.run(`INSERT INTO schedule_slots (mentor_id, date, time, is_booked) VALUES ('MEN-101', '2026-08-18', '02:30 PM', 0)`);
      db.run(`INSERT INTO schedule_slots (mentor_id, date, time, is_booked) VALUES ('MEN-101', '2026-08-20', '11:00 AM', 0)`);
    }
  });
});

module.exports = db;
