import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common'
import { MovementsService } from './movements.service'
import { CreateMovementDto } from './dto/create-movement.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { BusinessGuard } from '../business-context/business.guard'
import { CurrentBusiness } from '../business-context/current-business.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthenticatedUser } from '../auth/authenticated-user.interface'
import type { Business, MovementType } from '@prisma/client'

@Controller('movements')
@UseGuards(JwtAuthGuard, BusinessGuard)
export class MovementsController {
    constructor(private movementsService: MovementsService) { }

    @Post()
    create(
        @Body() data: CreateMovementDto,
        @CurrentBusiness() business: Business,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.movementsService.create(data, business.id, user.userId)
    }

    @Get()
    findAll(
        @CurrentBusiness() business: Business,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('type') type?: MovementType,
    ) {
        return this.movementsService.findAll(
            business.id,
            Number(page) || 1,
            Number(limit) || 10,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
            type,
        )
    }

    @Get('summary/last-30-days')
    async getSummary(@CurrentBusiness() business: Business) {
        return this.movementsService.getLast30DaysSummary(business.id)
    }
}