'use server'

import prisma from '@/lib/db';

export async function getPendingTransactions() {
  try {
    const transactions = await prisma.payment.findMany({
      where: { status: 'Verification Pending' },
      include: {
        student: true,
        event: true,
      }
    });

    const mappedTransactions = transactions.map(t => ({
      ...t,
      studentName: t.student.name,
      studentRoll: t.student.rollNo,
      eventName: t.event.name,
      paymentDate: t.paymentDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return { success: true, data: mappedTransactions };
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return { success: false, error: 'Failed to fetch pending transactions' };
  }
}
