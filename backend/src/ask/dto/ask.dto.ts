import { IsOptional, IsString, MinLength } from 'class-validator';

export class AskDto {
  @IsString()
  @MinLength(2)
  text: string;

  @IsOptional()
  @IsString()
  lang?: string;
}