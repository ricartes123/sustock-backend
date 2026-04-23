import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../products/dto/pagination.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateClientDto, workspaceId: string) {
        return this.prisma.client.create({
            data: {
                ...data,
                workspaceId,
            },
        });
    }

    async findAll(
        workspaceId: string,
        { page = 1, limit = 10, search, status = 'ACTIVE' }: PaginationDto,
    ) {
        const skip = (page - 1) * limit;
        const whereClause: Prisma.ClientWhereInput = { workspaceId };

        if (status !== 'ALL') {
            whereClause.isActive = status === 'ACTIVE';
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [clients, total] = await Promise.all([
            this.prisma.client.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.client.count({
                where: whereClause,
            }),
        ]);

        return {
            data: clients,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, workspaceId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, workspaceId, isActive: true },
        });
        if (!client) throw new NotFoundException('Client not found');
        return client;
    }

    async update(id: string, data: UpdateClientDto, workspaceId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, workspaceId, isActive: true },
        });
        if (!client) throw new NotFoundException('Client not found');

        return this.prisma.client.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, workspaceId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, workspaceId },
        });
        if (!client) throw new NotFoundException('Client not found');

        await this.prisma.client.update({
            where: { id },
            data: { isActive: false },
        });
        return { message: 'Client successfully archived' };
    }

    async restore(id: string, workspaceId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, workspaceId },
        });
        if (!client) throw new NotFoundException('Client not found');

        await this.prisma.client.update({
            where: { id },
            data: { isActive: true },
        });
        return { message: 'Client successfully restored' };
    }
}
