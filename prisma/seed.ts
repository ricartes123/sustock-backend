import { PrismaClient, MovementType, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import "dotenv/config";
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Seeding database...')

    // 1. Clean existing records (optional, but good for reliable seeding)
    await prisma.movement.deleteMany()
    await prisma.product.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.business.deleteMany()
    await prisma.user.deleteMany()

    // 2. Create standard user and hashed password
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
        data: {
            email: 'demo@sustock.com',
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'Owner',
        },
    })

    // 3. Create a secondary user for team membership testing
    const secondaryUser = await prisma.user.create({
        data: {
            email: 'staff@sustock.com',
            password: hashedPassword,
            firstName: 'Staff',
            lastName: 'Assistant',
        },
    })

    // 4. Create Business owned by main user
    const business = await prisma.business.create({
        data: {
            name: 'TechStore Demo',
            currency: 'USD',
            ownerId: user.id,
            teamMembers: {
                create: [
                    {
                        userId: secondaryUser.id,
                        role: Role.STAFF,
                    },
                ],
            },
        },
    })

    // 5. Create 10 Products
    const productsData = [
        { name: 'Laptop Pro 15"', price: 1200.0, stock: 15, stockMin: 5, sku: 'L-PRO-15', barcode: '1234567890123' },
        { name: 'Mechanical Keyboard RGB', price: 120.5, stock: 40, stockMin: 10, sku: 'KBD-RGB-01' },
        { name: 'Wireless Mouse 6000dpi', price: 45.99, stock: 55, stockMin: 15, sku: 'MSE-W-02', barcode: '9876543210987' },
        { name: '27" 4K Monitor', price: 350.0, stock: 8, stockMin: 10, sku: 'MON-27-4K' },
        { name: 'USB-C Docking Station', price: 89.99, stock: 25, stockMin: 5, sku: 'DOCK-USBC' },
        { name: 'Noise Cancelling Headphones', price: 199.99, stock: 3, stockMin: 5, sku: 'HDP-NC-001' },
        { name: 'HD Webcam 1080p', price: 59.5, stock: 20, stockMin: 5 },
        { name: 'Smartphone Stand', price: 15.0, stock: 100, stockMin: 20, sku: 'STD-SMT-01' },
        { name: '1TB NVMe SSD', price: 110.0, stock: 30, stockMin: 10, sku: 'SSD-1TB-NV' },
        { name: 'Ergonomic Desk Chair', price: 250.0, stock: 5, stockMin: 2 },
    ]

    const products: any[] = []
    for (const p of productsData) {
        const product = await prisma.product.create({
            data: {
                ...p,
                businessId: business.id,
            },
        })
        products.push(product)
    }

    // 6. Generate 20 Random Movements
    for (let i = 0; i < 20; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)]
        const randomType = Math.random() > 0.6 ? MovementType.IN : MovementType.OUT
        const randomQuantity = Math.floor(Math.random() * 5) + 1
        const actor = Math.random() > 0.5 ? user : secondaryUser

        // Date in the last 30 days
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30))

        await prisma.movement.create({
            data: {
                productId: randomProduct.id,
                businessId: business.id,
                userId: actor.id,
                type: randomType,
                quantity: randomQuantity,
                reason: randomType === MovementType.IN ? 'Restock' : 'Sale',
                createdAt: pastDate,
            },
        })
    }

    console.log(`Database seeded!`)
    console.log(`Demo User: demo@sustock.com / password123`)
    console.log(`Staff User: staff@sustock.com / password123`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })