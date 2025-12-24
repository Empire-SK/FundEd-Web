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
import { PageLoader } from '@/components/ui/page-loader';
import { useState, useEffect } from 'react';
import { getStudentPayments } from '@/actions/student-payments';
import { GlassCard } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { Wallet, CheckCircle, AlertCircle, Clock, Share2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const [paymentSummary, setPaymentSummary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      const res = await getStudentPayments(studentIdStr);
      if (res.success && res.data) {
        setStudent(res.data.student as unknown as Student);
        setTransactions(res.data.transactions as unknown as Transaction[]);
        setPaymentSummary(res.data.paymentSummary || []);
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
    return <PageLoader message="Loading payments..." />;
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

  const handleCopyPublicLink = () => {
    const link = `${window.location.origin}/check-status`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Public Portal Link Copied',
      description: `Share this link. Student Roll No: ${student?.rollNo}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
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
          <Button variant="outline" size="sm" onClick={handleCopyPublicLink} className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share Portal</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Financial Overview / Event Balances */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Event Payment Status
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paymentSummary.map((summary, mbIndex) => {
              const progress = summary.eventCost > 0 ? (summary.totalPaid / summary.eventCost) * 100 : 0;
              return (
                <GlassCard key={mbIndex} className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium truncate" title={summary.eventName}>{summary.eventName}</h4>
                      <Badge variant={summary.status === 'Fully Paid' ? 'paid' : summary.status === 'Partially Paid' ? 'pending' : 'destructive'} className="mt-1">
                        {summary.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Cost</p>
                      <p className="font-semibold">₹{summary.eventCost.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Paid: ₹{summary.totalPaid.toLocaleString()}</span>
                      <span className={summary.pendingAmount > 0 ? "text-emerald-500 font-medium" : "text-green-500"}>
                        {summary.pendingAmount > 0 ? `Due: ₹${summary.pendingAmount.toLocaleString()}` : "Cleared"}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                </GlassCard>
              );
            })}
            {paymentSummary.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground bg-white/5 rounded-lg border border-dashed border-white/10">
                <p>No active event participations found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Transaction History
          </h3>
          {/* Mobile View */}
          <div className="grid gap-4 md:hidden">
            {transactions?.map(transaction => (
              <GlassCard key={transaction.id} className="w-full">
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
              </GlassCard>
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
        </div>
      </CardContent>
    </Card>
  );
}
