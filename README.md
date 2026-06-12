# Dilema 10 Tahanan

A real-time, mobile-friendly, multiplayer **Public Goods Game** — the N-player
generalization of the Prisoner's Dilemma. Built with **Next.js 16** (App Router)
and **Firebase Firestore** for shared realtime state. No login required. UI copy
is in Bahasa Indonesia.

Each round every player secretly contributes part of their token endowment to a
shared pot. The pot is multiplied and split equally. Contributing helps the
group; keeping tokens helps you — that's the dilemma.

## How to play

1. **Host** opens the app → **Buat Room** → gets a 6-character code, configures
   the rules, and shows the code to players.
2. **Players** (up to 10) open the app on their phones → enter the code + a name
   → **Gabung**.
3. Host presses **Mulai**. Each round:
   - Everyone picks a contribution and presses **Kunci** (secret). Only an
     `X/N sudah mengunci` counter is shown — never the values.
   - When all active players lock in, results reveal automatically: each
     player's contribution and payoff, the pot, and the updated scoreboard.
   - Host advances to the next round or the game ends (random stop / fixed
     rounds).
4. At the end: final ranking, average cooperation, and a contribution chart.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Firebase credentials are already in `.env.local` (project `e-fisip`).
Open one tab as host and a few incognito tabs / phones as players.

## Firebase setup

This app uses a **named Firestore database** called `experiment` (set via
`NEXT_PUBLIC_FIRESTORE_DATABASE_ID` in `.env.local`), not the project's
`(default)` database. Create it once in the console (**Firestore → add database
→ database ID `experiment`, Native mode**) or via CLI:

```bash
gcloud firestore databases create --database=experiment --location=asia-southeast1
```

For the game's writes to work you need open rules on the `experiment` database.
`firestore.rules` is intentionally simple (fully public — fine for a casual,
short-lived game):

```
allow read, write: if true;
```

Set it in the Firebase console (Firestore → Rules → pick the `experiment`
database) or deploy from the repo:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules   # firebase.json → database "experiment"
```

> Note: rules are per-database, so make sure the open rule is on `experiment`,
> not `(default)`. There is no login, so pre-reveal secrecy is enforced in the
> UI, not by rules — a fine trade-off for a minigame.

## Game rules (host-configurable)

- `pot = Σ contributions`, `payoff_i = (endowment − contribution_i) + r·pot/N`
- **Endowment** (default 10), **multiplier `r`** (default 5).
- **Guardrail**: a real dilemma needs `1 < r < N`. The host config warns live
  when `r` is outside that range for the current player count (note `r = 5` only
  works as a dilemma when there are more than 5 players).
- **Ending**: *random stop* (default, % chance each round) or a *fixed* number of
  rounds (hidden from players to avoid endgame unraveling).
- Optional per-round **timer**; on timeout a player is auto-locked at 0.

## Architecture

- **Firestore only**, accessed directly from the browser via the client SDK with
  realtime `onSnapshot` — genuine shared cross-device state.
- **The host device is the authority**: players only write their own submission;
  the host drives every transition and computes payoffs (one `writeBatch`). No
  server, no Admin SDK, no service account.
- Anonymous identity in `localStorage`, scoped per room → reload/disconnect
  rejoins the same seat and score.

```
src/lib/game/        types · logic (pure math + guardrails) · firestore · hooks
src/lib/identity.ts  anonymous per-room player/host ids
src/components/game/  all UI components
src/app/page.tsx           create / join
src/app/host/[code]/       host control panel
src/app/play/[code]/       player view
firestore.rules            security rules (deploy these)
```

## Deploy to Vercel

```bash
vercel
```

Add the `NEXT_PUBLIC_FIREBASE_*` variables (from `.env.local`) in the Vercel
project's Environment Variables. No server-side secrets are needed.
