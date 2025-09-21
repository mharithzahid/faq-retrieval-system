Candidate Assessment – FAQ Retrieval System

Overview
- Minimal patient–provider FAQ retrieval prototype using Nest.js (backend), Next.js (frontend), PostgreSQL + pgvector, Prisma, and OpenAI embeddings.
- Features:
  - CRUD for FAQs (question, answer, tags[], lang)
  - /ask endpoint: returns ranked results with score, threshold fallback, and ambiguity flag
  - Seeds 6 FAQs with embeddings

Repo structure
- faq-retrieval-system/
  - backend/ (Nest.js)
  - frontend/ (Next.js)
  - docker-compose.yml
  - README.md

Prerequisites
- Node.js 18+
- Docker and Docker Compose
- OpenAI API key (for embeddings)

Setup and run

1) Start the database (PostgreSQL with pgvector)
- From repo root: docker compose up -d

2) Backend env
- Create backend/.env with:
  - DATABASE_URL="postgresql://postgres:postgres@localhost:5432/faqs?schema=public"
  - OPENAI_API_KEY="sk-REPLACE_ME"
  - Optional for Prisma shadow DB: SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/faqs_shadow?schema=public"

3) Install backend deps, run migrations, generate client
- cd backend
- npm install
- npx prisma migrate dev
- npx prisma generate

4) Seed the database (creates 6 FAQs with embeddings)
- Ensure OPENAI_API_KEY is set
- npm run db:seed
- Notes:
  - Seeding calls OpenAI text-embedding-3-small and writes vectors to the embedding column (pgvector).
  - If you skip seeding or lack an API key, CRUD still works but /ask will return no matches until embeddings exist.

5) Run the backend
- npm run start:dev
- Backend runs at http://localhost:3000
- Key endpoints:
  - GET /faqs?lang=en&tag=booking&search=hours
  - POST /faqs
  - PATCH /faqs/:id
  - DELETE /faqs/:id
  - POST /ask

6) Frontend env and run
- cd ../frontend
- npm install
- Create frontend/.env.local with:
  - NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
- Run:
  - npm run dev

How scoring works (simple hybrid)
- Vector similarity (primary signal): Embed the user query and each FAQ (question+answer) using OpenAI embeddings (text-embedding-3-small, 1536-dim). Query via pgvector and compute vector score = 1 - cosine_distance, in range [0,1].
- Keyword overlap (light lexical signal): Normalize and tokenize text, remove stopwords, then compute overlap(queryTokens ∩ faqTokens)/queryTokens.length (bounded [0,1]).
- Tag boost (intent hint): Map query tokens through a tiny dictionary to predict tags (e.g., “open”, “hours” -> hours). If any predicted tag matches a FAQ’s tags, apply a small boost.
- Final score = 0.8 * vector + 0.15 * keyword + 0.05 * tagBoost. Keep the top candidates above a confidence threshold. If multiple close scores from different tags are within a small delta set ambiguous: true and return them.

How to run the seed and test /ask

Seed
- Ensure DB is up and migrations applied.
- Ensure backend/.env contains OPENAI_API_KEY.
- From backend: npm run db:seed
- Expected: logs indicating 6 seeded FAQs.

Test /ask
- Example 1 (hours):
  - curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"text":"Are you open on Saturday?", "lang":"en"}'
- Example 2 (booking):
  - curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"text":"How do I reschedule my appointment?", "lang":"en"}'
- Example 3 (possible ambiguity: billing + location):
  - curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"text":"Do you take card payments and where are you located?", "lang":"en"}'
