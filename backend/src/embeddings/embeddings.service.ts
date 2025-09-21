import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async embed(text: string): Promise<number[]> {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const res = await this.openai.embeddings.create({
    model: 'text-embedding-3-small', // 1536-dim
    input: cleaned,
  });
  return res.data[0].embedding;
}
}