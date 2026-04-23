import { IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  search?: string;

  @IsOptional()
  lowStock?: string;

  @IsOptional()
  @IsIn(['ALL', 'ACTIVE', 'ARCHIVED'])
  status?: string;
}
