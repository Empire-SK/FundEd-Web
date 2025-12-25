'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPrintData() {
  try {
    const [events, distributions, payments, students] = await Promise.all([
      prisma.event.findMany({
        where: { category: 'Print' },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.printDistribution.findMany({
        include: {
          student: true,
          event: true,
        },
        orderBy: { distributedAt: 'desc' }
      }),
      prisma.payment.findMany({
        where: {
          event: { category: 'Print' },
          status: 'Paid'
        },
        include: {
          student: true,
          event: true,
        }
      }),
      prisma.student.findMany({
        orderBy: { name: 'asc' }
      })
    ]);

    return {
      success: true,
      data: {
        events: events.map(e => ({
          ...e,
          deadline: e.deadline.toISOString(),
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
        distributions: distributions.map(d => ({
          ...d,
          studentName: d.student.name,
          studentRoll: d.student.rollNo,
          distributedAt: d.distributedAt.toISOString(),
        })),
        payments: payments.map(p => ({
          ...p,
          paymentDate: p.paymentDate.toISOString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        students: students.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      }
    };
  } catch (error) {
    console.error('Error fetching print data:', error);
    return { success: false, error: 'Failed to fetch print data' };
  }
}

export async function distributePrint(data: {
  studentId: string;
  eventId: string;
}) {
  try {
    // Check if already distributed
    const existing = await prisma.printDistribution.findFirst({
      where: {
        studentId: data.studentId,
        eventId: data.eventId,
      }
    });

    if (existing) {
      return { success: false, error: 'Print already distributed to this student' };
    }

    const distribution = await prisma.printDistribution.create({
      data: {
        studentId: data.studentId,
        eventId: data.eventId,
      },
      include: {
        student: true,
        event: true,
      }
    });

    revalidatePath('/dashboard/prints');

    return {
      success: true,
      data: {
        ...distribution,
        distributedAt: distribution.distributedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Error distributing print:', error);
    return { success: false, error: 'Failed to distribute print' };
  }
}
