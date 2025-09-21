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

@Controller('ask')
export class AskController {
  private threshold = parseFloat(process.env.ASK_MIN_SCORE || '0.75');
  private ambiguityDelta = parseFloat(process.env.ASK_AMBIGUITY_DELTA || '0.03');
  private topK = parseInt(process.env.ASK_RETURN_TOP_K || '3', 10);

  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
  ) {}

  @Post()
  async ask(@Body() dto: AskDto) {
    const lang = dto.lang ?? 'en';
    const vec = await this.embeddings.embed(dto.text);
    const lit = `[${vec.join(',')}]`;

    const rows = await this.prisma.$queryRaw<AskRow[]>`
      SELECT id, question, answer, tags, lang,
             1 - ("embedding" <=> ${lit}::vector) AS score
      FROM "Faq"
      WHERE "embedding" IS NOT NULL
        AND "lang" = ${lang}
      ORDER BY "embedding" <=> ${lit}::vector
      LIMIT ${Math.max(this.topK + 2, 5)}
    `;

    const above = rows.filter(r => Number(r.score) >= this.threshold);

    if (above.length === 0) {
      return {
        items: [],
        ambiguous: false,
        fallback: 'Not sure, please contact staff.',
        threshold: this.threshold,
      };
    }

    const topScore = Number(above[0].score);
    const inWindow = above.filter(
      r => topScore - Number(r.score) <= this.ambiguityDelta,
    );
    const tagSet = new Set(
      inWindow.map(r => (r.tags && r.tags.length ? r.tags[0] : '')),
    );
    const ambiguous = tagSet.size > 1 && inWindow.length >= 2;

    const finalItems = ambiguous ? inWindow : above.slice(0, this.topK);

    return {
      items: finalItems.map(r => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        tags: r.tags,
        lang: r.lang,
        score: Number(r.score),
      })),
      ambiguous,
      threshold: this.threshold,
    };
  }
}
