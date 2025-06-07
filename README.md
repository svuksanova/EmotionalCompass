# EmotionalCompass

A chatbot‑style web application that helps users track feelings, reflect on their day and receive curated tips for emotional well‑being.

---

## ✨Features

| Area      | Details                                                   |
| ----------- | ----------------------------------------------------------- |
| ChatFlow   | Question/answer conversation that adapts to the user’s mood |
| Auth       | JWT‑based login & register with hashed passwords (bcrypt)   |
| Data       | PostgreSQL (Neon) managed via Prisma ORM                    |
| TipsEngine | Server chooses closing messages & self‑care suggestions     |
| Deployment | One‑click **Render** WebService (free tier)                |
| UI          | Vite+ React18 + TypeScript                                |

---

## 🎬Quick Demo

[▶️Watch a short demo](https://github.com/svuksanova/ThinkSafePlaySafe/blob/main/DemoVideo.mp4)

---

## 🏗️TechStack

```text
Frontend : React18 · Vite · TypeScript · React‑Router
Backend : Express5 · tsx runtime · Prisma6 · Zod
Database : PostgreSQL (Neon serverless + pooled URL)
Infra : Render (monolithic Node web service)
```

---

## 🔧LocalDevelopment

```bash
# 1. clone & install
$ git clone https://github.com/<you>/EmotionalCompass.git
$ cd EmotionalCompass
$ npm ci

# 2. create an `.env` file with the required secrets

# 3. migrate + seed database (optional)
$ npx prisma migrate deploy
$ npm run seed                  # or npx prisma db seed

# 4. launch both servers
$ npm run backend # API on http://localhost:3000
$ npm run dev # Vite on http://localhost:5173
```

The front‑end proxy points API calls at **`http://localhost:3000`** during dev
automatically.

---

---

---

## 🧩Scripts

| Command         | What it does                                           |
| --------------- | -------------------------------------------------------- |
| `npm run dev`   | Launch Vite dev server (port5173)                       |
| `npm run backend` | Run Express API via tsx watcher                          |
| `npm run build` | `tsc -b && vite build` – compiles server & bundles React |
| `npm run seed`  | Seeds example data via `prisma db seed`                  |
| `npm run lint`  | ESLint check                                             |

---

## 👥ProjectTeam

* Stefani Vuksanova
* Vladislav Angelovski

---
