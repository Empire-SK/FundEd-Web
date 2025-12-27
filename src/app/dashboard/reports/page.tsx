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
                ? `Event_Report_${selectedEvent}`
                : reportType === 'summary'
                    ? 'Transaction_Summary'
                    : reportType === 'student'
                        ? 'Student_Wise_Report'
                        : 'Transaction_Report';

            const res = await exportToCSV(transactions, filename, reportSummary);

            if (res.success && res.data) {
                // Create blob with UTF-8 BOM for Excel compatibility
                const BOM = '\uFEFF';
                const csvContent = BOM + res.data.csv;
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                // Generate a robust filename with date
                const dateStr = new Date().toISOString().split('T')[0];
                const finalFilename = `${filename}_${dateStr}.csv`;

                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', finalFilename); // Explicitly set download attribute
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

    const handleDownloadPDF = async () => {
        if (transactions.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No data to export' });
            return;
        }

        try {
            // Dynamically import jsPDF to avoid SSR issues
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();

            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('FundEd - Report', 14, 20);

            // Add report type
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            const reportTypeText = reportType === 'event'
                ? 'Event-wise Report'
                : reportType === 'summary'
                    ? 'Transaction Summary'
                    : reportType === 'student'
                        ? 'Student-wise Report'
                        : 'Transaction Report';
            doc.text(reportTypeText, 14, 28);

            let yPosition = 35;

            // Add summary if available
            if (reportSummary) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Summary', 14, yPosition);
                yPosition += 8;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                const summaryData = [
                    ['Total Transactions', (reportSummary.totalTransactions || 0).toString()],
                    ['Total Collected', `₹${(reportSummary.totalCollected || reportSummary.paidAmount || 0).toLocaleString()}`],
                    ['Pending Amount', `₹${(reportSummary.totalPending || reportSummary.pendingAmount || 0).toLocaleString()}`],
                    ['Paid Count', (reportSummary.paidCount || 0).toString()],
                ];

                autoTable(doc, {
                    startY: yPosition,
                    head: [],
                    body: summaryData,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 60 },
                        1: { cellWidth: 'auto' }
                    }
                });

                yPosition = (doc as any).lastAutoTable.finalY + 10;
            }

            // Add transactions table
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Transactions', 14, yPosition);
            yPosition += 5;

            if (transactions.length > 0) {
                const headers = Object.keys(transactions[0]);
                const data = transactions.map(t => Object.values(t).map(String));

                autoTable(doc, {
                    startY: yPosition,
                    head: [headers],
                    body: data,
                    theme: 'striped',
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                });
            }

            // Generate filename
            const filename = reportType === 'event'
                ? `Event_Report_${selectedEvent}`
                : reportType === 'summary'
                    ? 'Transaction_Summary'
                    : reportType === 'student'
                        ? 'Student_Wise_Report'
                        : 'Transaction_Report';

            const dateStr = new Date().toISOString().split('T')[0];
            const finalFilename = `${filename}_${dateStr}.pdf`;

            // Save PDF
            doc.save(finalFilename);

            toast({ title: 'Downloaded', description: 'PDF report downloaded successfully' });
        } catch (error) {
            console.error('PDF Download Error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to download PDF' });
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
            <GlassCard className="p-4 sm:p-6 hover-lift">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Report Configuration</h3>
                </div>

                <div className="space-y-4">
                    {/* First Row: Report Type and Event Selection */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
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
                    </div>

                    {/* Second Row: Date Range */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
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
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button onClick={handleGenerateReport} disabled={isLoading} className="gap-2 w-full sm:w-auto text-white">
                        <Filter className="h-4 w-4" />
                        {isLoading ? 'Generating...' : 'Generate Report'}
                    </Button>

                    {transactions.length > 0 && (
                        <>
                            <Button onClick={handleDownloadCSV} variant="outline" className="gap-2 w-full sm:w-auto">
                                <Download className="h-4 w-4" />
                                Download CSV
                            </Button>
                            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2 w-full sm:w-auto">
                                <FileText className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </>
                    )}
                </div>
            </GlassCard>

            {/* Summary Cards */}
            {
                reportSummary && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
                        <GlassCard className="hover-lift">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportSummary.totalTransactions || 0}</div>
                            </CardContent>
                        </GlassCard>

                        <GlassCard className="hover-lift border-green-200/20 dark:border-green-900/50 bg-green-500/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ₹{(reportSummary.totalCollected || reportSummary.paidAmount || 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </GlassCard>

                        <GlassCard className="hover-lift border-orange-200/20 dark:border-orange-900/50 bg-orange-500/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    ₹{(reportSummary.totalPending || reportSummary.pendingAmount || 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </GlassCard>

                        <GlassCard className="hover-lift">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Paid Count</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportSummary.paidCount || 0}</div>
                            </CardContent>
                        </GlassCard>
                    </div>
                )
            }

            {/* Transaction Preview */}
            {
                transactions.length > 0 && (
                    <GlassCard className="shadow-md animate-slide-up">
                        <CardHeader>
                            <CardTitle>Transaction Preview</CardTitle>
                            <CardDescription>
                                Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
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
                    </GlassCard>
                )
            }

            {
                transactions.length === 0 && !isLoading && (
                    <GlassCard className="py-12">
                        <CardContent className="text-center">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No Report Generated</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure filters above and click "Generate Report" to view data
                            </p>
                        </CardContent>
                    </GlassCard>
                )
            }
        </div >
    );
}
