# Sync Fork

A small Next.js + MongoDB app that lets anyone in your org trigger a "Sync fork"
on a fork owner's behalf.

The owner registers their fork once (fork URL + a fine-grained PAT). The PAT is
encrypted at rest. Afterwards, anyone with the shared app password can one-click
sync that fork from its upstream. After each sync the app writes/updates a
`syncfork.md` file as a commit authored by the fork owner, so the owner is always
the latest committer.

## How it works

1. Sync upstream into the fork: `POST /repos/{owner}/{repo}/merge-upstream`.
2. Stamp an owner commit: create/update `syncfork.md` via the Contents API with
   the `author`/`committer` set to the fork owner.

The fine-grained PAT needs **Contents: Read and write** on the fork repository.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values:

   - `MONGODB_URI` - MongoDB connection string.
   - `APP_PASSWORD` - shared password to access the app.
   - `SESSION_SECRET` - long random string used to sign the session cookie.
   - `ENCRYPTION_KEY` - 32-byte key as 64 hex chars for AES-256-GCM PAT encryption.
     Generate one with:

     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in with `APP_PASSWORD`.

## Project structure

- `lib/mongo.ts` - cached mongoose connection.
- `lib/crypto.ts` - AES-256-GCM encrypt/decrypt for stored PATs.
- `lib/auth.ts` - shared-password verification + signed session token.
- `lib/github.ts` - Octokit helpers (parse URL, repo meta, merge upstream, upsert file).
- `models/repo.ts` - mongoose schema/model for registered forks.
- `middleware.ts` - gates all pages and APIs behind the session cookie.
- `app/` - login, home (fork list), add-fork pages and API routes.

## Notes / out of scope

- Only the default branch is synced.
- No per-user accounts; access is a single shared password.
- No scheduled/auto sync or webhooks yet.
# sync-fork
