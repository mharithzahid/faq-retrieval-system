import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class FaqsService {
  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
  ) {}

  async findAll(params?: { lang?: string; tag?: string; search?: string }) {
    const { lang, tag, search } = params || {};

    return this.prisma.faq.findMany({
      where: {
        ...(lang ? { lang } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(search
          ? {
              OR: [
                { question: { contains: search, mode: 'insensitive' } },
                { answer: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.faq.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('FAQ not found');
    return item;
  }

  async create(dto: CreateFaqDto) {
    const lang = dto.lang ?? 'en';
    console.log({ dto });
    

    const created = await this.prisma.faq.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        tags: dto.tags,
        lang,
      },
    });

    const combined = `${created.question}\n\n${created.answer}`;
    const vec = await this.embeddings.embed(combined);
    const vectorLiteral = `[${vec.join(',')}]`;

    await this.prisma.$executeRaw`
      UPDATE "Faq"
      SET "embedding" = ${vectorLiteral}::vector
      WHERE "id" = ${created.id}
    `;

    return created;
  }

  async update(id: number, dto: UpdateFaqDto) {
    const existing = await this.prisma.faq.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('FAQ not found');

    const updated = await this.prisma.faq.update({
      where: { id },
      data: {
        question: dto.question ?? existing.question,
        answer: dto.answer ?? existing.answer,
        tags: dto.tags ?? existing.tags,
        lang: dto.lang ?? existing.lang,
      },
    });

    const requiresEmbedding =
      dto.question !== undefined ||
      dto.answer !== undefined ||
      dto.lang !== undefined;

    if (requiresEmbedding) {
      const combined = `${updated.question}\n\n${updated.answer}`;
      const vec = await this.embeddings.embed(combined);
      const vectorLiteral = `[${vec.join(',')}]`;

      await this.prisma.$executeRaw`
        UPDATE "Faq"
        SET "embedding" = ${vectorLiteral}::vector
        WHERE "id" = ${updated.id}
      `;
    }

    return updated;
  }

  async remove(id: number) {
    await this.prisma.faq.delete({ where: { id } });
    return { success: true };
  }
}
