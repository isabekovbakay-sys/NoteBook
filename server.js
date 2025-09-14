// server.js - simple Express + SQLite backend for the notebook site
// Run: npm init -y
//      npm install express sqlite3 multer cors
//      node server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const dbFile = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile);

// initialize tables if needed
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    mime TEXT,
    size INTEGER,
    filename TEXT,
    createdAt INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    body TEXT,
    date TEXT,
    createdAt INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    data TEXT,
    updatedAt INTEGER
  )`);
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR)); // serve uploaded files

// file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // keep original name but prefix timestamp to avoid collisions
    const name = Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, name);
  }
});
const upload = multer({ storage });

// GET /api/files  - list files
app.get('/api/files', (req, res) => {
  db.all('SELECT id, name, mime, size, filename, createdAt FROM files ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/files - upload a file + metadata
app.post('/api/files', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const name = req.body.name || file.originalname;
  const mime = file.mimetype || 'application/octet-stream';
  const size = file.size || 0;
  const filename = file.filename;
  const createdAt = Date.now();
  db.run('INSERT INTO files (name,mime,size,filename,createdAt) VALUES (?,?,?,?,?)', [name, mime, size, filename, createdAt], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, mime, size, filename, createdAt, url: '/uploads/' + filename });
  });
});

// GET /api/files/:id - file metadata
app.get('/api/files/:id', (req, res) => {
  db.get('SELECT id, name, mime, size, filename, createdAt FROM files WHERE id = ?', [req.params.id], (err,row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  });
});

// DELETE /api/files/:id - delete metadata + file
app.delete('/api/files/:id', (req, res) => {
  db.get('SELECT filename FROM files WHERE id = ?', [req.params.id], (err,row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'not found' });
    const fpath = path.join(UPLOAD_DIR, row.filename);
    fs.unlink(fpath, (e)=>{ /* ignore unlink error */ });
    db.run('DELETE FROM files WHERE id = ?', [req.params.id], function(err){
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// EVENTS (diary) endpoints (basic)
app.get('/api/events', (req,res) => {
  db.all('SELECT id,title,body,date,createdAt FROM events ORDER BY date DESC', [], (err,rows)=> {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/events', (req,res) => {
  const { title, body, date } = req.body;
  const createdAt = Date.now();
  db.run('INSERT INTO events (title,body,date,createdAt) VALUES (?,?,?,?)', [title,body,date,createdAt], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, body, date, createdAt });
  });
});

// Simple profile saving
app.post('/api/profile', (req,res) => {
  const user = req.body.user || 'me';
  const data = JSON.stringify(req.body.data || {});
  const updatedAt = Date.now();
  db.run('INSERT INTO profiles (user,data,updatedAt) VALUES (?,?,?)', [user,data,updatedAt], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// serve the original static site if you copy html files into /public
app.use('/', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server started on', PORT));
