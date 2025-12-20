import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();
const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db');

console.log(`📂 Reading from SQLite DB at: ${sqlitePath}`);
const db = new Database(sqlitePath);

async function migrate() {
    try {
        // 1. Users (Admins)
        console.log('Migrating Users...');
        const users = db.prepare('SELECT * FROM User').all() as any[];
        console.log(`Found ${users.length} users`);
        
        for (const user of users) {
             // Check if exists to avoid doubles
             const exists = await prisma.user.findUnique({ where: { email: user.email } });
             if (!exists) {
                 await prisma.user.create({
                     data: {
                         id: user.id,
                         email: user.email,
                         password: user.password,
                         name: user.name,
                         role: user.role,
                         createdAt: new Date(user.createdAt),
                         updatedAt: new Date(user.updatedAt)
                     }
                 });
             }
        }
        console.log('✅ Users migrated');

        // 2. Students
        console.log('Migrating Students...');
        const students = db.prepare('SELECT * FROM Student').all() as any[];
        console.log(`Found ${students.length} students`);
        
        for (const student of students) {
             const exists = await prisma.student.findUnique({ where: { id: student.id } });
             if (!exists) {
                 await prisma.student.create({
                     data: {
                         id: student.id,
                         rollNo: student.rollNo,
                         name: student.name,
                         email: student.email,
                         class: student.class,
                         createdAt: new Date(student.createdAt),
                         updatedAt: new Date(student.updatedAt)
                     }
                 });
             }
        }
        console.log('✅ Students migrated');

        // 3. Events
        console.log('Migrating Events...');
        const events = db.prepare('SELECT * FROM Event').all() as any[];
        console.log(`Found ${events.length} events`);
        
        for (const event of events) {
             const exists = await prisma.event.findUnique({ where: { id: event.id } });
             if (!exists) {
                 await prisma.event.create({
                     data: {
                         id: event.id,
                         name: event.name,
                         description: event.description,
                         deadline: new Date(event.deadline),
                         cost: event.cost,
                         paymentOptions: event.paymentOptions,
                         qrCodeUrl: event.qrCodeUrl,
                         category: event.category,
                         createdAt: new Date(event.createdAt),
                         updatedAt: new Date(event.updatedAt)
                     }
                 });
             }
        }
        console.log('✅ Events migrated');

        // 4. QrCodes
        try {
            console.log('Migrating QrCodes...');
            const qrcodes = db.prepare('SELECT * FROM QrCode').all() as any[];
            console.log(`Found ${qrcodes.length} qrcodes`);
            
            for (const qr of qrcodes) {
                const exists = await prisma.qrCode.findUnique({ where: { id: qr.id } });
                if (!exists) {
                    await prisma.qrCode.create({
                        data: {
                            id: qr.id,
                            name: qr.name,
                            url: qr.url
                        }
                    });
                }
            }
            console.log('✅ QrCodes migrated');
        } catch (e) {
            console.log('⚠️ Skipping QrCodes (table might not exist)');
        }

        // 5. Payments (Depends on Student & Event)
        console.log('Migrating Payments...');
        const payments = db.prepare('SELECT * FROM Payment').all() as any[];
        console.log(`Found ${payments.length} payments`);
        
        // Batch payments for speed? Doing one by one for safety due to relations
        let successCount = 0;
        let skipCount = 0;

        for (const payment of payments) {
             const exists = await prisma.payment.findUnique({ where: { id: payment.id } });
             if (!exists) {
                 // Verify relations exist
                 const studentExists = await prisma.student.findUnique({ where: { id: payment.studentId } });
                 const eventExists = await prisma.event.findUnique({ where: { id: payment.eventId } });

                 if (studentExists && eventExists) {
                    await prisma.payment.create({
                        data: {
                            id: payment.id,
                            amount: payment.amount,
                            paymentDate: new Date(payment.paymentDate),
                            transactionId: payment.transactionId,
                            status: payment.status,
                            paymentMethod: payment.paymentMethod,
                            screenshotUrl: payment.screenshotUrl,
                            razorpay_order_id: payment.razorpay_order_id,
                            isManualEntry: Boolean(payment.isManualEntry),
                            recordedBy: payment.recordedBy,
                            manualEntryNotes: payment.manualEntryNotes,
                            receiptNumber: payment.receiptNumber,
                            studentId: payment.studentId,
                            eventId: payment.eventId,
                            createdAt: new Date(payment.createdAt),
                            updatedAt: new Date(payment.updatedAt)
                        }
                    });
                    successCount++;
                 } else {
                     console.log(`Skipping payment ${payment.id}: Missing relation`);
                     skipCount++;
                 }
             }
        }
        console.log(`✅ Payments migrated: ${successCount} success, ${skipCount} skipped`);

        // 6. PrintDistribution
         console.log('Migrating PrintDistributions...');
         try {
            const prints = db.prepare('SELECT * FROM PrintDistribution').all() as any[];
            console.log(`Found ${prints.length} print records`);
            
            for (const print of prints) {
                const exists = await prisma.printDistribution.findUnique({ where: { id: print.id } });
                if (!exists) {
                     // Verify relations
                     const studentExists = await prisma.student.findUnique({ where: { id: print.studentId } });
                     const eventExists = await prisma.event.findUnique({ where: { id: print.eventId } });
                     
                     if (studentExists && eventExists) {
                        await prisma.printDistribution.create({
                            data: {
                                id: print.id,
                                distributedAt: new Date(print.distributedAt),
                                studentId: print.studentId,
                                eventId: print.eventId
                            }
                        });
                     }
                }
            }
            console.log('✅ PrintDistributions migrated');
         } catch (e) {
             console.log('⚠️ No PrintDistribution table or error');
         }

        console.log('🎉 Migration Complete!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        db.close();
        await prisma.$disconnect();
    }
}

migrate();
