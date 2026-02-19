import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { MovementsService } from './movements.service'
import { CreateMovementDto } from './dto/create-movement.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { BusinessGuard } from '../business-context/business.guard'
import { CurrentBusiness } from '../business-context/current-business.decorator'
import type { Business } from '@prisma/client'

@Controller('movements')
@UseGuards(JwtAuthGuard, BusinessGuard)
export class MovementsController {
    constructor(private movementsService: MovementsService) { }

    @Post()
    create(
        @Body() data: CreateMovementDto,
        @CurrentBusiness() business: Business,
    ) {
        return this.movementsService.create(data, business.id)
    }
}