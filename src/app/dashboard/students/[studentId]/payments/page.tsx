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
import { ArrowLeft } from 'lucide-react';
import type { Transaction, Student } from '@/lib/types';
import { BrandedLoader } from '@/components/ui/branded-loader';
import { useState, useEffect } from 'react';
import { getStudentPayments } from '@/actions/student-payments';
import { useToast } from '@/hooks/use-toast';

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

export default function StudentPaymentsPage() {
  const { studentId } = useParams();
  const studentIdStr = studentId as string;
  const { toast } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      const res = await getStudentPayments(studentIdStr);
      if (res.success && res.data) {
        setStudent(res.data.student as unknown as Student);
        setTransactions(res.data.transactions as unknown as Transaction[]);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch payments' });
      }
      setIsLoading(false);
    };
    if (studentIdStr) {
      fetchPayments();
    }
  }, [studentIdStr]);


  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <BrandedLoader />
      </Card>
    )
  }

  if (!student) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The student you are looking for does not exist.</p>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link href="/dashboard/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/students">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <CardTitle>Payments for {student.name}</CardTitle>
            <CardDescription>
              A list of all transactions made by this student.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="grid gap-4 md:hidden">
          {transactions?.map(transaction => (
            <Card key={transaction.id} className="w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-code">{transaction.id}</CardTitle>
                    <CardDescription>{transaction.eventName}</CardDescription>
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
                <TableHead className="text-center">Event</TableHead>
                <TableHead className="text-center">Amount</TableHead>
                <TableHead className="text-center">Date</TableHead>
                <TableHead className="text-center">Method</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-code text-center">{transaction.id}</TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{transaction.eventName}</div>
                  </TableCell>
                  <TableCell className="text-center">₹{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{formatDate(transaction.paymentDate)}</TableCell>
                  <TableCell className="text-center">{transaction.paymentMethod}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <StatusBadge status={transaction.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {transactions?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No payments found for this student.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
