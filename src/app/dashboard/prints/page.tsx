'use client';

import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, PackageCheck, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Student, PrintDistribution, Event, Payment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { sendPrintDistributionEmail } from '@/app/actions';
import { getPrintData, distributePrint } from '@/actions/prints';
import { PageLoader } from '@/components/ui/page-loader';

export default function PrintsPage() {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [printEvents, setPrintEvents] = useState<Event[]>([]);
  const [distributions, setDistributions] = useState<PrintDistribution[]>([]);
  const [paidPayments, setPaidPayments] = useState<Payment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived filtered distributions for the history view
  const filteredDistributions = useMemo(() => {
    if (!selectedEventId || !distributions) return [];
    return distributions.filter(d => d.eventId === selectedEventId);
  }, [distributions, selectedEventId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const res = await getPrintData();
      if (res.success && res.data) {
        setPrintEvents(res.data.events as unknown as Event[]);
        if (selectedEventId) {
          setDistributions(res.data.distributions as unknown as PrintDistribution[]);
          setPaidPayments(res.data.payments as unknown as Payment[]);
          setAllStudents(res.data.students as unknown as Student[]);
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data' });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [selectedEventId]);


  const studentsWhoPaid = useMemo(() => {
    if (!allStudents || !paidPayments || !distributions || !selectedEventId) return [];

    const eventPaidStudentIds = paidPayments
      .filter(p => p.eventId === selectedEventId)
      .map(p => p.studentId);

    const eventDistributedStudentIds = distributions
      .filter(d => d.eventId === selectedEventId)
      .map(d => d.studentId);

    return allStudents.filter(s => eventPaidStudentIds.includes(s.id) && !eventDistributedStudentIds.includes(s.id));
  }, [allStudents, paidPayments, distributions, selectedEventId]);


  const filteredStudents = useMemo(() => {
    if (!searchValue) return studentsWhoPaid;
    return studentsWhoPaid.filter(
      (student) =>
        student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, studentsWhoPaid]);

  const selectedEvent = printEvents?.find(e => e.id === selectedEventId);

  const handleDistribute = async () => {
    if (selectedStudent && selectedEventId && selectedEvent) {
      setIsSubmitting(true);

      const res = await distributePrint({
        studentId: selectedStudent.id,
        eventId: selectedEventId,
      });

      if (res.success) {
        const emailResult = await sendPrintDistributionEmail({
          studentName: selectedStudent.name,
          studentEmail: selectedStudent.email,
          eventName: selectedEvent.name,
        });

        if (emailResult.success) {
          toast({
            title: 'Print Distributed & Email Sent',
            description: `${selectedStudent.name} has received their prints and an email has been sent.`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Print Distributed, but Email Failed',
            description: `The print for ${selectedStudent.name} was marked as distributed, but the email failed to send. Reason: ${emailResult.message}`,
          });
        }

        // Refresh data
        const newData = await getPrintData();
        if (newData.success && newData.data) {
          setDistributions(newData.data.distributions as unknown as PrintDistribution[]);
        }

        setSelectedStudent(null);
        setSearchValue('');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to distribute print' });
      }

      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };


  if (isLoading) {
    return <PageLoader message="Loading print distribution data..." />;
  }

  return (
    <div className="grid gap-8">
      <GlassCard>
        <CardHeader>
          <CardTitle>Print Distribution</CardTitle>
          <CardDescription>
            Manage the distribution of prints to students who have paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="grid gap-2">
            <Label>Select Print Event</Label>
            <Select onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {printEvents?.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="student">Search Student (Name or Roll No.)</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={!selectedEventId || studentsWhoPaid.length === 0}
                >
                  {selectedStudent
                    ? `${selectedStudent.name} (${selectedStudent.rollNo})`
                    : studentsWhoPaid.length > 0 ? 'Select student...' : 'All prints distributed'}
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
                    <CommandEmpty>No student found.</CommandEmpty>
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
                            <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled={!selectedStudent || isSubmitting} onClick={handleDistribute}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
            Mark as Distributed
          </Button>
        </CardFooter>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>
            A log of all students who have received their prints for the selected event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="grid gap-4 md:hidden">
            {filteredDistributions?.map(dist => (
              <GlassCard key={dist.id} variant="bordered" className="bg-white/5">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{dist.studentName}</p>
                    <p className="text-sm text-muted-foreground">{dist.studentRoll}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{formatDate(dist.distributedAt)}</p>
                    <p>{new Date(dist.distributedAt).toLocaleTimeString()}</p>
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
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Date Distributed</TableHead>
                  <TableHead>Time Distributed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistributions?.map(dist => (
                  <TableRow key={dist.id}>
                    <TableCell className="font-medium">{dist.studentName}</TableCell>
                    <TableCell>{dist.studentRoll}</TableCell>
                    <TableCell>{formatDate(dist.distributedAt)}</TableCell>
                    <TableCell>{new Date(dist.distributedAt).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredDistributions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No distribution history for this event yet.
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}
