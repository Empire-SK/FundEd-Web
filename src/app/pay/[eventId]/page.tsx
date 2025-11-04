
'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Check, ChevronsUpDown, QrCode as QrCodeIcon, Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, Timestamp, query, where, addDoc } from 'firebase/firestore';
import type { Event, Student, Payment } from '@/lib/types';
import { sendPaymentConfirmationEmail } from '@/app/actions';
import { BrandedLoader } from '@/components/ui/branded-loader';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PaymentPage() {
  const { eventId } = useParams();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const firestore = useFirestore();
  const eventIdStr = eventId as string;

  const [selectedMethod, setSelectedMethod] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const eventRef = useMemoFirebase(() => firestore && classId && eventIdStr ? doc(firestore, `classes/${classId}/events`, eventIdStr) : null, [firestore, classId, eventIdStr]);
  const { data: event, isLoading: isEventLoading } = useDoc<Event>(eventRef);

  const studentsRef = useMemoFirebase(() => firestore && classId ? collection(firestore, `classes/${classId}/students`) : null, [firestore, classId]);
  const { data: allStudents, isLoading: areStudentsLoading } = useCollection<Student>(studentsRef);

  const paymentsQuery = useMemoFirebase(() => firestore && classId && eventIdStr ? query(collection(firestore, `classes/${classId}/payments`), where('eventId', '==', eventIdStr)) : null, [firestore, classId, eventIdStr]);
  const { data: payments, isLoading: arePaymentsLoading } = useCollection<Payment>(paymentsQuery);

  const paidStudentIds = useMemo(() => {
    if (!payments) return new Set();
    // Includes students who have paid or have a pending verification
    return new Set(payments.filter(p => p.status === 'Paid' || p.status === 'Verification Pending').map(p => p.studentId));
  }, [payments]);

  const availableStudents = useMemo(() => {
      if (!allStudents) return [];
      return allStudents.filter(student => !paidStudentIds.has(student.id));
  }, [allStudents, paidStudentIds])

  const filteredStudents = useMemo(() => {
    if (!availableStudents) return [];
    if (!searchValue) return availableStudents;
    return availableStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, availableStudents]);


  if (isEventLoading || areStudentsLoading || arePaymentsLoading || !classId) {
    return <BrandedLoader />;
  }
  
  if (!event) {
    return <BrandedLoader />;
  }

  const getButtonText = () => {
    if (isSubmitting) {
        return <Loader2 className="h-5 w-5 animate-spin" />
    }
    if (!selectedMethod) return `Pay ₹${event.cost.toLocaleString()}`;
    switch (selectedMethod) {
      case 'razorpay':
        return `Pay ₹${event.cost.toLocaleString()} with Razorpay`;
      case 'qr':
        return 'Show QR Code & Pay';
      case 'cash':
        return 'Submit for Verification';
      default:
        return `Pay ₹${event.cost.toLocaleString()}`;
    }
  };

  const createPendingPayment = async (orderId: string) => {
    if (!selectedStudent || !classId || !firestore) return null;

    const paymentData: Omit<Payment, 'id' | 'paymentDate'> = {
      studentId: selectedStudent.id,
      eventId: event.id,
      amount: event.cost,
      transactionId: 'N/A', // Will be updated by webhook
      status: 'Pending', // Initial status
      eventName: event.name,
      studentName: selectedStudent.name,
      studentRoll: selectedStudent.rollNo,
      paymentMethod: 'Razorpay',
      screenshotUrl: '',
      razorpay_order_id: orderId,
    };
    
    const newPayment = { ...paymentData, paymentDate: serverTimestamp() };
    const docRef = await addDoc(collection(firestore, `classes/${classId}/payments`), newPayment);
    return docRef.id;
  };


  const handleRazorpayPayment = async () => {
    if (!selectedStudent || !event) return;
    setIsSubmitting(true);

    try {
      // 1. Create Order
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: event.cost,
          eventId: event.id,
          studentId: selectedStudent.id,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const order = await orderResponse.json();
      
      // 2. Create pending payment document in Firestore
      await createPendingPayment(order.id);

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'FundEd',
        description: `Payment for ${event.name}`,
        order_id: order.id,
        handler: function (response: any) {
          // This part is mostly for UX. The webhook is the source of truth.
          sendPaymentConfirmationEmail({
              studentName: selectedStudent.name,
              studentEmail: selectedStudent.email,
              eventName: event.name,
              amount: event.cost,
              paymentMethod: 'Razorpay',
          });
          setShowSuccessDialog(true);
        },
        prefill: {
          name: selectedStudent.name,
          email: selectedStudent.email,
        },
        notes: {
            eventId: event.id,
            studentId: selectedStudent.id,
            classId: classId,
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: response.error.description || 'Something went wrong.'
        });
        // Optionally update the payment doc to 'Failed' here
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not initiate payment. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }


  const handleOtherPaymentSubmission = async (paymentMethod: 'QR Scan' | 'Cash', status: 'Verification Pending') => {
    if (!selectedStudent || !classId || !firestore) return;
    setIsSubmitting(true);
    
    const paymentData: Omit<Payment, 'id' | 'paymentDate'> = {
      studentId: selectedStudent.id,
      eventId: event.id,
      amount: event.cost,
      transactionId: `${paymentMethod.replace(' ', '')}_${Date.now()}`,
      status: status,
      eventName: event.name,
      studentName: selectedStudent.name,
      studentRoll: selectedStudent.rollNo,
      paymentMethod: paymentMethod,
      screenshotUrl: ''
    };
    
    const newPayment = { ...paymentData, paymentDate: serverTimestamp() };
    await addDoc(collection(firestore, `classes/${classId}/payments`), newPayment);

    sendPaymentConfirmationEmail({
        studentName: selectedStudent.name,
        studentEmail: selectedStudent.email,
        eventName: event.name,
        amount: event.cost,
        paymentMethod,
    });

    setShowSuccessDialog(true);
    setIsSubmitting(false);
  }

  const handlePayClick = () => {
    if (isSubmitting) return;

    if (selectedMethod === 'razorpay') {
        handleRazorpayPayment();
    } else if (selectedMethod === 'qr') {
      if (event.qrCodeUrl) {
        setShowQrDialog(true);
      } else {
        toast({
          variant: "destructive",
          title: "QR Code Not Available",
          description: "The class representative has not uploaded a QR code for this event."
        })
      }
    } else if (selectedMethod === 'cash') {
      handleOtherPaymentSubmission('Cash', 'Verification Pending');
    }
  };

  const handleSubmitQrPayment = async () => {
    if (isSubmitting) return;
    setShowQrDialog(false);
    await handleOtherPaymentSubmission('QR Scan', 'Verification Pending');
  }


  return (
    <>
    <div className="flex min-h-screen flex-col items-center bg-muted/40">
      <header className="w-full px-4 py-6">
        <nav className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline text-foreground">FundEd</span>
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 w-full container mx-auto py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">{event.name}</CardTitle>
            <CardDescription>{event.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">Amount Due</span>
              <span className="font-bold text-2xl text-primary">₹{event.cost.toLocaleString()}</span>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="student">Select Student</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedStudent
                        ? `${selectedStudent.name} (${selectedStudent.rollNo})`
                        : 'Select student...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search by name or roll no..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                       <CommandList>
                        <CommandEmpty>No student found or all have paid.</CommandEmpty>
                        <CommandGroup>
                          {filteredStudents.map((student) => (
                            <CommandItem
                              key={student.id}
                              value={`${student.name} ${student.rollNo}`}
                              onSelect={() => {
                                setSelectedStudent(student);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedStudent?.id === student.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.rollNo} • {student.email}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedStudent && (
                 <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Full Name</span>
                        <span>{selectedStudent.name}</span>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Roll Number</span>
                        <span>{selectedStudent.rollNo}</span>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Email</span>
                        <span>{selectedStudent.email}</span>
                    </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select onValueChange={setSelectedMethod} disabled={!selectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.paymentOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" disabled={!selectedStudent || !selectedMethod || isSubmitting} onClick={handlePayClick}>
              {getButtonText()}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>

    <AlertDialog open={showQrDialog} onOpenChange={setShowQrDialog}>
      <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-6 w-6" />
              Scan to Pay
            </AlertDialogTitle>
            <AlertDialogDescription>
              Use any UPI app to scan the QR code below to pay ₹{event.cost.toLocaleString()} for {event.name}.
              After paying, click the submit button below for verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center p-4">
            <Image
              src={event.qrCodeUrl!}
              alt="QR Code"
              width={250}
              height={250}
              className="rounded-lg border"
            />
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowQrDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitQrPayment} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit for Verification
            </Button>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center">Payment Submitted!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your payment has been submitted. You will receive an email confirmation shortly. If paid via Razorpay, your status will update automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <AlertDialogAction asChild>
                <Link href="/">Go to Homepage</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
