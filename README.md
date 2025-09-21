# Candidate Assessment – FAQ Retrieval System

## Overview
Minimal patient–provider FAQ retrieval prototype built with:

- **Backend:** Nest.js  
- **Frontend:** Next.js  
- **Database:** PostgreSQL + pgvector  
- **ORM:** Prisma  
- **Embeddings:** OpenAI  

### Features
- CRUD for FAQs (`question`, `answer`, `tags[]`, `lang`)
- `/ask` endpoint:
  - Returns ranked results with score
  - Threshold fallback
  - Ambiguity flag
- Seeds 6 FAQs with embeddings

## Prerequisites
- Node.js **18+**
- Docker and Docker Compose
- OpenAI API key (for embeddings)

## Setup & Run

### 1. Start the database (PostgreSQL with pgvector)
```bash
docker compose up -d
````

### 2. Environment files (Required)

You need **two env files** — one for the backend, one for the frontend.

#### Backend → `backend/.env`

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5430/faqs?schema=public"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5430/faqs_shadow?schema=public"
OPENAI_API_KEY="YOUR-OPENAI-KEY"
```

#### Frontend → `frontend/.env.local`

Example:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
ADMIN_USER="admin"
ADMIN_PASS="password123"
```

### 3. Install backend dependencies & run migrations

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

### 4. Seed the database (creates 6 FAQs with embeddings)

```bash
npm run db:seed
```

**Notes:**

* Seeding calls `text-embedding-3-small` and writes vectors to the `embedding` column (`pgvector`).
* If you skip seeding or don’t set `OPENAI_API_KEY`, CRUD still works, but `/ask` will return no matches until embeddings exist.

### 5. Run the backend

```bash
npm run start:dev
```

Backend runs at: **[http://localhost:3000](http://localhost:3000)**

**Key endpoints:**

* `GET /faqs?lang=en&tag=booking&search=hours`
* `POST /faqs`
* `PATCH /faqs/:id`
* `DELETE /faqs/:id`
* `POST /ask`

### 6. Frontend install & run

```bash
cd ../frontend
npm install
npm run dev
```

## How Scoring Works (Hybrid Approach)

1. **Vector similarity (primary signal)**  
   - Query and FAQ entries are embedded using `text-embedding-3-small` (1536-dim).  
   - `pgvector` computes similarity → `1 - cosine_distance` → normalized to `[0,1]`.  
   - Acts as the main semantic relevance measure.

2. **Keyword overlap (lexical signal)**  
   - Text is normalized, tokenized, stopwords removed, and stemmed (`booking` → `book`).  
   - Overlap is measured separately for FAQ **question** and **answer**:  
     ```
     score = 0.7 * overlap(query, question) + 0.3 * overlap(query, answer)
     ```
   - This balances precision (question) with recall (answer).

3. **Tag boost (intent hint)**  
   - Query tokens are mapped to high-level tags (e.g., `"open", "hours"` → `hours`).  
   - If predicted tags overlap with FAQ tags → boost added.  
   - Multiple matches increase the boost (capped at 1.0).

4. **Final score (hybrid fusion)**  
```
final = 0.7 \* vector + 0.2 \* keyword + 0.1 \* tagBoost
```
- Weighted combination of signals ensures semantic + lexical + intent coverage.  
- Scores are clamped into `[0,1]`.

5. **Thresholding & ambiguity handling**  
- Only keep FAQs with `final >= threshold` (default `0.4`).  
- If top candidates are **within delta (0.05)** but belong to **different tags**,  
  mark as `ambiguous: true`.

## How to Run Seed & Test `/ask`

### Seed

```bash
cd backend
npm run db:seed
```

**Expected:** logs showing 6 seeded FAQs.

### Test `/ask`

**Example 1 – Hours**

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"text":"Are you open on Saturday?", "lang":"en"}'
```

**Example 2 – Booking**

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"text":"How do I reschedule my appointment?", "lang":"en"}'
```

**Example 3 – Possible ambiguity (billing + location)**

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"text":"Do you take card payments and where are you located?", "lang":"en"}'
```
