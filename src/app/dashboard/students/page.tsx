'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Upload,
    Search,
    MoreVertical,
    Eye,
    Trash2,
    DollarSign,
    Mail,
    User,
    GraduationCap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudents, deleteStudent, uploadStudentsCsv } from '@/actions/students';
import { getEvents } from '@/actions/events';
import type { Student, Event } from '@/lib/types';
import { GlassCard } from '@/components/ui/glass-card';
import { AddStudentDialog } from '@/components/add-student-dialog';
import { CSVDropzone } from '@/components/csv-dropzone';
import Papa from 'papaparse';

import { PageLoader } from '@/components/ui/page-loader';

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const [studentsRes, eventsRes] = await Promise.all([
            getStudents(),
            getEvents()
        ]);

        if (studentsRes.success && studentsRes.students) {
            setStudents(studentsRes.students as unknown as Student[]);
        }

        if (eventsRes.success && eventsRes.data) {
            setEvents(eventsRes.data as unknown as Event[]);
        }

        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this student?')) return;

        const result = await deleteStudent(id);
        if (result.success) {
            toast({ title: 'Student Deleted', description: 'Student has been deleted successfully' });
            fetchData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        setIsUploading(true);

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const studentsData = results.data
                    .map((row: any) => {
                        // Normalize keys to lowercase for flexible matching
                        const normalizedRow: any = {};
                        Object.keys(row).forEach(key => {
                            const lowerKey = key.toLowerCase().trim();
                            if (lowerKey === 'name' || lowerKey === 'student name') normalizedRow.name = row[key];
                            else if (lowerKey.includes('roll') || lowerKey === 'id') normalizedRow.rollNo = row[key];
                            else if (lowerKey.includes('mail')) normalizedRow.email = row[key];
                            else if (lowerKey === 'class' || lowerKey === 'grade') normalizedRow.class = row[key];
                            else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) normalizedRow.phone = row[key];
                        });
                        return normalizedRow;
                    })
                    .filter((row: any) => row.name && row.rollNo) // Basic validation
                    .map((row: any) => ({
                        name: row.name,
                        rollNo: row.rollNo,
                        email: row.email,
                        class: row.class || 'N/A', // Default if missing
                        phone: row.phone,
                    }));

                if (studentsData.length === 0) {
                    toast({ variant: 'destructive', title: 'Error', description: 'No valid student data found in CSV' });
                    setIsUploading(false);
                    return;
                }

                const result = await uploadStudentsCsv(studentsData);
                if (result.success) {
                    toast({
                        title: 'Students Uploaded',
                        description: `Successfully uploaded ${result.count} students`,
                    });
                    fetchData();
                    setUploadDialogOpen(false);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                }
                setIsUploading(false);
            },
            error: () => {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to parse CSV file' });
                setIsUploading(false);
            },
        });
    };

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (isLoading) {
        return <PageLoader message="Loading students..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Students</h2>
                    <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
                        Manage student records and payment history
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <AddStudentDialog onSuccess={fetchData} />

                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-500/50 w-full sm:w-auto">
                                <Upload className="h-4 w-4" />
                                Upload CSV
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-black/95 border-white/10 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-white">Import Students from CSV</DialogTitle>
                                <DialogDescription className="text-stone-400">
                                    Upload a CSV file to bulk import student records
                                </DialogDescription>
                            </DialogHeader>
                            <CSVDropzone
                                onFileSelect={handleFileUpload}
                                isUploading={isUploading}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search Bar */}
            <GlassCard className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, roll number, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </GlassCard>

            {/* Students Grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Card key={i} className="skeleton h-48" />
                    ))}
                </div>
            ) : filteredStudents.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">
                            {searchQuery ? 'No students found' : 'No Students Yet'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Upload a CSV file to add students'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredStudents.map((student) => (
                        <GlassCard key={student.id} className="group hover-lift relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-12 -mt-12" />

                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                                            <AvatarFallback className="bg-gradient-primary text-white">
                                                {getInitials(student.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{student.name}</CardTitle>
                                            <CardDescription className="text-xs">{student.rollNo}</CardDescription>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/students/${student.id}/payments`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Payments
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(student.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="truncate">{student.email || 'Not available'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    <span>{student.class}</span>
                                </div>
                            </CardContent>

                            <div className="px-6 pb-4">
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Link href={`/dashboard/students/${student.id}/payments`}>
                                        View Payment History
                                    </Link>
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Stats Footer */}
            {!isLoading && students.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>
                        Showing {filteredStudents.length} of {students.length} students
                    </p>
                </div>
            )}
        </div>
    );
}
