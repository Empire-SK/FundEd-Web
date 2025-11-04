
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { initializeFirebase } from '@/firebase/server-init';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// This is required to initialize the admin app on the server
const { firestore } = initializeFirebase();

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  
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
      
      const { eventId, studentId, classId } = paymentEntity.notes;

      if (!classId || !eventId || !studentId) {
        console.warn('Webhook received for order without required notes:', orderId);
        return NextResponse.json({ status: 'ignored', reason: 'Missing required notes' });
      }

      // Find the payment document by razorpay_order_id
      const paymentsRef = collection(firestore, `classes/${classId}/payments`);
      const q = query(paymentsRef, where('razorpay_order_id', '==', orderId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('No payment document found for order_id:', orderId);
        return NextResponse.json({ error: 'Payment document not found' }, { status: 404 });
      }

      const paymentDoc = querySnapshot.docs[0];
      const paymentRef = doc(firestore, `classes/${classId}/payments`, paymentDoc.id);

      await updateDoc(paymentRef, {
        status: 'Paid',
        transactionId: paymentEntity.id,
      });

      console.log(`Payment ${paymentDoc.id} updated to Paid for order ${orderId}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
