// db.js — SQLite via sql.js (pure JavaScript, works on Windows without Visual Studio)
const path = require('path');
const fs   = require('fs');

const DB_DIR  = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'tempted.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let db;

async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  // Load existing DB from file or create new
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Save helper — writes DB back to disk after every write
  db._save = function () {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  };

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL,
      emoji       TEXT DEFAULT '🍴',
      description TEXT DEFAULT '',
      price       TEXT DEFAULT '',
      photo_url   TEXT,
      available   INTEGER DEFAULT 1,
      sort_order  INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone         TEXT NOT NULL,
      email         TEXT DEFAULT '',
      item_name     TEXT NOT NULL,
      notes         TEXT DEFAULT '',
      status        TEXT DEFAULT 'new',
      created_at    TEXT DEFAULT (datetime('now'))
    );
  `);
  db._save();

  console.log('✅ Database ready at', DB_FILE);
  return db;
}

// Simple query helpers to match better-sqlite3 API style
function getDB() { return db; }

function run(sql, params = []) {
  db.run(sql, params);
  db._save();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function lastInsertId() {
  const row = get('SELECT last_insert_rowid() as id');
  return row ? row.id : null;
}

module.exports = { initDB, getDB, run, get, all, lastInsertId };
