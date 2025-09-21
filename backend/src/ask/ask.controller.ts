import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { AskDto } from './dto/ask.dto';

type AskRow = {
  id: number;
  question: string;
  answer: string;
  tags: string[];
  lang: string;
  score: number;
};

const THRESHOLD = parseFloat(process.env.ASK_MIN_SCORE || '0.4');
const DELTA = parseFloat(process.env.ASK_AMBIGUITY_DELTA || '0.05');
const TOP_K = parseInt(process.env.ASK_RETURN_TOP_K || '3', 10);
const W_VEC = parseFloat(process.env.ASK_WEIGHT_VECTOR || '0.8');
const W_KW = parseFloat(process.env.ASK_WEIGHT_KEYWORD || '0.15');
const W_TAG = parseFloat(process.env.ASK_WEIGHT_TAG || '0.05');

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'on', 'in', 'at', 'is',
  'are', 'do', 'does', 'how', 'what', 'when', 'where', 'why', 'i', 'we',
  'you', 'us', 'me', 'my', 'our', 'your', 'with', 'can', 'if', 'be', 'from',
]);

const TAG_MAP: Record<string, string> = {
  // hours
  hours: 'hours', hour: 'hours', open: 'hours', opening: 'hours',
  close: 'hours', closing: 'hours', time: 'hours', times: 'hours',
  weekend: 'hours', saturday: 'hours', sunday: 'hours',

  // booking
  book: 'booking', booking: 'booking', schedule: 'booking',
  reschedule: 'booking', appointment: 'booking',

  // location
  location: 'location', address: 'location', directions: 'location',
  parking: 'location', park: 'location', lot: 'location', metro: 'location',

  // vaccination/services
  vaccine: 'vaccination', vaccines: 'vaccination', vaccination: 'vaccination',
  immunization: 'vaccination', flu: 'vaccination', shot: 'vaccination',
  shots: 'vaccination', travel: 'vaccination', services: 'services',

  // billing
  billing: 'billing', bill: 'billing', payment: 'billing', payments: 'billing',
  pay: 'billing', invoice: 'billing', invoices: 'billing', insurance: 'billing',
  claim: 'billing', claims: 'billing',

  // support
  support: 'support', whatsapp: 'support', chat: 'support', message: 'support',
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function tokenize(text: string): string[] {
  const tokens = normalize(text).split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => t.length > 1 && !STOPWORDS.has(t));
  return Array.from(new Set(filtered));
}

function predictTags(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (const t of tokens) {
    const mapped = TAG_MAP[t];
    if (mapped) set.add(mapped);
  }
  return set;
}

function keywordOverlap(queryTokens: string[], faqTokens: string[]): number {
  if (queryTokens.length === 0 || faqTokens.length === 0) return 0;
  const q = new Set(queryTokens);
  let inter = 0;
  for (const t of faqTokens) if (q.has(t)) inter++;
  return inter / queryTokens.length;
}

@Controller('ask')
export class AskController {
  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
  ) {}

  @Post()
  async ask(@Body() dto: AskDto) {
    const lang = dto.lang ?? 'en';
    const qTokens = tokenize(dto.text);

    const vec = await this.embeddings.embed(dto.text);
    const lit = `[${vec.join(',')}]`;

    const candidates = await this.prisma.$queryRaw<AskRow[]>`
      SELECT id, question, answer, tags, lang,
             1 - ("embedding" <=> ${lit}::vector) AS score
      FROM "Faq"
      WHERE "embedding" IS NOT NULL AND "lang" = ${lang}
      ORDER BY "embedding" <=> ${lit}::vector
      LIMIT 15
    `;

    if (!candidates.length) {
      return {
        items: [],
        ambiguous: false,
        fallback: 'Not sure, please contact staff.',
        threshold: THRESHOLD,
      };
    }

    const predicted = predictTags(qTokens);
    const rescored = candidates.map((r) => {
      const fTokens = tokenize(`${r.question} ${r.answer}`);
      const kw = keywordOverlap(qTokens, fTokens);
      const tagHit = r.tags?.some((t) => predicted.has(t)) ? 1 : 0;
      const finalScore = Math.max(
        0,
        Math.min(
          1,
          W_VEC * Number(r.score) + W_KW * kw + W_TAG * tagHit,
        ),
      );
      return { ...r, finalScore };
    });

    rescored.sort((a, b) => b.finalScore - a.finalScore);
    const above = rescored.filter((r) => r.finalScore >= THRESHOLD);

    if (above.length === 0) {
      return {
        items: [],
        ambiguous: false,
        fallback: 'Not sure, please contact staff.',
        threshold: THRESHOLD,
      };
    }

    const topScore = above[0].finalScore;
    const inWindow = above.filter((r) => topScore - r.finalScore <= DELTA);
    const tagSet = new Set<string>();

    for (const item of inWindow) {
      if (item.tags?.length) tagSet.add(item.tags[0]);
    }

    const ambiguous = tagSet.size > 1 && inWindow.length >= 2;
    const selected = ambiguous ? inWindow : above.slice(0, TOP_K);

    return {
      items: selected.map((r) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        tags: r.tags,
        lang: r.lang,
        score: Number(r.finalScore.toFixed(4)),
      })),
      ambiguous,
      threshold: THRESHOLD,
    };
  }
}
