'use server'

import prisma from '@/lib/db';

export async function getStudentPayments(studentId: string) {
  try {
    const [student, transactions] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.payment.findMany({
        where: { studentId },
        include: { event: true },
        orderBy: { paymentDate: 'desc' }
      })
    ]);

    if (!student) return { success: false, error: 'Student not found' };

    const mappedTransactions = transactions.map(t => ({
      ...t,
      eventName: t.event.name,
      paymentDate: t.paymentDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return { 
      success: true, 
      data: {
        student,
        transactions: mappedTransactions
      }
    };
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return { success: false, error: 'Failed to fetch payments' };
  }
}
