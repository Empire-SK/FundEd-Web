'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown, DollarSign, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { recordCashPayment } from '@/actions/manual-payments';
import type { Student, Event, Payment } from '@/lib/types';
import { format } from 'date-fns';

interface RecordCashPaymentDialogProps {
    students: Student[];
    events: Event[];
    payments?: Payment[];  // Add payments to filter out paid students
    preSelectedStudent?: Student;
    preSelectedEvent?: Event;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function RecordCashPaymentDialog({
    students,
    events,
    payments = [],  // Default to empty array
    preSelectedStudent,
    preSelectedEvent,
    trigger,
    onSuccess,
}: RecordCashPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Form state
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(preSelectedStudent || null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(preSelectedEvent || null);
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');

    // Popover states
    const [studentOpen, setStudentOpen] = useState(false);
    const [eventOpen, setEventOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [eventSearch, setEventSearch] = useState('');

    // Update amount when event is selected
    useEffect(() => {
        if (selectedEvent) {
            setAmount(selectedEvent.cost.toString());
        }
    }, [selectedEvent]);

    // Filter students who haven't paid for the selected event
    const getUnpaidStudents = () => {
        if (!selectedEvent) return students;

        // Get student IDs who have already paid for this event
        const paidStudentIds = payments
            .filter(p => p.eventId === selectedEvent.id && p.status === 'Paid')
            .map(p => p.studentId);

        // Return only students who haven't paid
        return students.filter(s => !paidStudentIds.includes(s.id));
    };

    const unpaidStudents = getUnpaidStudents();

    const filteredStudents = unpaidStudents.filter(
        (student) =>
            student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            student.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
    );

    // Debug logging
    useEffect(() => {
        console.log('RecordCashPaymentDialog - students prop:', students);
        console.log('RecordCashPaymentDialog - unpaid students:', unpaidStudents);
        console.log('RecordCashPaymentDialog - filtered students:', filteredStudents);
    }, [students, unpaidStudents, filteredStudents]);

    const filteredEvents = events.filter((event) =>
        event.name.toLowerCase().includes(eventSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStudent || !selectedEvent) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select both student and event',
            });
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: 'Please enter a valid amount',
            });
            return;
        }

        setIsSubmitting(true);

        const result = await recordCashPayment({
            studentId: selectedStudent.id,
            eventId: selectedEvent.id,
            amount: parseFloat(amount),
            paymentDate: paymentDate.toISOString(),
            notes: notes || undefined,
            receiptNumber: receiptNumber || undefined,
        });

        if (result.success) {
            toast({
                title: 'Payment Recorded',
                description: `Cash payment of ₹${amount} recorded for ${selectedStudent.name}`,
            });
            setOpen(false);
            resetForm();
            onSuccess?.();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Failed to record payment',
            });
        }

        setIsSubmitting(false);
    };

    const resetForm = () => {
        if (!preSelectedStudent) setSelectedStudent(null);
        if (!preSelectedEvent) setSelectedEvent(null);
        setAmount('');
        setPaymentDate(new Date());
        setNotes('');
        setReceiptNumber('');
        setStudentSearch('');
        setEventSearch('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Record Cash Payment
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Record Cash Payment</DialogTitle>
                        <DialogDescription>
                            Manually record a cash payment received from a student. This will mark the payment as completed.
                        </DialogDescription>
                    </DialogHeader>


                    <div className="grid gap-4 py-4">
                        {/* Event Selector - NOW FIRST */}
                        <div className="grid gap-2">
                            <Label htmlFor="event">Event *</Label>
                            <Popover open={eventOpen} onOpenChange={setEventOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={eventOpen}
                                        className="justify-between"
                                        disabled={!!preSelectedEvent}
                                    >
                                        {selectedEvent ? selectedEvent.name : 'Select event...'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search events..."
                                            value={eventSearch}
                                            onValueChange={setEventSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No event found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredEvents.map((event) => (
                                                    <CommandItem
                                                        key={event.id}
                                                        value={event.name}
                                                        onSelect={() => {
                                                            setSelectedEvent(event);
                                                            setEventOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                selectedEvent?.id === event.id ? 'opacity-100' : 'opacity-0'
                                                            )}
                                                        />
                                                        <div>
                                                            <p className="font-medium">{event.name}</p>
                                                            <p className="text-xs text-muted-foreground">₹{event.cost}</p>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Student Selector - NOW SECOND (filtered by event) */}
                        <div className="grid gap-2">
                            <Label htmlFor="student">Student *</Label>
                            <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={studentOpen}
                                        className="justify-between"
                                        disabled={!!preSelectedStudent || !selectedEvent}
                                    >
                                        {selectedStudent
                                            ? `${selectedStudent.name} (${selectedStudent.rollNo})`
                                            : selectedEvent ? 'Select student...' : 'Select event first...'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search by name or roll no..."
                                            value={studentSearch}
                                            onValueChange={setStudentSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                {selectedEvent ? 'No unpaid student found.' : 'Please select an event first.'}
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {filteredStudents.map((student) => (
                                                    <CommandItem
                                                        key={student.id}
                                                        value={`${student.name} ${student.rollNo}`}
                                                        onSelect={() => {
                                                            setSelectedStudent(student);
                                                            setStudentOpen(false);
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
                                                            <p className="text-xs text-muted-foreground">
                                                                {student.rollNo} • {student.email}
                                                            </p>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Amount */}
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (₹) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="Enter amount going to pay"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        {/* Payment Date */}
                        <div className="grid gap-2">
                            <Label>Payment Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal',
                                            !paymentDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {paymentDate ? format(paymentDate, 'PPP') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={paymentDate}
                                        onSelect={(date) => date && setPaymentDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Receipt Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="receipt">Receipt Number (Optional)</Label>
                            <Input
                                id="receipt"
                                placeholder="e.g., RCP-001"
                                value={receiptNumber}
                                onChange={(e) => setReceiptNumber(e.target.value)}
                            />
                        </div>

                        {/* Notes */}
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add any additional notes about this payment..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
