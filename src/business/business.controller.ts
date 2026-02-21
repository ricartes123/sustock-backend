import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { BusinessService } from './business.service';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private businessService: BusinessService) { }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.businessService.findAllByUser(user.userId);
  }

  @Patch(':id/currency')
  updateCurrency(
    @Param('id') id: string,
    @Body() dto: UpdateCurrencyDto,
    @CurrentUser() user: any
  ) {
    return this.businessService.updateCurrency(id, dto.newCurrency, user.userId, dto.conversionRate);
  }
}