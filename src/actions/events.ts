'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getEvents() {
  try {
    const [events, globalTotalStudents] = await Promise.all([
      prisma.event.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          payments: {
            select: {
              amount: true,
              status: true,
              studentId: true, // Needed for distinct count if strict
            }
          },
          _count: {
            select: { participants: true }
          },
          participants: {
            select: { id: true }
          }
        }
      }),
      prisma.student.count(),
    ]);
    
    // Calculate totals
    const eventsWithStats = events.map(event => {
      const totalCollected = event.payments
        .filter(p => p.status === 'Paid')
        .reduce((acc, p) => acc + p.amount, 0);

      // Use event-specific participant count if available (via relation), else fallback
      // Since we migrated, this should be accurate.
      const participantCount = event._count.participants > 0 
          ? event._count.participants 
          : 0; // If 0, it means 0 selected. Migration ensures legacy events have all.
      
      const expectedCollection = event.cost * participantCount;
      const totalPending = Math.max(0, expectedCollection - totalCollected);
        
      return {
        ...event,
        totalCollected,
        totalPending,
        participantCount,
        paidCount: event.payments.filter(p => p.status === 'Paid').length,
        pendingCount: Math.max(0, participantCount - event.payments.filter(p => p.status === 'Paid').length),
        deadline: event.deadline.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        paymentOptions: JSON.parse(event.paymentOptions),
        participantIds: event.participants.map(p => p.id), // Send IDs for edit form
      };
    });

    return { success: true, data: eventsWithStats };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function createEvent(data: {
  name: string;
  description: string;
  cost: number;
  deadline: string;
  paymentOptions: string[];
  qrCodeUrl?: string;
  category: string;
  selectedStudents: string[];
}) {
  try {
    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        cost: data.cost,
        deadline: new Date(data.deadline),
        paymentOptions: JSON.stringify(data.paymentOptions),
        qrCodeUrl: data.qrCodeUrl,
        category: data.category,
        status: 'PUBLISHED',
        participants: {
             connect: data.selectedStudents.map(id => ({ id }))
        }
      },
    });
    revalidatePath('/dashboard/events');
    return { success: true, data: event };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

export async function saveDraft(data: {
  id?: string;
  name?: string;
  description?: string;
  cost?: number;
  deadline?: string;
  paymentOptions?: string[];
  qrCodeUrl?: string;
  category?: string;
  selectedStudents?: string[];
}) {
  try {
    const eventData: any = {
      status: 'DRAFT',
    };

    if (data.name) eventData.name = data.name;
    if (data.description) eventData.description = data.description;
    if (data.cost !== undefined) eventData.cost = data.cost;
    if (data.deadline) eventData.deadline = new Date(data.deadline);
    if (data.paymentOptions) eventData.paymentOptions = JSON.stringify(data.paymentOptions);
    if (data.qrCodeUrl !== undefined) eventData.qrCodeUrl = data.qrCodeUrl;
    if (data.category) eventData.category = data.category;
    
    let event;
    if (data.id) {
      if (data.selectedStudents) {
        eventData.participants = {
          set: data.selectedStudents.map(id => ({ id }))
        };
      }
      event = await prisma.event.update({
        where: { id: data.id },
        data: eventData,
      });
    } else {
      if (data.selectedStudents) {
        eventData.participants = {
          connect: data.selectedStudents.map(id => ({ id }))
        };
      }
      event = await prisma.event.create({
        data: eventData,
      });
    }

    revalidatePath('/dashboard/events');
    return { success: true, data: event };
  } catch (error) {
    console.error('Error saving draft:', error);
    return { success: false, error: `Failed to save draft: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateEvent(id: string, data: {
  name: string;
  description: string;
  cost: number;
  deadline: string;
  paymentOptions: string[];
  qrCodeUrl?: string;
  category: string;
  selectedStudents: string[];
}) {
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        cost: data.cost,
        deadline: new Date(data.deadline),
        paymentOptions: JSON.stringify(data.paymentOptions),
        qrCodeUrl: data.qrCodeUrl,
        category: data.category,
        status: 'PUBLISHED', // Explicitly publish when fully updated
        participants: {
             set: data.selectedStudents.map(id => ({ id }))
        }
      },
    });
    revalidatePath('/dashboard/events');
    return { success: true, data: event };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: 'Failed to update event' };
  }
}

export async function deleteEvent(id: string) {
  try {
    // We use a transaction to ensure all related records are deleted
    // This is a safety measure in case cascade delete is not working or there are other constraints
    await prisma.$transaction(async (tx) => {
      // 1. Delete payments
      await tx.payment.deleteMany({
        where: { eventId: id }
      });

      // 2. Delete print distributions
      await tx.printDistribution.deleteMany({
        where: { eventId: id }
      });

      // 3. Delete the event (implicit M-N will be handled by Prisma)
      await tx.event.delete({
        where: { id },
      });
    });

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: 'Failed to delete event. Please check if there are unrelated records linked.' };
  }
}

export async function getQrCodes() {
    try {
        const qrCodes = await prisma.qrCode.findMany();
        return { success: true, data: qrCodes };
    } catch (error) {
        console.error('Error fetching QR codes:', error);
        return { success: false, error: 'Failed to fetch QR codes' };
    }
}
