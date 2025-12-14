'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getEvents() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        payments: true,
      }
    });
    
    // Calculate totals manually since we are fetching relations anyway
    const eventsWithStats = events.map(event => {
      const totalCollected = event.payments
        .filter(p => p.status === 'Paid')
        .reduce((acc, p) => acc + p.amount, 0);
        
      return {
        ...event,
        totalCollected,
        deadline: event.deadline.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        paymentOptions: JSON.parse(event.paymentOptions),
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
