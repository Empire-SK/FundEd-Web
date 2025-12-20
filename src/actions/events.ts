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
          payments: true,
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
    await prisma.event.delete({
      where: { id },
    });
    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: 'Failed to delete event' };
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
