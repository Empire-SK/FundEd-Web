import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly point to .env file in root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearData() {
  try {
    console.log('Starting database cleanup...');

    // 1. Delete dependent records first (Payments and PrintDistributions)
    console.log('Deleting Payments...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`Deleted ${deletedPayments.count} payments.`);

    console.log('Deleting PrintDistributions...');
    const deletedprints = await prisma.printDistribution.deleteMany({});
    console.log(`Deleted ${deletedprints.count} print distributions.`);

    // 2. Delete parent records (Events and Students)
    // Implicit many-to-many relations (if any) are handled by Prisma,
    // but here we have explicit relations or simple foreign keys.

    console.log('Deleting Events...');
    const deletedEvents = await prisma.event.deleteMany({});
    console.log(`Deleted ${deletedEvents.count} events.`);

    console.log('Deleting Students...');
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`Deleted ${deletedStudents.count} students.`);

    console.log('Database cleanup completed successfully. Users and QrCodes were preserved.');

  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
