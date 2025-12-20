'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getEventPayments(eventId: string) {
  try {
    const [event, transactions] = await Promise.all([
      prisma.event.findUnique({ 
        where: { id: eventId },
        include: { participants: true }
      }),
      prisma.payment.findMany({
        where: { eventId },
        include: { student: true },
        orderBy: { paymentDate: 'desc' }
      }),
    ]);

    if (!event) return { success: false, error: 'Event not found' };

    // Map real transactions
    const realTransactions = transactions.map(t => ({
      ...t,
      studentName: t.student.name,
      studentRoll: t.student.rollNo,
      paymentDate: t.paymentDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    // Generate virtual "Pending" transactions for balances
    const studentsToCheck = event.participants || [];
    const virtualTransactions = studentsToCheck.reduce((acc: any[], student) => {
      // Filter transactions for this student
      // We only consider 'Paid' or 'Verification Pending' as potentially covering the cost? 
      // Actually strictly speaking, 'Paid' covers cost. 'Verification Pending' is also usually treated as "money sent but not verified".
      // Let's count 'Paid' towards reducing the balance. 
      // If we count 'Verification Pending', it might be confusing if it gets rejected.
      // Standard practice: Only 'Paid' reduces the "Pending Balance" shown? 
      // OR: Maybe show "Pending Balance" as (Cost - Paid). 
      // Let's stick to: Balance = Cost - (Sum of 'Paid' amounts).
      
      const studentPaidTransactions = transactions.filter(t => t.studentId === student.id && t.status === 'Paid');
      const totalPaid = studentPaidTransactions.reduce((sum, t) => sum + t.amount, 0);
      const balance = event.cost - totalPaid;

      if (balance > 0) {
        // Create virtual transaction
        acc.push({
          id: `pending_${student.id}_${event.id}`, // Virtual ID
          studentId: student.id,
          eventId: event.id,
          amount: balance,
          paymentDate: new Date().toISOString(), // Show current date or maybe event deadline? Current date for sorting to top is fine/or bottom.
          transactionId: 'N/A',
          status: 'Pending',
          paymentMethod: 'N/A',
          screenshotUrl: null,
          razorpay_order_id: null,
          isManualEntry: false,
          recordedBy: null,
          manualEntryNotes: null,
          receiptNumber: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          studentName: student.name,
          studentRoll: student.rollNo,
        });
      }
      return acc;
    }, []);

    // Combine and sort
    // We might want pending items at the top or bottom? 
    // Usually pending items are "To Do", so maybe top? 
    // Or just mix them by date. Since virtual date is "now", they will appear at top if sorted desc.
    const allTransactions = [...virtualTransactions, ...realTransactions].sort((a, b) => {
      return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    });

    return { 
      success: true, 
      data: {
        event: { ...event, deadline: event.deadline.toISOString(), createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString(), paymentOptions: JSON.parse(event.paymentOptions) },
        transactions: allTransactions
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
