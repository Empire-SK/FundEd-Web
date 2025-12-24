'use server'

import prisma from '@/lib/db';

export async function getStudentPayments(studentId: string) {
  try {
    const [student, transactions] = await Promise.all([
      prisma.student.findUnique({ 
        where: { id: studentId },
        include: { participatingEvents: true } 
      }),
      prisma.payment.findMany({
        where: { studentId },
        include: { event: true },
        orderBy: { paymentDate: 'desc' }
      })
    ]);

    if (!student) return { success: false, error: 'Student not found' };

    // Calculate Summary per Event
    const eventMap = new Map();

    // 1. Add all participating events
    student.participatingEvents.forEach(event => {
      eventMap.set(event.id, {
        eventName: event.name,
        eventCost: event.cost,
        totalPaid: 0,
        status: 'Unpaid'
      });
    });

    // 2. Process transactions to update paid amounts and add non-participating events if any
    transactions.forEach(t => {
      if (t.status === 'Paid') {
        const current = eventMap.get(t.eventId) || {
          eventName: t.event.name,
          eventCost: t.event.cost,
          totalPaid: 0,
          status: 'Unpaid'
        };
        current.totalPaid += t.amount;
        eventMap.set(t.eventId, current);
      }
    });

    // 3. Finalize Status
    const paymentSummary = Array.from(eventMap.values()).map(summary => {
      const pending = summary.eventCost - summary.totalPaid;
      let status = 'Unpaid';
      if (summary.totalPaid >= summary.eventCost && summary.eventCost > 0) status = 'Fully Paid';
      else if (summary.totalPaid > 0) status = 'Partially Paid';
      
      return {
        ...summary,
        pendingAmount: Math.max(0, pending)
      };
    });

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
        transactions: mappedTransactions,
        paymentSummary
      }
    };
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return { success: false, error: 'Failed to fetch payments' };
  }
}
