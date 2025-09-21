import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FaqsModule } from './faqs/faqs.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { AskModule } from './ask/ask.module';

@Module({
  imports: [PrismaModule, EmbeddingsModule, FaqsModule, AskModule],
})
export class AppModule {}