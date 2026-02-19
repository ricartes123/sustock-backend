import { Controller, Get, UseGuards } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { BusinessGuard } from '../business-context/business.guard'
import { CurrentBusiness } from '../business-context/current-business.decorator'
import type { Business } from '@prisma/client'

@Controller('dashboard')
@UseGuards(JwtAuthGuard, BusinessGuard)
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get()
    getOverview(@CurrentBusiness() business: Business) {
        return this.dashboardService.getOverview(business.id)
    }
}