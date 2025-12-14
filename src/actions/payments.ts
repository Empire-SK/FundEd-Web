'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getEventPayments(eventId: string) {
  try {
    const [event, transactions] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.payment.findMany({
        where: { eventId },
        include: { student: true },
        orderBy: { paymentDate: 'desc' }
      })
    ]);

    if (!event) return { success: false, error: 'Event not found' };

    const mappedTransactions = transactions.map(t => ({
      ...t,
      studentName: t.student.name,
      studentRoll: t.student.rollNo,
      paymentDate: t.paymentDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return { 
      success: true, 
      data: {
        event: { ...event, deadline: event.deadline.toISOString(), createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString(), paymentOptions: JSON.parse(event.paymentOptions) },
        transactions: mappedTransactions
      }
    };
  } catch (error) {
    console.error('Error fetching event payments:', error);
    return { success: false, error: 'Failed to fetch payments' };
  }
}

export async function updatePaymentStatus(id: string, status: string) {
  try {
    const payment = await prisma.payment.update({
      where: { id },
      data: { status },
      include: { student: true, event: true }
    });
    
    revalidatePath(`/dashboard/events/${payment.eventId}/payments`);
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error: 'Failed to update payment status' };
  }
}
