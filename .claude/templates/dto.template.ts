import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Input validation for {{PascalCase}}. Never trust client input:
 * every field used by the service must be validated here first.
 */
export class Create{{PascalCase}}Dto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  status?: string;
}

export class Update{{PascalCase}}Dto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  status?: string;
}
