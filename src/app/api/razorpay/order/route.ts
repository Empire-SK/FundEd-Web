
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';

const orderSchema = z.object({
  amount: z.number().positive(),
  eventId: z.string(),
  studentId: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json();

  const validation = orderSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
  }

  const { amount, eventId, studentId } = validation.data;

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency: 'INR',
    receipt: `receipt_event_${eventId}_student_${studentId}`,
    notes: {
        eventId,
        studentId,
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}
