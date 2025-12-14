'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function recordCashPayment(data: {
  studentId: string;
  eventId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  receiptNumber?: string;
}) {
  try {
    // Get current user session for audit trail
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate student and event exist
    const [student, event] = await Promise.all([
      prisma.student.findUnique({ where: { id: data.studentId } }),
      prisma.event.findUnique({ where: { id: data.eventId } })
    ]);

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId: data.studentId,
        eventId: data.eventId,
        status: 'Paid'
      }
    });

    if (existingPayment) {
      return { success: false, error: 'Payment already recorded for this student and event' };
    }

    // Create manual payment entry
    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        eventId: data.eventId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        status: 'Paid',
        paymentMethod: 'Cash',
        transactionId: `CASH_${Date.now()}`,
        isManualEntry: true,
        recordedBy: session.userId,
        manualEntryNotes: data.notes,
        receiptNumber: data.receiptNumber,
      },
      include: {
        student: true,
        event: true,
      }
    });

    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard/students');
    revalidatePath(`/dashboard/events/${data.eventId}/payments`);

    return { 
      success: true, 
      data: {
        ...payment,
        paymentDate: payment.paymentDate.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Error recording cash payment:', error);
    return { success: false, error: 'Failed to record payment' };
  }
}

export async function getManualPayments() {
  try {
    const payments = await prisma.payment.findMany({
      where: { isManualEntry: true },
      include: {
        student: true,
        event: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: payments.map(p => ({
        ...p,
        paymentDate: p.paymentDate.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    };
  } catch (error) {
    console.error('Error fetching manual payments:', error);
    return { success: false, error: 'Failed to fetch manual payments' };
  }
}
