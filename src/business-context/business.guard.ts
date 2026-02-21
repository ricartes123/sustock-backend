import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    const businessId = request.headers['x-business-id'];

    const whereClause: any = {
      OR: [
        { ownerId: user.userId },
        { teamMembers: { some: { userId: user.userId } } },
      ],
    };

    if (businessId) {
      whereClause.id = businessId;
    }

    const business = await this.prisma.business.findFirst({
      where: whereClause,
    })

    if (!business) {
      throw new NotFoundException('Business not found or access denied')
    }

    request.business = business

    return true
  }
}