Backend for online_notebook_site_v2
----------------------------------
What this provides:
- REST API endpoints for files, events (diary), profile
- Files are stored in /uploads and metadata in SQLite (data.db)
- Static serving from /public (copy your frontend there) or run frontend from original files and set API_BASE

Quick start:
  npm init -y
  npm install express sqlite3 multer cors
  node server.js

Uploads directory: ./uploads
Database file: ./data.db

Notes:
- This is a simple local backend for development. For production you'll need auth, validation and backups.
- To adapt your frontend: replace Firebase code with fetch() calls to /api/... endpoints.
