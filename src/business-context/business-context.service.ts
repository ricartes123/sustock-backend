import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BusinessContextService {
    constructor(private prisma: PrismaService) { }

    async getBusinessOrThrow(userId: string) {
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId },
        })

        if (!business) {
            throw new NotFoundException('Business not found')
        }

        return business
    }
}