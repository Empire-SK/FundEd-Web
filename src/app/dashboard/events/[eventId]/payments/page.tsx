'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, DollarSign } from 'lucide-react';
import type { Transaction, Event, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { sendPaymentApprovedEmail } from '@/app/actions';
import { PageLoader } from '@/components/ui/page-loader';
import { useEffect, useState } from 'react';
import { getEventPayments, updatePaymentStatus } from '@/actions/payments';
import { getStudents } from '@/actions/students';
import { RecordCashPaymentDialog } from '@/components/record-cash-payment-dialog';

const getStatusBadgeVariant = (status: Transaction['status']) => {
  switch (status) {
    case 'Paid':
      return 'paid';
    case 'Pending':
      return 'pending';
    case 'Failed':
      return 'failed';
    case 'Verification Pending':
      return 'verification';
    default:
      return 'default';
  }
};

export default function EventPaymentsPage() {
  const { eventId } = useParams();
  const { toast } = useToast();
  const eventIdStr = eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    const res = await getEventPayments(eventIdStr);
    if (res.success && res.data) {
      setEvent(res.data.event as unknown as Event);
      setTransactions(res.data.transactions as unknown as Transaction[]);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch payments' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (eventIdStr) {
        await fetchPayments();
        console.log('🔍 Fetching students...');
        try {
          const studentsRes = await getStudents();
          console.log('✅ Students response:', studentsRes);
          if (studentsRes.success && studentsRes.students) {
            console.log('✅ Setting students:', studentsRes.students);
            setStudents(studentsRes.students as unknown as Student[]);
          } else {
            console.log('❌ No students found or error:', studentsRes);
          }
        } catch (error) {
          console.error('❌ Error fetching students:', error);
        }
      }
    };
    fetchData();
  }, [eventIdStr]);

  const handlePaymentAction = async (transaction: Transaction, newStatus: 'Paid' | 'Failed') => {
    const res = await updatePaymentStatus(transaction.id, newStatus);

    if (res.success) {
      toast({
        title: "Payment Status Updated",
        description: `Transaction ${transaction.id} has been marked as ${newStatus}.`
      });

      fetchPayments();

      if (newStatus === 'Paid' && event && res.data) {
        const student = res.data.student;
        if (student) {
          // Fire-and-forget
          sendPaymentApprovedEmail({
            studentName: student.name,
            studentEmail: student.email,
            eventName: event.name,
            amount: transaction.amount,
          });
          toast({
            title: "Approval Email Queued",
            description: `An email will be sent to ${student.name} confirming their payment.`,
          });
        }
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' });
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <PageLoader message="Fetching transaction details..." />
      </Card>
    )
  }

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The event you are looking for does not exist.</p>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link href="/dashboard/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
    const variant = getStatusBadgeVariant(status);
    return (
      <Badge variant={variant as any}>
        {status}
      </Badge>
    );
  };

  const PaymentActions = ({ transaction }: { transaction: Transaction }) => {
    if (transaction.status !== 'Verification Pending') return null;

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
          onClick={() => handlePaymentAction(transaction, 'Paid')}>
          <Check className="h-4 w-4" />
          <span className="sr-only">Confirm</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          onClick={() => handlePaymentAction(transaction, 'Failed')}>
          <X className="h-4 w-4" />
          <span className="sr-only">Reject</span>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/events">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Payments for {event.name}</h2>
            <p className="text-muted-foreground mt-1">
              Manage and track all transactions for this event
            </p>
          </div>
        </div>

        <RecordCashPaymentDialog
          students={students}
          events={[event]}
          payments={transactions}
          preSelectedEvent={event}
          onSuccess={fetchPayments}
          trigger={
            <Button className="gap-2 gradient-primary">
              <DollarSign className="h-4 w-4" />
              Record Cash Payment
            </Button>
          }
        />
      </div>

      {/* Transactions Card */}
      <Card className="glass-card shadow-md hover-lift">
        <CardContent className="pt-6">
          {/* Mobile View */}
          <div className="grid gap-4 md:hidden">
            {transactions?.map(transaction => (
              <Card key={transaction.id} className="w-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-code">
                        {transaction.id.startsWith('pending_') ? 'BALANCE DUE' : transaction.id}
                      </CardTitle>
                      <CardDescription>{transaction.studentName} ({transaction.studentRoll})</CardDescription>
                    </div>
                    <StatusBadge status={transaction.status} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">₹{transaction.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span>{formatDate(transaction.paymentDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Method</span>
                    <span>{transaction.paymentMethod}</span>
                  </div>
                  {transaction.status === 'Verification Pending' && (
                    <div className="flex items-center justify-between text-sm pt-4 border-t">
                      <span className="text-muted-foreground">Actions</span>
                      <PaymentActions transaction={transaction} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Transaction ID</TableHead>
                  <TableHead className="text-center">Student</TableHead>
                  <TableHead className="text-center">Amount</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Method</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-code text-center">
                      {transaction.id.startsWith('pending_') ? <span className="text-muted-foreground italic">BALANCE DUE</span> : transaction.id}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{transaction.studentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.studentRoll}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">₹{transaction.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{formatDate(transaction.paymentDate)}</TableCell>
                    <TableCell className="text-center">{transaction.paymentMethod}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <StatusBadge status={transaction.status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <PaymentActions transaction={transaction} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {transactions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No payments found for this event.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
