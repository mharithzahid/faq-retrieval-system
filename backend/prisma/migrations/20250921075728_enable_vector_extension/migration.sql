CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public; 

-- CreateTable
CREATE TABLE "public"."Faq" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "tags" TEXT[],
    "lang" TEXT NOT NULL DEFAULT 'en',
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);
