import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

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

    async findAll(workspaceId: string) {
        return this.prisma.client.findMany({
            where: { workspaceId },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string, workspaceId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, workspaceId },
        });
        if (!client) throw new NotFoundException('Client not found');
        return client;
    }
}
