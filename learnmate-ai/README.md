# LearnMate AI

AI-powered personalised learning platform: upload PDFs, chat with a grounded tutor that cites `[Page X]`, take AI-generated quizzes, and get an adaptive study plan driven by your real quiz history.

**Stack:** React (Vite) + Tailwind + Recharts + Lucide + Axios, Node/Express, Multer, pdf-parse, MongoDB/Mongoose, Gemini (`@google/generative-ai`).

## Directory tree
```
learnmate-ai/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js                # Express app, helmet, CORS, rate limits, DB connect
│       ├── middleware/              # errors.js (HttpError, handler), upload.js (Multer + validation)
│       ├── models/                  # Document, QuizAttempt, StudyPlan, Settings
│       ├── routes/                  # documents, tutor, quiz, progress, planner, settings
│       └── services/
│           ├── ai.js                # Gemini calls, grounding prompt, JSON validation, mode resolver
│           ├── demoAI.js            # Demo Mode engine (built from the user's own PDF text)
│           ├── pdf.js               # page-by-page extraction
│           ├── context.js           # picks relevant pages for the prompt
│           └── analytics.js         # mastery (Weak/Developing/Strong) + streak
└── frontend/
    ├── package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html
    └── src/
        ├── main.jsx, App.jsx, api.js, context.jsx, hooks.js, index.css
        ├── components/              # Layout (sidebar), ui (Card/Button/Alert/Skeleton/...), PageViewer
        └── pages/                   # Dashboard, Documents, Tutor, Quiz, Progress, Planner, Settings
```

## Run locally
Prerequisites: Node 18+ and MongoDB (local, or a free Atlas URI).

```bash
# 0) MongoDB (skip if you already have one)
docker run -d --name learnmate-mongo -p 27017:27017 mongo:7

# 1) Backend
cd backend
cp .env.example .env        # then paste your GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm install
npm run dev                 # http://localhost:5000

# 2) Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (Vite proxies /api -> :5000)
```

No Gemini key? Open **Settings** and switch on **Demo Mode**. It never calls Gemini and builds extractive answers, fill-in-the-blank quizzes and plans from your uploaded text.

## API
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/documents` | list / upload PDF (multipart `file`, 10 MB, PDF only) |
| GET | `/api/documents/:id/pages/:n` | text of one page (citation viewer) |
| DELETE | `/api/documents/:id` | delete document |
| POST | `/api/tutor/ask` | `{documentId, question, difficulty, history}` |
| POST | `/api/quiz/generate` | `{documentId, count: 5-10}` (answers stay server-side) |
| POST | `/api/quiz/:id/submit` | `{answers[], durationSec}` returns graded attempt + explanations |
| GET | `/api/progress` | stats, mastery, history, trend, activity |
| GET/POST | `/api/planner`, `/api/planner/generate` | latest plan / generate `{days: 3-7}` |
| PATCH | `/api/planner/:planId/tasks/:taskId` | tick a task `{done}` |
| GET/POST/PUT | `/api/settings/status`, `/probe`, `/` | health, Gemini test, Demo Mode toggle |

## Design notes
- `GEMINI_API_KEY` exists only in `backend/.env`; the browser never sees it.
- Grounding: strict system prompt, exact refusal sentence, `[Page X]` citations rendered as clickable badges that open the real extracted page text.
- Quizzes are stored as `in_progress` with correct answers hidden server-side, then graded on submit. Mastery is aggregated from completed attempts in MongoDB.
- Single-user MVP (no login). Add auth before multi-user use.
- Scanned PDFs (no selectable text) are rejected with a clear message; OCR is out of scope.

## 4-minute hackathon demo script
1. **Dashboard (0:20)**: empty state, "Welcome" banner. Explain the problem: students can't trust generic chatbots with their own material.
2. **My Documents (0:40)**: drag in a lecture PDF; show upload progress, then "Extracting text page by page". Click the eye icon to show page-level indexing.
3. **AI Tutor (1:00)**: ask a question in **Beginner**, then the same one in **Advanced** to show depth change. Click a `[Page X]` badge to show the source. Ask something unrelated (e.g. "Who won the World Cup?") to show the exact refusal line: grounding, no hallucination.
4. **Practice Quiz (0:50)**: 5 questions, show timer and progress bar, deliberately miss a few, submit, walk through explanations with page citations.
5. **Progress + Planner (0:40)**: bar chart colours topics Weak/Developing/Strong; take a second quiz first if you want a trend line. Generate a 5-day plan targeting the weak topics, tick a task.
6. **Settings (0:30)**: show Backend/MongoDB/Gemini status, then flip **Demo Mode** to show the fallback that keeps the demo alive on bad Wi-Fi.

**Tip:** before judging, run one real quiz or two so Progress and Planner have data.
