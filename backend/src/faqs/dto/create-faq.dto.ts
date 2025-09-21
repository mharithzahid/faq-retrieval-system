import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @MinLength(5)
  question: string;

  @IsString()
  @MinLength(5)
  answer: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  lang?: string;
}
