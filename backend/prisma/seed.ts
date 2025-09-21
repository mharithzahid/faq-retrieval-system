import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SeedFaq = {
  question: string;
  answer: string;
  tags: string[];
  lang?: string;
};

const faqs: SeedFaq[] = [
  {
    question: 'What are your opening hours?',
    answer: 'We are open Mon–Fri 8am–6pm; Sat 9am–1pm; closed Sunday and public holidays.',
    tags: ['hours'],
  },
  {
    question: 'How can I book or reschedule an appointment?',
    answer: 'Book online via our portal or call reception. To reschedule, use the confirmation link or call at least 24 hours in advance.',
    tags: ['booking'],
  },
  {
    question: 'Where are you located and is parking available?',
    answer: 'We’re at 123 Main St, Suite 5. Limited street parking; paid lot next door. Nearest metro: Central.',
    tags: ['location', 'parking'],
  },
  {
    question: 'Do you offer vaccinations?',
    answer: 'Yes, we provide routine immunizations and travel vaccines. Bring your vaccination record.',
    tags: ['services', 'vaccination'],
  },
  {
    question: 'How do billing and payments work?',
    answer: 'We accept Visa, Mastercard, and cash. Invoices are emailed. For insurance claims, submit your policy details at check-in.',
    tags: ['billing', 'payments'],
  },
  {
    question: 'What is your WhatsApp support window?',
    answer: 'WhatsApp support is available 9am–5pm on weekdays for non-urgent queries.',
    tags: ['support', 'whatsapp'],
  },
];

async function getEmbedding(text: string): Promise<number[]> {
  const content = text.replace(/\s+/g, ' ').trim();
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  });
  return res.data[0].embedding;
}

async function main() {
  console.log('Seeding FAQs with embeddings...');
  for (const item of faqs) {
    const lang = item.lang ?? 'en';
    const combined = `${item.question}\n\n${item.answer}`;
    const embedding = await getEmbedding(combined);

    const created = await prisma.faq.create({
      data: {
        question: item.question,
        answer: item.answer,
        tags: item.tags,
        lang,
      },
    });

    const vectorLiteral = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`
      UPDATE "Faq"
      SET "embedding" = ${vectorLiteral}::vector
      WHERE "id" = ${created.id}
    `;

    console.log(`Seeded FAQ id=${created.id} (${item.tags.join(',')})`);
  }
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });