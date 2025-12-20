import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('Razorpay webhook secret not configured (RAZORPAY_WEBHOOK_SECRET is missing)');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const text = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(text);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(text);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      // Find payment by razorpay_order_id
      const payment = await prisma.payment.findFirst({
        where: { razorpay_order_id: orderId }
      });

      if (!payment) {
        console.error('No payment document found for order_id:', orderId);
        return NextResponse.json({ error: 'Payment document not found' }, { status: 404 });
      }

      // Update the payment doc
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: 'Paid',
            transactionId: paymentEntity.id,
        }
      });

      console.log(`Payment ${payment.id} updated to Paid for order ${orderId}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
