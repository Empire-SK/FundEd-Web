
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Linking existing students to events...');
  
  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: { participants: true }
      }
    }
  });

  const allStudents = await prisma.student.findMany({ select: { id: true } });
  
  if (allStudents.length === 0) {
      console.log('No students found to link.');
      return;
  }

  const studentIds = allStudents.map(s => ({ id: s.id }));

  for (const event of events) {
    if (event._count.participants === 0) {
      console.log(`Linking ${allStudents.length} students to event: ${event.name}`);
      await prisma.event.update({
        where: { id: event.id },
        data: {
          participants: {
            connect: studentIds
          }
        }
      });
    } else {
        console.log(`Event ${event.name} already has ${event._count.participants} participants.`);
    }
  }
  
  console.log('✅ Done linking students!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
