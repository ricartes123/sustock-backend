import { IsOptional, IsTimeZone } from 'class-validator'

export class DashboardQueryDto {
    @IsOptional()
    @IsTimeZone()
    tz?: string
}
