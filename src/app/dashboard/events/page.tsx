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
import { getEvents, createEvent, updateEvent, deleteEvent, saveDraft } from '@/actions/events';
import { getStudents } from '@/actions/students';
import type { Event, Student } from '@/lib/types';
import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoader } from '@/components/ui/page-loader';
import { useDebounce } from '@/hooks/use-debounce';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    const [deadline, setDeadline] = useState<Date | undefined>(new Date());
    const [category, setCategory] = useState<'Normal' | 'Print'>('Normal');
    const [paymentOptions, setPaymentOptions] = useState<string[]>(['Razorpay']);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Debounced values for autosave
    const debouncedName = useDebounce(name, 1000);
    const debouncedDescription = useDebounce(description, 1000);
    const debouncedCost = useDebounce(cost, 1000);

    // Autosave Effect
    useEffect(() => {
        // Skip initial load or reset
        if (!isDialogOpen) return;

        const saveData = async () => {
            setSavingStatus('saving');
            // Ensure cost is number
            const numCost = parseFloat(cost);
            // Don't save if cost is invalid (unless it's empty, but cost=0 default)

            const res = await saveDraft({
                id: editingEvent?.id,
                name,
                description,
                cost: parseFloat(cost) || 0,
                deadline: deadline?.toISOString(),
                category,
                paymentOptions,
                selectedStudents
            });

            if (res.success && res.data) {
                setSavingStatus('saved');
                if (!editingEvent?.id) {
                    setEditingEvent(res.data as unknown as Event);
                }
            } else {
                setSavingStatus('error');
            }
        };

        if (name || description || cost) {
            saveData();
        }

    }, [debouncedName, debouncedDescription, debouncedCost, category, paymentOptions, selectedStudents, deadline]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.includes(searchQuery) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
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

        // Final publish
        const eventData = {
            name,
            description,
            cost: parseFloat(cost),
            deadline: deadline.toISOString(),
            category,
            paymentOptions,
            selectedStudents,
        };

        // Optimistic UI update helpers
        const optimisticEventBase = {
            name,
            description,
            cost: parseFloat(cost),
            deadline: deadline.toISOString(),
            category,
            paymentOptions,
            participantIds: selectedStudents,
            // Preserve or init stats
            status: 'PUBLISHED',
            participantCount: selectedStudents.length,
            updatedAt: new Date().toISOString(),
        };

        // We use updateEvent to set status to PUBLISHED 
        let result;
        if (editingEvent?.id) {
            // Optimistic Update
            setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...optimisticEventBase } as Event : e));
            setIsDialogOpen(false); // Close immediately

            result = await updateEvent(editingEvent.id, eventData);
        } else {
            // Optimistic Create (Harder without ID, so we skip optimistic append and just rely on background fetch, but close dialog)
            setIsDialogOpen(false); // Close immediately
            result = await createEvent(eventData);
        }

        if (result.success) {
            toast({
                title: 'Event Published',
                description: `${name} has been published successfully`,
            });
            resetForm();
            fetchData(true); // Background refresh
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            // Ideally revert optimistic update here if needed, but for now simple error toast
            if (editingEvent?.id) fetchData(true); // Revert to server state
        }
    };
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        // Optimistic update
        const previousEvents = [...events];
        setEvents(events.filter(e => e.id !== deleteId));
        setDeleteId(null); // Close dialog immediately

        const result = await deleteEvent(deleteId);

        if (result.success) {
            toast({ title: 'Event Deleted', description: 'Event has been deleted successfully' });
            // No need to fetchData(), local state is already updated
        } else {
            // Revert on failure
            setEvents(previousEvents);
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setName(event.name);
        setDescription(event.description);
        setCost(event.cost.toString());
        setDeadline(new Date(event.deadline));
        setCategory(event.category as 'Normal' | 'Print');
        setPaymentOptions(event.paymentOptions);
        setSelectedStudents(event.participantIds || []);
        setIsDialogOpen(true);
        setSavingStatus('saved');
    };

    const resetForm = () => {
        setEditingEvent(null);
        setName('');
        setDescription('');
        setCost('');
        setDeadline(new Date());
        setCategory('Normal');
        setPaymentOptions(['Razorpay']);
        setSelectedStudents(students.map(s => s.id));
        setSearchQuery('');
        setSavingStatus('idle');
    };

    const copyPaymentLink = (eventId: string) => {
        const link = `${window.location.origin}/pay/${eventId}`;
        navigator.clipboard.writeText(link);
        toast({ title: 'Link Copied', description: 'Payment link copied to clipboard' });
    };

    // Helper to check if event has payments to calculate progress
    const getCollectionProgress = (event: Event) => {
        if (students.length === 0) return 0;

        const paidStudentsCount = event.payments
            ? new Set(event.payments.filter(p => p.status === 'Paid').map(p => p.studentId)).size
            : 0;

        const totalParticipants = event.participantCount || students.length;
        if (totalParticipants === 0) return 0;
        return (paidStudentsCount / totalParticipants) * 100;
    };

    if (isLoading) {
        return <PageLoader message="Loading events..." />;
    }



    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Events</h2>
                    <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
                        Manage fund collection events and track payments
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        if (!open) {
                            fetchData(true); // Background refresh on close
                        }
                        setIsDialogOpen(open);
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="gap-2 gradient-primary w-full md:w-auto">
                                <Plus className="h-4 w-4" />
                                Create Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <div className="flex items-center justify-between">
                                        <DialogTitle>{editingEvent ? (editingEvent.status === 'DRAFT' ? 'Edit Draft' : 'Edit Event') : 'Create New Event'}</DialogTitle>
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest">
                                            {savingStatus === 'saving' ? 'Saving...' : savingStatus === 'saved' ? 'Saved' : ''}
                                        </span>
                                    </div>
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
                                                    className="rounded-sm"
                                                />
                                                <label htmlFor="normal" className="text-sm cursor-pointer">Normal</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="print"
                                                    checked={category === 'Print'}
                                                    onCheckedChange={() => setCategory('Print')}
                                                    className="rounded-sm"
                                                />
                                                <label htmlFor="print" className="text-sm cursor-pointer">Print</label>
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

                                <DialogFooter className="gap-2 sm:gap-0">
                                    <div className="flex gap-2 w-full justify-end">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {editingEvent?.status === 'PUBLISHED' ? 'Update Event' : 'Publish Event'}
                                        </Button>
                                    </div>
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
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">{event.name}</CardTitle>
                                            {event.status === 'DRAFT' && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs px-2 py-0.5 h-5"
                                                >
                                                    Draft
                                                </Badge>
                                            )}
                                        </div>
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
                                        <span className="font-medium">{getCollectionProgress(event).toFixed(1)}%</span>
                                    </div>
                                    <Progress value={getCollectionProgress(event)} className="h-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-xs">Collected</span>
                                        <span className="font-medium text-emerald-600">₹{event.totalCollected?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-muted-foreground text-xs">Students Paid</span>
                                        <span className="font-medium">{event.paidCount || 0} / {event.participantCount || 0}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Link href={`/dashboard/events/${event.id}/payments`} className="w-full block">
                                        <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <Eye className="h-4 w-4" />
                                            View Payments
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </GlassCard>
                    ))
                    }
                </div >
            )}

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event
                            and all associated payments and records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Event
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
