-- db_init.sql - optional SQL to pre-create tables (same as server.js)
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  mime TEXT,
  size INTEGER,
  filename TEXT,
  createdAt INTEGER
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  body TEXT,
  date TEXT,
  createdAt INTEGER
);
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT,
  data TEXT,
  updatedAt INTEGER
);
