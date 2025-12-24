'use server'

import prisma from '@/lib/db';

export async function getStudentPublicStatus(query: string) {
  try {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { rollNo: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { participatingEvents: true },
      take: 20 // Limit results for performance
    });

    if (!students || students.length === 0) {
      return { success: false, error: 'No students found matching your search.' };
    }

    // Process each student
    const results = await Promise.all(students.map(async (student) => {
        // Fetch payments for this student
        const transactions = await prisma.payment.findMany({
            where: { studentId: student.id },
            include: { event: true },
            orderBy: { paymentDate: 'desc' }
        });

        // Calculate Summary
        const eventMap = new Map();

        student.participatingEvents.forEach(event => {
            eventMap.set(event.id, {
                eventName: event.name,
                eventCost: event.cost,
                totalPaid: 0,
                status: 'Unpaid'
            });
        });

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

        return {
            student: {
                id: student.id,
                name: student.name,
                rollNo: student.rollNo,
                class: student.class,
            },
            paymentSummary
        };
    }));

    return { 
      success: true, 
      data: results
    };

  } catch (error) {
    console.error('Error fetching public student status:', error);
    return { success: false, error: 'Failed to retrieve details. Please try again.' };
  }
}
