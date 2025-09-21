import { Module } from '@nestjs/common';
import { AskController } from './ask.controller';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [EmbeddingsModule],
  controllers: [AskController],
})

export class AskModule {}