'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getQrCodes() {
  try {
    const qrCodes = await prisma.qrCode.findMany();
    return { success: true, data: qrCodes };
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return { success: false, error: 'Failed to fetch QR codes' };
  }
}

export async function addQrCode(data: { name: string; url: string }) {
  try {
    const qrCode = await prisma.qrCode.create({
      data,
    });
    revalidatePath('/dashboard/settings');
    return { success: true, data: qrCode };
  } catch (error) {
    console.error('Error adding QR code:', error);
    return { success: false, error: 'Failed to add QR code' };
  }
}

export async function deleteQrCode(id: string) {
  try {
    await prisma.qrCode.delete({
      where: { id },
    });
    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return { success: false, error: 'Failed to delete QR code' };
  }
}
