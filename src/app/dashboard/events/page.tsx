'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Link as LinkIcon,
    Calendar as CalendarIcon,
    Wallet,
    TrendingUp,
    DollarSign,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/actions/events';
import { getStudents } from '@/actions/students';
import type { Event, Student } from '@/lib/types';
import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoader } from '@/components/ui/page-loader';

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [cost, setCost] = useState('');
    const [deadline, setDeadline] = useState<Date>();
    const [category, setCategory] = useState<'Normal' | 'Print'>('Normal');
    const [paymentOptions, setPaymentOptions] = useState<string[]>(['Razorpay']);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.includes(searchQuery) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const [eventsRes, studentsRes] = await Promise.all([
            getEvents(),
            getStudents()
        ]);

        if (eventsRes.success && eventsRes.data) {
            setEvents(eventsRes.data as unknown as Event[]);
        }

        if (studentsRes.success && studentsRes.students) {
            setStudents(studentsRes.students as unknown as Student[]);
        }

        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !description || !cost || !deadline) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields' });
            return;
        }

        const eventData = {
            name,
            description,
            cost: parseFloat(cost),
            deadline: deadline.toISOString(),
            category,
            paymentOptions,
            selectedStudents,
        };

        const result = editingEvent
            ? await updateEvent(editingEvent.id, eventData)
            : await createEvent(eventData);

        if (result.success) {
            toast({
                title: editingEvent ? 'Event Updated' : 'Event Created',
                description: `${name} has been ${editingEvent ? 'updated' : 'created'} successfully`,
            });
            setIsDialogOpen(false);
            resetForm();
            fetchData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        const result = await deleteEvent(id);
        if (result.success) {
            toast({ title: 'Event Deleted', description: 'Event has been deleted successfully' });
            fetchData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setName(event.name);
        setDescription(event.description);
        setCost(event.cost.toString());
        setDeadline(new Date(event.deadline));
        setCategory(event.category);
        setPaymentOptions(event.paymentOptions);
        setSelectedStudents(event.participantIds || []);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingEvent(null);
        setName('');
        setDescription('');
        setCost('');
        setDeadline(undefined);
        setCategory('Normal');
        setPaymentOptions(['Razorpay']);
        setSelectedStudents(students.map(s => s.id)); // Default to all
        setSearchQuery('');
    };

    const copyPaymentLink = (eventId: string) => {
        const link = `${window.location.origin}/pay/${eventId}`;
        navigator.clipboard.writeText(link);
        toast({ title: 'Link Copied', description: 'Payment link copied to clipboard' });
    };

    const getCollectionProgress = (event: Event) => {
        if (students.length === 0) return 0;

        // Count unique students who have paid for this event
        const paidStudentsCount = event.payments
            ? new Set(event.payments.filter(p => p.status === 'Paid').map(p => p.studentId)).size
            : 0;

        // Calculate percentage: (paid students / total participants) * 100
        const totalParticipants = event.participantCount || students.length; // Fallback for safety
        if (totalParticipants === 0) return 0;
        return (paidStudentsCount / totalParticipants) * 100;
    };

    if (isLoading) {
        return <PageLoader message="Loading events..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Events</h2>
                    <p className="text-muted-foreground mt-2">
                        Manage fund collection events and track payments
                    </p>
                </div>


                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="gap-2 gradient-primary">
                                <Plus className="h-4 w-4" />
                                Create Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                                    <DialogDescription>
                                        {editingEvent ? 'Update event details' : 'Create a new fund collection event'}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Event Name *</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Annual Day Fund"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe the event..."
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="cost">Cost (₹) *</Label>
                                            <Input
                                                id="cost"
                                                type="number"
                                                step="0.01"
                                                value={cost}
                                                onChange={(e) => setCost(e.target.value)}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Deadline *</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'justify-start text-left font-normal',
                                                            !deadline && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={deadline}
                                                        onSelect={setDeadline}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Category</Label>
                                        <div className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="normal"
                                                    checked={category === 'Normal'}
                                                    onCheckedChange={() => setCategory('Normal')}
                                                />
                                                <label htmlFor="normal" className="text-sm cursor-pointer">
                                                    Normal
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="print"
                                                    checked={category === 'Print'}
                                                    onCheckedChange={() => setCategory('Print')}
                                                />
                                                <label htmlFor="print" className="text-sm cursor-pointer">
                                                    Print
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Participants ({selectedStudents.length} selected)</Label>
                                        <div className="flex items-center justify-between border rounded-md p-3 bg-muted/20">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="main-select-all"
                                                    checked={selectedStudents.length === students.length && students.length > 0}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedStudents(students.map(s => s.id));
                                                        } else {
                                                            setSelectedStudents([]);
                                                        }
                                                    }}
                                                />
                                                <label htmlFor="main-select-all" className="text-sm font-medium cursor-pointer">
                                                    Select All
                                                </label>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsSelectionDialogOpen(true)}
                                            >
                                                Select Specific
                                            </Button>
                                        </div>
                                    </div>

                                    <Dialog open={isSelectionDialogOpen} onOpenChange={setIsSelectionDialogOpen}>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Select Participants</DialogTitle>
                                                <DialogDescription>
                                                    Search and select students for this event.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="py-4 space-y-4">
                                                <Input
                                                    placeholder="Search by name, class or roll no..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                />

                                                <div className="border rounded-md p-3 max-h-[60vh] overflow-y-auto space-y-2">
                                                    <div className="flex items-center space-x-2 pb-2 border-b mb-2 sticky top-0 bg-background/95 backdrop-blur z-10">
                                                        <Checkbox
                                                            id="modal-select-all"
                                                            checked={selectedStudents.length === students.length && students.length > 0}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedStudents(students.map(s => s.id));
                                                                } else {
                                                                    setSelectedStudents([]);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor="modal-select-all" className="text-sm font-medium cursor-pointer">
                                                            Select All
                                                        </label>
                                                    </div>

                                                    {filteredStudents.map((student) => (
                                                        <div key={student.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`student-${student.id}`}
                                                                checked={selectedStudents.includes(student.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedStudents([...selectedStudents, student.id]);
                                                                    } else {
                                                                        setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                                                    }
                                                                }}
                                                            />
                                                            <label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer flex-1">
                                                                {student.name} <span className="text-muted-foreground text-xs">({student.class} - {student.rollNo})</span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                    {filteredStudents.length === 0 && (
                                                        <p className="text-sm text-muted-foreground text-center py-2">No students match your search.</p>
                                                    )}
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button type="button" onClick={() => setIsSelectionDialogOpen(false)}>
                                                    Done
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="grid gap-2">
                                        <Label>Payment Options</Label>
                                        <div className="flex gap-4">
                                            {['Razorpay', 'QR', 'Cash'].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={option}
                                                        checked={paymentOptions.includes(option)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setPaymentOptions([...paymentOptions, option]);
                                                            } else {
                                                                setPaymentOptions(paymentOptions.filter((o) => o !== option));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={option} className="text-sm cursor-pointer">
                                                        {option}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingEvent ? 'Update Event' : 'Create Event'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Events Grid */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="skeleton h-64" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No Events Yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create your first fund collection event to get started
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <GlassCard key={event.id} className="group hover-lift relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />

                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{event.name}</CardTitle>
                                        <CardDescription className="mt-1">{event.description}</CardDescription>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 relative z-10">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/events/${event.id}/payments`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Payments
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(event)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => copyPaymentLink(event.id)}>
                                                <LinkIcon className="mr-2 h-4 w-4" />
                                                Copy Payment Link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(event.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Cost per student</span>
                                    <span className="font-semibold text-lg">₹{event.cost.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Deadline</span>
                                    <Badge variant="outline">
                                        {format(new Date(event.deadline), 'MMM dd, yyyy')}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Collection Progress</span>
                                        <span className="font-medium">{Math.round(getCollectionProgress(event))}%</span>
                                    </div>
                                    <Progress value={getCollectionProgress(event)} className="h-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                                        <p className="text-xs text-muted-foreground">Collected</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            ₹{(event.totalCollected || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-green-600/80">
                                            {(() => {
                                                const uniquePaid = event.payments
                                                    ? new Set(event.payments.filter(p => p.status === 'Paid').map(p => p.studentId)).size
                                                    : 0;
                                                return `${uniquePaid} Students`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                                        <p className="text-xs text-muted-foreground">Pending</p>
                                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                            ₹{(event.totalPending || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-orange-600/80">
                                            {(() => {
                                                const uniquePaid = event.payments
                                                    ? new Set(event.payments.filter(p => p.status === 'Paid').map(p => p.studentId)).size
                                                    : 0;
                                                const total = event.participantCount || students.length;
                                                return `${Math.max(0, total - uniquePaid)} Students`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex gap-2">
                                <Button asChild variant="outline" className="flex-1" size="sm">
                                    <Link href={`/dashboard/events/${event.id}/payments`}>
                                        <Users className="mr-2 h-4 w-4" />
                                        View Payments
                                    </Link>
                                </Button>
                                <Button
                                    variant="default"
                                    className="flex-1"
                                    size="sm"
                                    onClick={() => copyPaymentLink(event.id)}
                                >
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Share Link
                                </Button>
                            </CardFooter>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
