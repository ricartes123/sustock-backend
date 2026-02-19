import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    const business = await this.prisma.business.findFirst({
      where: { ownerId: user.userId },
    })

    if (!business) {
      throw new NotFoundException('Business not found')
    }

    request.business = business

    return true
  }
}