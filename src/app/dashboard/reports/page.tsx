'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Event } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateTransactionReport, generateEventReport, exportToCSV, generateTransactionSummary, generateStudentWiseReport } from '@/actions/reports';
import { getEvents } from '@/actions/events';
import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoader } from '@/components/ui/page-loader';

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

export default function ReportsPage() {
    const [reportType, setReportType] = useState<'transaction' | 'event' | 'summary' | 'student'>('transaction');
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reportSummary, setReportSummary] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchEvents = async () => {
            const res = await getEvents();
            if (res.success && res.data) {
                setEvents(res.data as unknown as Event[]);
            }
            setIsLoading(false);
        };
        fetchEvents();
    }, []);

    const handleGenerateReport = async () => {
        setIsLoading(true);

        if (reportType === 'event') {
            if (!selectedEvent) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please select an event' });
                setIsLoading(false);
                return;
            }

            const res = await generateEventReport(selectedEvent, {
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
            });

            if (res.success && res.data) {
                setTransactions(res.data.transactions);
                setReportSummary(res.data.summary);
                toast({ title: 'Report Generated', description: 'Event report generated successfully' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error });
            }
        } else if (reportType === 'summary') {
            const res = await generateTransactionSummary({
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
            });

            if (res.success && res.data) {
                setTransactions(res.data.transactions);
                setReportSummary(res.data.summary);
                toast({ title: 'Report Generated', description: 'Transaction summary generated successfully' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error });
            }
        } else if (reportType === 'student') {
            const res = await generateStudentWiseReport({
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
            });

            if (res.success && res.data) {
                setTransactions(res.data.transactions);
                setReportSummary(res.data.summary);
                toast({ title: 'Report Generated', description: 'Student-wise report generated successfully' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error });
            }
        } else {
            const res = await generateTransactionReport({
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
                eventId: selectedEvent || undefined,
            });

            if (res.success && res.data) {
                setTransactions(res.data.transactions);
                setReportSummary(res.data.summary);
                toast({ title: 'Report Generated', description: 'Transaction report generated successfully' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error });
            }
        }

        setIsLoading(false);
    };

    const handleDownloadCSV = async () => {
        if (transactions.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No data to export' });
            return;
        }

        try {
            const filename = reportType === 'event'
                ? `event_report_${selectedEvent}`
                : reportType === 'summary'
                    ? 'transaction_summary'
                    : reportType === 'student'
                        ? 'student_wise_report'
                        : 'transaction_report';

            const res = await exportToCSV(transactions, filename, reportSummary);

            if (res.success && res.data) {
                // Create blob with UTF-8 BOM for Excel compatibility
                const BOM = '\uFEFF';
                const csvContent = BOM + res.data.csv;
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = res.data.filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 100);

                toast({ title: 'Downloaded', description: 'Report downloaded successfully' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to export' });
            }
        } catch (error) {
            console.error('CSV Download Error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to download CSV' });
        }
    };

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const variant = getStatusBadgeVariant(status as any);
        return (
            <Badge variant={variant as any}>
                {status}
            </Badge>
        );
    };

    if (isLoading) {
        return <PageLoader message="Loading reports..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                <p className="text-muted-foreground mt-2">
                    Generate detailed reports and download transaction data
                </p>
            </div>

            {/* Report Configuration */}
            <GlassCard className="p-6 hover-lift">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Report Configuration</h3>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="grid gap-2">
                        <Label htmlFor="report-type">Report Type</Label>
                        <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                            <SelectTrigger id="report-type">
                                <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="transaction">All Transactions</SelectItem>
                                <SelectItem value="event">Event-wise Report</SelectItem>
                                <SelectItem value="summary">Transaction Summary</SelectItem>
                                <SelectItem value="student">Student-wise Report</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {reportType === 'event' && (
                        <div className="grid gap-2">
                            <Label htmlFor="event">Select Event</Label>
                            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                                <SelectTrigger id="event">
                                    <SelectValue placeholder="Select event" />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map(event => (
                                        <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="date-from">Date From</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-from"
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !dateFrom && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date-to">Date To</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-to"
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !dateTo && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? format(dateTo, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button onClick={handleGenerateReport} disabled={isLoading} className="gap-2 w-full sm:w-auto">
                        <Filter className="h-4 w-4" />
                        {isLoading ? 'Generating...' : 'Generate Report'}
                    </Button>

                    {transactions.length > 0 && (
                        <Button onClick={handleDownloadCSV} variant="outline" className="gap-2 w-full sm:w-auto">
                            <Download className="h-4 w-4" />
                            Download CSV
                        </Button>
                    )}
                </div>
            </GlassCard>

            {/* Summary Cards */}
            {
                reportSummary && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
                        <Card className="hover-lift">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportSummary.totalTransactions || 0}</div>
                            </CardContent>
                        </Card>

                        <Card className="hover-lift border-green-200 dark:border-green-900">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ₹{(reportSummary.totalCollected || reportSummary.paidAmount || 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover-lift border-orange-200 dark:border-orange-900">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    ₹{(reportSummary.totalPending || reportSummary.pendingAmount || 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover-lift">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Paid Count</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportSummary.paidCount || 0}</div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Transaction Preview */}
            {
                transactions.length > 0 && (
                    <Card className="shadow-md animate-slide-up">
                        <CardHeader>
                            <CardTitle>Transaction Preview</CardTitle>
                            <CardDescription>
                                Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {Object.keys(transactions[0]).map((key) => (
                                                <TableHead key={key} className="text-center whitespace-nowrap">{key}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.slice(0, 10).map((transaction, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/50">
                                                {Object.values(transaction).map((value: any, i) => (
                                                    <TableCell key={i} className="text-center">
                                                        {i === Object.keys(transaction).indexOf('Status') ? (
                                                            <div className="flex justify-center">
                                                                <StatusBadge status={value} />
                                                            </div>
                                                        ) : (
                                                            value
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {transactions.length > 10 && (
                                <p className="text-sm text-muted-foreground mt-4 text-center">
                                    Showing first 10 of {transactions.length} transactions. Download CSV for full report.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            {
                transactions.length === 0 && !isLoading && (
                    <Card className="py-12">
                        <CardContent className="text-center">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No Report Generated</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure filters above and click "Generate Report" to view data
                            </p>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}
