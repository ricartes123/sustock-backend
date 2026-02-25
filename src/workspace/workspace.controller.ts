import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) { }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workspaceService.findAllByUser(user.userId);
  }

  @Patch(':id/currency')
  updateCurrency(
    @Param('id') id: string,
    @Body() dto: UpdateCurrencyDto,
    @CurrentUser() user: any
  ) {
    return this.workspaceService.updateCurrency(id, dto.newCurrency, user.userId, dto.conversionRate);
  }
}