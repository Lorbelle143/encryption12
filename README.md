# NBSC Guidance Counseling — Document Management System

A secure document management web app for NBSC Guidance Counseling. Admins can upload, organize, and manage folders of files (PDF and images) protected by passwords and classification levels.

---

## Tech Stack

- React 18 + Vite
- Supabase (database + file storage)
- React Router v5
- Deployed on Vercel

---

## Features

- Admin login via hashed master key with rate limiting (5 attempts, 15min lockout)
- Create password-protected folders (passwords stored as SHA-256 hashes)
- Upload PDF and image files (JPG, PNG, GIF, WEBP) — max 10MB each
- Classification levels: Public, Internal, Confidential, Restricted
- Search folders by name, notes, or classification
- List and grid view
- Soft delete — folders go to Archive instead of being permanently deleted
- Restore or permanently delete archived folders
- View and download individual files or all at once

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd nbsc-guidance-counseling
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MASTER_KEY_HASH=your_sha256_hash_here
```

To generate your master key hash, run this in your browser console:

```js
const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password'));
console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,'0')).join(''));
```

Paste the output as `VITE_MASTER_KEY_HASH`. Never store the plain password.

### 3. Set up Supabase

Run the SQL files in order in your Supabase SQL Editor:

1. `supabase-schema.sql` — creates the `folders` table, storage bucket, and RLS policies
2. `supabase-archive.sql` — adds archive support columns (skip if running schema fresh)
3. `supabase-rls.sql` — tightens RLS policies to anon-key-only access

### 4. Run locally

```bash
npm run dev
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variables from `.env` in the Vercel project settings
4. Deploy — Vercel picks up `vercel.json` config automatically

---

## Security

- Master key is never stored in plain text — only its SHA-256 hash is in the env
- Folder passwords are hashed with SHA-256 before being saved to the database
- Login is rate-limited: 5 failed attempts triggers a 15-minute lockout
- RLS policies restrict direct database access to requests using your Supabase anon key

---

## Database

### folders table

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| folder_name | TEXT | Name of the folder |
| classification | TEXT | PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED |
| notes | TEXT | Optional notes |
| file_count | INTEGER | Number of files |
| file_urls | TEXT[] | Storage paths of uploaded files |
| folder_password | TEXT | SHA-256 hash of the folder password |
| is_archived | BOOLEAN | Soft delete flag |
| archived_at | TIMESTAMPTZ | When it was archived |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last updated timestamp |
